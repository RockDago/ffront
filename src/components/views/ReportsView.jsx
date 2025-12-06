import React, { useState, useEffect, useMemo } from "react";
import {
    Eye,
    Trash2,
    X,
    Download,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Plus,
    Edit,
    UserCheck,
    Filter,
    Users,
    ChevronDown,
    ChevronUp,
    FileText,
    ArrowUpDown,
    AlertTriangle,
    Printer,
    GraduationCap,
    Briefcase,
    ShieldAlert,
    Tag,
    BarChart,
} from "lucide-react";
import API from "../../config/axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import repLogo from "../../assets/images/logo rep.png";
import mesupresLogo from "../../assets/images/logo mesupres.png";
import fosikaLogo from "../../assets/images/logo fosika.png";

const ReportsView = () => {
    const [currentTab, setCurrentTab] = useState("tous");
    const [filters, setFilters] = useState({
        search: "",
        statut: "",
        dateDebut: "",
        dateFin: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [activeCategory, setActiveCategory] = useState("tous");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReportForAction, setSelectedReportForAction] = useState(null);
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        auteur: true,
        description: true,
        pieces: true,
    });
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });

    const [newReport, setNewReport] = useState({
        category: "",
        description: "",
        files: [],
        name: "",
        email: "",
        phone: "",
        address: "",
        type: "identifie",
    });

    const [assignData, setAssignData] = useState({
        assignTo: "investigateur",
    });
    const [statusData, setStatusData] = useState({
        status: "",
    });
    const [editData, setEditData] = useState({});
    const [reportData, setReportData] = useState({
        type: "quotidien",
        dateDebut: new Date().toISOString().split("T")[0],
        dateFin: new Date().toISOString().split("T")[0],
        categories: [],
        notes: "",
    });
    const [generatedReport, setGeneratedReport] = useState(null);

    const categories = [
        {
            id: "faux-diplomes",
            icon: FileText,
            name: "Faux Diplômes",
        },
        {
            id: "offre-formation-irreguliere",
            icon: GraduationCap,
            name: "Offre de formation irrégulière (non habilité)",
        },
        {
            id: "recrutements-irreguliers",
            icon: Briefcase,
            name: "Recrutements Irréguliers",
        },
        {
            id: "harcelement",
            icon: AlertTriangle,
            name: "Harcèlement",
        },
        {
            id: "corruption",
            icon: ShieldAlert,
            name: "Corruption",
        },
        {
            id: "divers",
            icon: Tag,
            name: "Divers",
        },
    ];

    const assignToOptions = [
        { value: "investigateur", label: "Investigateur" },
        { value: "cac_daj", label: "DAAQ / CAC / DAJ" },
        { value: "autorite_competente", label: "Autorité compétente" },
    ];

    const fetchReports = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await API.get("/reports?per_page=1000");
            const result = response.data;

            if (result.success && Array.isArray(result.data)) {
                const mappedReports = result.data.map((report) => {
                    let filesArray = [];
                    try {
                        if (report.files) {
                            if (typeof report.files === "string") {
                                filesArray = JSON.parse(report.files);
                            } else if (Array.isArray(report.files)) {
                                filesArray = report.files;
                            }
                        }
                    } catch (e) {}

                    return {
                        id: report.id,
                        reference: report.reference,
                        date: report.created_at,
                        nom_prenom: report.is_anonymous
                            ? "Anonyme"
                            : report.name || "Non spécifié",
                        telephone: report.phone || "N/A",
                        email: report.email || "N/A",
                        categorie: report.category,
                        categorieLabel: report.category,
                        raison: report.title || "Non spécifié",
                        type_signalement: report.is_anonymous ? "Anonyme" : "Non-Anonyme",
                        explication: report.description || "Aucune description",
                        files: filesArray,
                        status: report.status || "en_cours",
                        assigned_to: report.assigned_to || "Non assigné",
                        city: report.city,
                        province: report.province,
                        region: report.region,
                        has_proof: report.has_proof || false,
                    };
                });

                setReports(mappedReports);
            } else {
                setReports([]);
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const calculateCategoryStats = (categoryId) => {
        if (categoryId === "tous") {
            const total = reports.length;
            const encours = reports.filter(
                (report) => report.status === "en_cours"
            ).length;
            const resolus = reports.filter(
                (report) => report.status === "finalise"
            ).length;
            return { total, encours, resolus };
        }

        const categoryReports = reports.filter(
            (report) => report.categorie === categoryId
        );
        const total = categoryReports.length;
        const encours = categoryReports.filter(
            (report) => report.status === "en_cours"
        ).length;
        const resolus = categoryReports.filter(
            (report) => report.status === "finalise"
        ).length;

        return { total, encours, resolus };
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch (e) {
            return dateString;
        }
    };

    const getDisplayStatus = (status) => {
        const statusMap = {
            en_cours: "En cours",
            investigation: "Investigation",
            transmis_autorite: "Transmis aux autorités compétentes",
            classifier: "Complété",
            finalise: "Finalisé",
            refuse: "Refusé",
        };
        return statusMap[status] || status;
    };

    const getDisplayAssignedTo = (assignedTo) => {
        const assignMap = {
            investigateur: "Investigateur",
            cac_daj: "DAAQ / CAC / DAJ",
            autorite_competente: "Autorité compétente",
        };
        return assignMap[assignedTo] || assignedTo || "Non assigné";
    };

    const allReports = useMemo(() => {
        const sortedReports = [...reports].sort((a, b) => {
            if (!sortConfig.key) return 0;

            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === "date") {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            if (sortConfig.key === "reference") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

        return sortedReports;
    }, [reports, sortConfig]);

    const filteredReports = useMemo(() => {
        let baseReports = [];

        switch (currentTab) {
            case "anonyme":
                baseReports = reports.filter((r) => r.type_signalement === "Anonyme");
                break;

            case "non-anonyme":
                baseReports = reports.filter(
                    (r) => r.type_signalement === "Non-Anonyme"
                );
                break;

            case "classifier":
                baseReports = reports.filter((r) => r.status === "classifier");
                break;

            case "assignes":
                baseReports = reports.filter(
                    (r) =>
                        r.assigned_to &&
                        r.assigned_to !== "Non assigné" &&
                        r.assigned_to !== "" &&
                        r.assigned_to !== null
                );
                break;

            default:
                baseReports = allReports;
        }

        if (activeCategory !== "tous") {
            baseReports = baseReports.filter(
                (report) => report.categorie === activeCategory
            );
        }

        // Filtre par date
        if (filters.dateDebut || filters.dateFin) {
            baseReports = baseReports.filter((report) => {
                const reportDate = new Date(report.date);
                const startDate = filters.dateDebut ? new Date(filters.dateDebut) : null;
                const endDate = filters.dateFin ? new Date(filters.dateFin) : null;

                let matchDate = true;

                if (startDate) {
                    matchDate = matchDate && reportDate >= startDate;
                }

                if (endDate) {
                    const endDatePlusOne = new Date(endDate);
                    endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                    matchDate = matchDate && reportDate < endDatePlusOne;
                }

                return matchDate;
            });
        }

        return baseReports.filter((report) => {
            const matchSearch =
                !filters.search ||
                report.reference.toLowerCase().includes(filters.search.toLowerCase()) ||
                report.nom_prenom
                    .toLowerCase()
                    .includes(filters.search.toLowerCase()) ||
                (report.categorieLabel &&
                    report.categorieLabel
                        .toLowerCase()
                        .includes(filters.search.toLowerCase()));

            const matchStatut = !filters.statut || report.status === filters.statut;

            return matchSearch && matchStatut;
        });
    }, [allReports, reports, currentTab, filters, activeCategory]);

    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedReports = filteredReports.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            let startPage = Math.max(2, currentPage - 2);
            let endPage = Math.min(totalPages - 1, currentPage + 2);

            if (currentPage <= 3) {
                endPage = maxVisible;
            }

            if (currentPage >= totalPages - 2) {
                startPage = totalPages - maxVisible + 1;
            }

            if (startPage > 2) {
                pages.push("...");
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (endPage < totalPages - 1) {
                pages.push("...");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
        setCurrentPage(1);
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
        }
        return sortConfig.direction === "asc" ? (
            <ChevronUp className="w-3 h-3 text-blue-600" />
        ) : (
            <ChevronDown className="w-3 h-3 text-blue-600" />
        );
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            statut: "",
            dateDebut: "",
            dateFin: "",
        });
        setCurrentPage(1);
    };

    const exportReports = () => {
        const csvContent = [
            ["RÉFÉRENCE", "DATE", "NOM / PRÉNOM", "CATÉGORIE", "STATUT", "ASSIGNÉ À"],
            ...filteredReports.map((report) => [
                report.reference,
                formatDate(report.date),
                report.nom_prenom,
                report.categorieLabel || "N/A",
                getDisplayStatus(report.status),
                getDisplayAssignedTo(report.assigned_to),
            ]),
        ]
            .map((row) => row.map((field) => `"${field}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `signalements_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewReport = (report) => {
        setSelectedReport(selectedReport?.id === report.id ? null : report);
        setExpandedSections({
            general: true,
            auteur: true,
            description: true,
            pieces: true,
        });
    };

    const handlePrintReport = (report) => {
        setSelectedReport(report);

        setTimeout(() => {
            const printContent = document.querySelector('.print-section');
            if (printContent) {
                const originalContents = document.body.innerHTML;
                const printContents = printContent.innerHTML;

                document.body.innerHTML = printContents;
                window.print();
                document.body.innerHTML = originalContents;

                // Recharger la page pour restaurer l'état
                window.location.reload();
            }
        }, 500);
    };

    const handleAssignReport = (report) => {
        setSelectedReportForAction(report);
        setAssignData({
            assignTo: report.assigned_to || "investigateur",
        });
        setShowAssignModal(true);
    };

    const handleStatusUpdate = (report) => {
        setSelectedReportForAction(report);
        setStatusData({
            status: report.status || "",
        });
        setShowStatusModal(true);
    };

    const handleEditReport = (report) => {
        setSelectedReportForAction(report);
        setEditData({
            category: report.categorie,
            description: report.explication,
            nom_prenom: report.nom_prenom,
            email: report.email,
            telephone: report.telephone,
            city: report.city,
            province: report.province,
            region: report.region,
        });
        setShowEditModal(true);
    };

    const handleDeleteReport = (report) => {
        setSelectedReportForAction(report);
        setShowDeleteModal(true);
    };

    const confirmDeleteReport = async () => {
        if (!selectedReportForAction) return;

        try {
            const reportId = selectedReportForAction.id;
            const response = await API.delete(`/reports/${reportId}`);

            if (response.data.success) {
                setShowDeleteModal(false);
                setSelectedReportForAction(null);

                if (selectedReport?.id === reportId) {
                    setSelectedReport(null);
                }

                await fetchReports();
            }
        } catch (error) {
            if (error.response?.status === 404) {
                await fetchReports();
                setShowDeleteModal(false);
                setSelectedReportForAction(null);
            } else if (error.response?.status === 403) {
                alert("❌ Vous n'avez pas les droits pour supprimer ce signalement");
            } else {
                alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const handleDownloadFile = async (fileName) => {
        try {
            const encodedFileName = encodeURIComponent(fileName);
            const response = await API.get(`/files/${encodedFileName}/download`, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Erreur lors du téléchargement du fichier");
        }
    };

    const handleViewFile = (fileName) => {
        const encodedFileName = encodeURIComponent(fileName);
        const fileUrl = `${API.defaults.baseURL}/files/${encodedFileName}`;
        window.open(fileUrl, "_blank");
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setNewReport((prev) => ({
            ...prev,
            files: [...prev.files, ...files],
        }));
    };

    const removeFile = (index) => {
        setNewReport((prev) => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== index),
        }));
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();

        if (!newReport.category) {
            alert("Veuillez sélectionner une catégorie");
            return;
        }
        if (!newReport.description) {
            alert("La description est obligatoire");
            return;
        }
        if (newReport.type === "identifie" && !newReport.name) {
            alert("Le nom est obligatoire pour un signalement identifié");
            return;
        }

        try {
            const formData = new FormData();

            formData.append("type", newReport.type);
            formData.append("name", newReport.name || "Anonyme");
            formData.append("category", newReport.category);
            formData.append("description", newReport.description);
            formData.append("accept_terms", 1);
            formData.append("accept_truth", 1);

            if (newReport.email && newReport.email.trim()) {
                formData.append("email", newReport.email.trim());
            }
            if (newReport.phone && newReport.phone.trim()) {
                formData.append("phone", newReport.phone.trim());
            }
            if (newReport.address && newReport.address.trim()) {
                formData.append("address", newReport.address.trim());
            }

            if (newReport.files.length > 0) {
                newReport.files.forEach((file) => {
                    formData.append("files[]", file);
                });
            }

            const response = await API.post("/reports", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                setNewReport({
                    category: "",
                    description: "",
                    files: [],
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    type: "identifie",
                });

                setShowCreateModal(false);
                await fetchReports();

                alert(
                    `✅ Signalement créé avec succès!\nRéférence: ${response.data.reference}`
                );
            }
        } catch (error) {
            if (error.response?.status === 422) {
                const errors = error.response.data.errors || {};
                const errorMessages = Object.entries(errors)
                    .map(
                        ([field, messages]) =>
                            `• ${field}: ${
                                Array.isArray(messages) ? messages.join(", ") : messages
                            }`
                    )
                    .join("\n");

                alert(`❌ Erreur de validation:\n\n${errorMessages}`);
            } else {
                alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!selectedReportForAction) return;

        try {
            const updateData = {
                category: editData.category,
                description: editData.description,
                nom_prenom: editData.nom_prenom,
                email: editData.email,
                telephone: editData.telephone,
                city: editData.city,
                province: editData.province,
                region: editData.region,
            };

            const response = await API.put(
                `/reports/${selectedReportForAction.id}`,
                updateData
            );

            if (response.data.success) {
                await fetchReports();
                setShowEditModal(false);
                setSelectedReportForAction(null);

                if (selectedReport?.id === selectedReportForAction.id) {
                    setSelectedReport((prev) => ({ ...prev, ...updateData }));
                }
            }
        } catch (error) {
            alert(
                "Erreur lors de la modification: " +
                (error.response?.data?.message || error.message)
            );
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();

        if (!selectedReportForAction) return;

        try {
            const response = await API.post(
                `/reports/${selectedReportForAction.id}/assign`,
                {
                    assigned_to: assignData.assignTo,
                }
            );

            if (response.data.success) {
                alert("Dossier assigné avec succès!");
                await fetchReports();
                setShowAssignModal(false);
                setSelectedReportForAction(null);
            }
        } catch (error) {
            alert("Erreur: " + (error.response?.data?.message || error.message));
        }
    };

    const handleStatusSubmit = async (e) => {
        e.preventDefault();

        if (!selectedReportForAction || !statusData.status) {
            alert("Veuillez sélectionner un statut");
            return;
        }

        try {
            const response = await API.put(
                `/reports/${selectedReportForAction.id}/status`,
                {
                    status: statusData.status,
                }
            );

            if (response.data.success) {
                alert(
                    `✅ Statut mis à jour avec succès !\nNouveau statut: ${getDisplayStatus(
                        statusData.status
                    )}`
                );

                setShowStatusModal(false);
                setStatusData({
                    status: "",
                });
                setSelectedReportForAction(null);

                await fetchReports();
            }
        } catch (error) {
            alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
        }
    };

    const generateReport = (e) => {
        e.preventDefault();

        const selectedCategories =
            reportData.categories.length > 0
                ? categories
                    .filter((cat) => reportData.categories.includes(cat.id))
                    .map((cat) => cat.name)
                : ["Toutes les catégories"];

        const reportStats = {
            total: filteredReports.length,
            en_cours: filteredReports.filter((r) => r.status === "en_cours").length,
            finalise: filteredReports.filter((r) => r.status === "finalise").length,
            investigation: filteredReports.filter((r) => r.status === "investigation")
                .length,
            transmis_autorite: filteredReports.filter(
                (r) => r.status === "transmis_autorite"
            ).length,
            classifier: filteredReports.filter((r) => r.status === "classifier")
                .length,
            refuse: filteredReports.filter((r) => r.status === "refuse").length,
        };

        const generatedReportData = {
            type: reportData.type,
            periode: `${formatDate(reportData.dateDebut)} - ${formatDate(
                reportData.dateFin
            )}`,
            categories: selectedCategories,
            notes: reportData.notes,
            stats: reportStats,
            dateGeneration: new Date().toLocaleDateString("fr-FR"),
            heureGeneration: new Date().toLocaleTimeString("fr-FR"),
        };

        setGeneratedReport(generatedReportData);
        setShowReportPreview(true);
    };

    const exportToPDF = () => {
        const element = document.getElementById("report-preview");

        html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
        })
            .then((canvas) => {
                const imgWidth = 210;
                const pageHeight = 297;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                const pdf = new jsPDF("p", "mm", "a4");
                let pageCount = 1;

                let imgData = canvas.toDataURL("image/jpeg", 0.98);

                pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                    pageCount++;
                }

                pdf.save(`rapport_signalements_${generatedReport.dateGeneration}.pdf`);
            })
            .catch((error) => {
                console.error("Erreur lors de la génération du PDF:", error);
            });
    };

    const getTabStats = () => {
        return {
            tous: allReports.length,
            anonyme: reports.filter((r) => r.type_signalement === "Anonyme").length,
            "non-anonyme": reports.filter((r) => r.type_signalement === "Non-Anonyme")
                .length,
            classifier: reports.filter((r) => r.status === "classifier").length,
            assignes: reports.filter(
                (r) =>
                    r.assigned_to &&
                    r.assigned_to !== "Non assigné" &&
                    r.assigned_to !== "" &&
                    r.assigned_to !== null
            ).length,
        };
    };

    const tabStats = getTabStats();

    const cat = categories.find((c) => c.id === activeCategory);
    const categoryStats = calculateCategoryStats(activeCategory);

    if (selectedReport && !generatedReport) {
        return (
            <>
                <style>
                    {`
            @media print {
              body * {
                visibility: hidden;
              }
              
              .print-section,
              .print-section * {
                visibility: visible;
              }
              
              .print-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background: white;
                padding: 20px;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-actions {
                display: none !important;
              }
            }
          `}
                </style>
                <div className="print-section p-4 bg-white min-h-screen">
                    <div className="flex items-center justify-between mb-4 no-print">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                Détail du Signalement - {selectedReport.reference}
                            </h1>
                            <p className="text-xs text-gray-600 mt-1">
                                {formatDate(selectedReport.date)} •{" "}
                                {selectedReport.categorieLabel}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="flex items-center gap-2 px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ChevronLeft className="w-3 h-3" />
                            Retour à la liste
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-white rounded-lg border border-gray-200">
                            <button
                                onClick={() => toggleSection("general")}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        Informations Générales
                                    </h4>
                                </div>
                                {expandedSections.general ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            {expandedSections.general && (
                                <div className="px-3 pb-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                        <div>
                      <span className="text-gray-600 block mb-1">
                        Référence:
                      </span>
                                            <p className="font-medium text-sm">
                                                {selectedReport.reference}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block mb-1">Date:</span>
                                            <p className="font-medium text-sm">
                                                {formatDate(selectedReport.date)}
                                            </p>
                                        </div>
                                        <div>
                      <span className="text-gray-600 block mb-1">
                        Catégorie:
                      </span>
                                            <p className="font-medium text-sm">
                                                {selectedReport.categorieLabel}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block mb-1">Statut:</span>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    selectedReport.status === "en_cours"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : selectedReport.status === "finalise"
                                                            ? "bg-green-100 text-green-800"
                                                            : selectedReport.status === "classifier"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : selectedReport.status === "investigation"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : selectedReport.status === "transmis_autorite"
                                                                        ? "bg-indigo-100 text-indigo-800"
                                                                        : selectedReport.status === "refuse"
                                                                            ? "bg-red-100 text-red-800"
                                                                            : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                        {getDisplayStatus(selectedReport.status)}
                      </span>
                                        </div>
                                        <div>
                      <span className="text-gray-600 block mb-1">
                        Assigné à:
                      </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    selectedReport.assigned_to === "investigateur"
                                                        ? "bg-indigo-100 text-indigo-800"
                                                        : selectedReport.assigned_to === "cac_daj"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : selectedReport.assigned_to ===
                                                            "autorite_competente"
                                                                ? "bg-cyan-100 text-cyan-800"
                                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                        {getDisplayAssignedTo(selectedReport.assigned_to)}
                      </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block mb-1">Type:</span>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {selectedReport.type_signalement}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200">
                            <button
                                onClick={() => toggleSection("auteur")}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        Informations de l'Auteur
                                    </h4>
                                </div>
                                {expandedSections.auteur ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            {expandedSections.auteur && (
                                <div className="px-3 pb-3">
                                    {selectedReport.type_signalement === "Anonyme" ? (
                                        <div className="text-center py-3">
                                            <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                                            <p className="text-xs text-gray-600">
                                                Signalement anonyme
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                            <div>
                        <span className="text-gray-600 block mb-1">
                          Nom / Prénom:
                        </span>
                                                <p className="font-medium text-sm">
                                                    {selectedReport.nom_prenom}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 block mb-1">Email:</span>
                                                <p className="font-medium text-sm">
                                                    {selectedReport.email}
                                                </p>
                                            </div>
                                            <div>
                        <span className="text-gray-600 block mb-1">
                          Téléphone:
                        </span>
                                                <p className="font-medium text-sm">
                                                    {selectedReport.telephone}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200">
                            <button
                                onClick={() => toggleSection("description")}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        Description du Signalement
                                    </h4>
                                </div>
                                {expandedSections.description ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            {expandedSections.description && (
                                <div className="px-3 pb-3">
                                    <div className="bg-gray-50 rounded-md p-3 text-xs leading-relaxed">
                                        {selectedReport.explication}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200">
                            <button
                                onClick={() => toggleSection("pieces")}
                                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        Pièces Jointes
                                    </h4>
                                </div>
                                {expandedSections.pieces ? (
                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                            </button>
                            {expandedSections.pieces && (
                                <div className="px-3 pb-3">
                                    {selectedReport.files && selectedReport.files.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedReport.files.map((file, idx) => {
                                                const fileName =
                                                    typeof file === "string" ? file : file.name || "";
                                                const ext = fileName.split(".").pop()?.toLowerCase();
                                                const isImage = [
                                                    "jpg",
                                                    "jpeg",
                                                    "png",
                                                    "gif",
                                                    "webp",
                                                ].includes(ext);
                                                const isPdf = ext === "pdf";

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-50 rounded-lg border overflow-hidden"
                                                    >
                                                        <div className="aspect-video bg-white flex items-center justify-center">
                                                            {isImage ? (
                                                                <img
                                                                    src={`${
                                                                        API.defaults.baseURL
                                                                    }/files/${encodeURIComponent(fileName)}`}
                                                                    alt={fileName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src =
                                                                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='120'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' font-size='12'%3EImpossible de charger l'image%3C/text%3E%3C/svg%3E";
                                                                    }}
                                                                />
                                                            ) : isPdf ? (
                                                                <div className="text-center p-2">
                                                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-1">
                                    <span className="text-red-600 font-bold text-xs">
                                      PDF
                                    </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600">
                                                                        Document PDF
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center p-2">
                                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-1">
                                    <span className="text-gray-600 font-bold text-xs">
                                      {ext?.toUpperCase()}
                                    </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600">
                                                                        Fichier {ext}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-2">
                                                            <p
                                                                className="text-xs font-medium truncate mb-1"
                                                                title={fileName}
                                                            >
                                                                {fileName}
                                                            </p>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleViewFile(fileName)}
                                                                    className="flex-1 bg-blue-50 text-blue-600 py-1 px-1 rounded text-xs hover:bg-blue-100 transition-colors"
                                                                >
                                                                    Voir
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadFile(fileName)}
                                                                    className="flex-1 bg-gray-100 text-gray-700 py-1 px-1 rounded text-xs hover:bg-gray-200 transition-colors"
                                                                >
                                                                    Télécharger
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <Download className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                Aucun fichier joint
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-4 border-t no-print">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditReport(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                <Edit className="w-3 h-3" />
                                Modifier
                            </button>
                            <button
                                onClick={() => handleDeleteReport(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePrintReport(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Printer className="w-3 h-3" />
                                Imprimer
                            </button>
                            <button
                                onClick={() => handleAssignReport(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <UserCheck className="w-3 h-3" />
                                Assigner
                            </button>
                            <button
                                onClick={() => handleStatusUpdate(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                <Filter className="w-3 h-3" />
                                Statut
                            </button>
                        </div>
                    </div>
                </div>

                {showAssignModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg w-full max-w-md mx-4">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Assigner le signalement
                                </h2>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Assigner à *
                                    </label>
                                    <select
                                        value={assignData.assignTo}
                                        onChange={(e) =>
                                            setAssignData((prev) => ({
                                                ...prev,
                                                assignTo: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        {assignToOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Assigner
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showStatusModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg w-full max-w-md mx-4">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Mettre à jour le statut
                                </h2>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleStatusSubmit} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nouveau statut <span className="text-red-600">*</span>
                                    </label>
                                    <select
                                        value={statusData.status}
                                        onChange={(e) =>
                                            setStatusData((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    >
                                        <option value="">Sélectionner un statut</option>
                                        {/* En cours supprimé */}
                                        <option value="investigation">Investigation</option>
                                        <option value="transmis_autorite">
                                            Transmis aux autorités compétentes
                                        </option>
                                        <option value="classifier">Complété</option>
                                        <option value="refuse">Refusé</option>
                                        {/* Finalisé supprimé */}
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowStatusModal(false)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700"
                                    >
                                        Mettre à jour le statut
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showEditModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h2 className="text-lg font-semibold">
                                    Modifier le signalement
                                </h2>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-semibold">Type:</span>{" "}
                                        <span
                                            className={
                                                selectedReportForAction?.type_signalement === "Anonyme"
                                                    ? "text-blue-600"
                                                    : "text-green-600"
                                            }
                                        >
                      {selectedReportForAction?.type_signalement}
                    </span>
                                    </p>
                                    {selectedReportForAction?.type_signalement === "Anonyme" && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            ⚠️ Seuls la description et les pièces jointes peuvent être
                                            modifiés pour un signalement anonyme
                                        </p>
                                    )}
                                </div>

                                {selectedReportForAction?.type_signalement !== "Anonyme" && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nom et Prénom
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editData.nom_prenom}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            nom_prenom: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="Nom complet"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={editData.email}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, email: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="email@exemple.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Téléphone
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editData.telephone}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            telephone: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="+261 XX XX XXX XX"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Ville
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editData.city}
                                                    onChange={(e) =>
                                                        setEditData({ ...editData, city: e.target.value })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="Ville"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Province
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editData.province}
                                                    onChange={(e) =>
                                                        setEditData({
                                                            ...editData,
                                                            province: e.target.value,
                                                        })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="Province"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Catégorie
                                            </label>
                                            <select
                                                value={editData.category}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, category: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            >
                                                <option value="">Sélectionner une catégorie</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        value={editData.description}
                                        onChange={(e) =>
                                            setEditData({ ...editData, description: e.target.value })
                                        }
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {selectedReportForAction?.files &&
                                    selectedReportForAction.files.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pièces jointes actuelles
                                            </label>
                                            <div className="space-y-2">
                                                {selectedReportForAction.files.map((file, index) => {
                                                    const fileName =
                                                        typeof file === "string" ? file : file.name;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                                                        >
                              <span className="text-sm truncate flex-1">
                                {fileName}
                              </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFiles =
                                                                        selectedReportForAction.files.filter(
                                                                            (_, i) => i !== index
                                                                        );
                                                                    setSelectedReportForAction({
                                                                        ...selectedReportForAction,
                                                                        files: newFiles,
                                                                    });
                                                                    setEditData({
                                                                        ...editData,
                                                                        filesToRemove: [
                                                                            ...(editData.filesToRemove || []),
                                                                            fileName,
                                                                        ],
                                                                    });
                                                                }}
                                                                className="ml-2 text-red-600 hover:text-red-800"
                                                                title="Supprimer ce fichier"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ajouter de nouvelles pièces jointes
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.pdf,.mp4"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            setEditData({ ...editData, newFiles: files });
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Formats: JPG, PNG, PDF, MP4 - Max 25 Mo/fichier
                                    </p>
                                </div>

                                {editData.newFiles && editData.newFiles.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Nouveaux fichiers à ajouter ({editData.newFiles.length})
                                        </p>
                                        <div className="space-y-2">
                                            {editData.newFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200"
                                                >
                          <span className="text-sm truncate flex-1">
                            {file.name}
                          </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newFiles = editData.newFiles.filter(
                                                                (_, i) => i !== index
                                                            );
                                                            setEditData({ ...editData, newFiles });
                                                        }}
                                                        className="ml-2 text-red-600 hover:text-red-800"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                    >
                                        Modifier
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Confirmer la suppression
                                        </h2>
                                        <p className="text-red-100 text-sm">Action irréversible</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-800 text-sm">
                                            Signalement à supprimer
                                        </h3>
                                        <p className="text-red-600 text-xs">
                                            {selectedReportForAction?.reference} -{" "}
                                            {selectedReportForAction?.nom_prenom}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-amber-800 text-sm mb-1">
                                                Attention
                                            </h4>
                                            <p className="text-amber-700 text-xs leading-relaxed">
                                                Cette action est définitive et ne peut pas être annulée.
                                                Toutes les données associées à ce signalement seront
                                                définitivement supprimées du système.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-gray-400" />
                                    <span>
                    Veuillez confirmer votre intention de supprimer ce
                    signalement
                  </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmDeleteReport}
                                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer définitivement
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    if (showReportModal) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Génération de Rapport
                        </h1>
                        <p className="text-sm text-gray-600 mt-2">
                            Configurez et prévisualisez votre rapport
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setShowReportModal(false);
                                setShowReportPreview(false);
                                setGeneratedReport(null);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Retour à la liste
                        </button>
                        {generatedReport && (
                            <button
                                onClick={exportToPDF}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Exporter PDF
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Configuration du Rapport
                        </h2>

                        <form onSubmit={generateReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de rapport *
                                </label>
                                <select
                                    value={reportData.type}
                                    onChange={(e) =>
                                        setReportData({ ...reportData, type: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="quotidien">Quotidien</option>
                                    <option value="hebdomadaire">Hebdomadaire</option>
                                    <option value="mensuel">Mensuel</option>
                                    <option value="annuel">Annuel</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de début *
                                    </label>
                                    <input
                                        type="date"
                                        value={reportData.dateDebut}
                                        onChange={(e) =>
                                            setReportData({
                                                ...reportData,
                                                dateDebut: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de fin *
                                    </label>
                                    <input
                                        type="date"
                                        value={reportData.dateFin}
                                        onChange={(e) =>
                                            setReportData({ ...reportData, dateFin: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Catégories à inclure
                                </label>
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                                    {categories.map((cat) => (
                                        <label key={cat.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={reportData.categories.includes(cat.id)}
                                                onChange={(e) => {
                                                    const newCategories = e.target.checked
                                                        ? [...reportData.categories, cat.id]
                                                        : reportData.categories.filter(
                                                            (id) => id !== cat.id
                                                        );
                                                    setReportData({
                                                        ...reportData,
                                                        categories: newCategories,
                                                    });
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Laissez vide pour inclure toutes les catégories
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes et observations
                                </label>
                                <textarea
                                    value={reportData.notes}
                                    onChange={(e) =>
                                        setReportData({ ...reportData, notes: e.target.value })
                                    }
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Ajoutez des commentaires ou observations..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                Générer le Rapport
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Prévisualisation du Rapport
                        </h2>

                        {showReportPreview && generatedReport ? (
                            <div id="report-preview" className="pdf-export bg-white p-8">
                                <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-left">
                                            <img
                                                src={repLogo}
                                                alt="République de Madagascar"
                                                className="h-16 object-contain"
                                            />
                                            <p className="text-xs font-bold text-gray-800 mt-1">
                                                REPOBLIKAN'I MADAGASIKARA
                                            </p>
                                        </div>

                                        <div className="text-center flex-1 mx-8">
                                            <div className="border-l border-r border-gray-400 px-8">
                                                <img
                                                    src={mesupresLogo}
                                                    alt="MESUPRES"
                                                    className="h-16 object-contain mx-auto"
                                                />
                                                <p className="text-xs font-bold text-gray-800 mt-1 uppercase">
                                                    MINISTERAN'NY FAMPIANARANA AMBONY SY FIKAROHANA
                                                    ARA-TSIANSA
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <img
                                                src={fosikaLogo}
                                                alt="FOSIKA"
                                                className="h-16 object-contain ml-auto"
                                            />
                                            <p className="text-xs font-bold text-gray-800 mt-1">
                                                FOSIKA
                                            </p>
                                        </div>
                                    </div>

                                    <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase">
                                        Rapport des Signalements
                                    </h1>
                                    <p className="text-lg font-semibold text-gray-700">
                                        {generatedReport.type.charAt(0).toUpperCase() +
                                            generatedReport.type.slice(1)}{" "}
                                        - {generatedReport.periode}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                        Informations Générales
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Type de rapport:</span>
                                            <span className="capitalize">{generatedReport.type}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Période couverte:</span>
                                            <span>{generatedReport.periode}</span>
                                        </div>
                                        <div className="flex justify-between">
                      <span className="font-semibold">
                        Catégories incluses:
                      </span>
                                            <span className="text-right">
                        {generatedReport.categories.length > 0
                            ? generatedReport.categories.join(", ")
                            : "Toutes les catégories"}
                      </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Date de génération:</span>
                                            <span>
                        {generatedReport.dateGeneration} à{" "}
                                                {generatedReport.heureGeneration}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                        Statistiques des Signalements
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Total des signalements enregistrés:</span>
                                            <span className="font-bold">
                        {generatedReport.stats.total}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Signalements en cours:</span>
                                            <span className="font-bold text-amber-600">
                        {generatedReport.stats.en_cours}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Signalements finalisés:</span>
                                            <span className="font-bold text-green-600">
                        {generatedReport.stats.finalise}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>En investigation:</span>
                                            <span className="font-bold text-purple-600">
                        {generatedReport.stats.investigation}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Transmis aux autorités compétentes:</span>
                                            <span className="font-bold text-indigo-600">
                        {generatedReport.stats.transmis_autorite}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Signalements refusés:</span>
                                            <span className="font-bold text-red-600">
                        {generatedReport.stats.refuse}
                      </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Signalements complétés:</span>
                                            <span className="font-bold text-blue-600">
                        {generatedReport.stats.classifier}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-300 pb-2">
                                        Analyse
                                    </h2>
                                    <div className="space-y-4 text-sm leading-relaxed">
                                        <p>
                                            Le présent rapport d'activité du système FOSIKA couvre la
                                            période du <strong> {generatedReport.periode} </strong>
                                            et présente une analyse exhaustive des signalements reçus
                                            concernant les irrégularités dans le secteur de
                                            l'enseignement supérieur et de la recherche scientifique.
                                        </p>

                                        <p>
                                            Durant cette période,{" "}
                                            <strong>
                                                {generatedReport.stats.total} signalements
                                            </strong>{" "}
                                            ont été enregistrés et traités par notre système. La
                                            répartition par statut démontre l'efficacité de notre
                                            mécanisme de traitement :
                                        </p>

                                        <ul className="list-disc list-inside space-y-2 ml-4">
                                            <li>
                                                <strong>
                                                    {generatedReport.stats.en_cours} dossiers
                                                </strong>{" "}
                                                sont actuellement en cours d'instruction active
                                            </li>
                                            <li>
                                                <strong>
                                                    {generatedReport.stats.finalise} affaires
                                                </strong>{" "}
                                                ont été résolues avec succès
                                            </li>
                                            <li>
                                                <strong>
                                                    {generatedReport.stats.investigation} cas
                                                </strong>{" "}
                                                font l'objet d'une investigation approfondie
                                            </li>
                                            <li>
                                                <strong>
                                                    {generatedReport.stats.transmis_autorite} dossiers
                                                </strong>{" "}
                                                ont été transmis aux autorités compétentes
                                            </li>
                                            <li>
                                                <strong>{generatedReport.stats.refuse} dossiers</strong>{" "}
                                                ont été refusés après examen
                                            </li>
                                            <li>
                                                <strong>
                                                    {generatedReport.stats.classifier} dossiers
                                                </strong>{" "}
                                                ont été complétés et classés
                                            </li>
                                        </ul>

                                        <p>
                                            Le système FOSIKA continue de démontrer son utilité dans
                                            la lutte contre les fraudes académiques et les
                                            irrégularités dans l'enseignement supérieur. Notre
                                            plateforme assure un suivi rigoureux de chaque signalement
                                            depuis sa réception jusqu'à sa résolution définitive.
                                        </p>

                                        {generatedReport.notes && (
                                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                                                <h3 className="font-bold text-blue-900 mb-2">
                                                    Observations particulières :
                                                </h3>
                                                <p className="text-blue-800 whitespace-pre-wrap text-sm">
                                                    {generatedReport.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t-2 border-gray-800 text-center text-xs text-gray-600">
                                    <p className="font-bold">
                                        © DAAQ-MESUPRES 2025 - Tous droits réservés
                                    </p>
                                    <p className="mt-1">
                                        Système FOSIKA - Plateforme de gestion des signalements
                                    </p>
                                    <p className="mt-2">
                                        Document généré le {generatedReport.dateGeneration} à{" "}
                                        {generatedReport.heureGeneration}
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        À usage officiel - Confidentiel
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">
                                    Le rapport apparaîtra ici après génération
                                </p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Configurez les paramètres et cliquez sur "Générer le Rapport"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h1 className="text-base font-semibold">
                        {currentTab === "classifier"
                            ? "Dossiers complétés"
                            : currentTab === "assignes"
                                ? "Dossiers assignés"
                                : "Liste complète des signalements"}
                    </h1>
                    <p className="text-xs text-gray-500">
                        {currentTab === "classifier"
                            ? "Signalements ayant déjà été complétés."
                            : currentTab === "assignes"
                                ? "Signalements assignés à une entité de traitement."
                                : "Gestion et suivi des dossiers avec filtres avancés."}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <Plus className="w-3 h-3" />
                        Nouveau signalement
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1 px-3 py-1 text-xs border rounded-md hover:bg-gray-50"
                    >
                        <FileText className="w-3 h-3" />
                        Générer rapport
                    </button>

                    <button
                        onClick={exportReports}
                        className="flex items-center gap-1 px-3 py-1 text-xs border rounded-md hover:bg-gray-50"
                    >
                        <Download className="w-3 h-3" />
                        Exporter CSV
                    </button>
                </div>
            </div>

            <div className="mb-6 bg-white rounded-lg border p-4">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">
                        Analyse Détaillée par Catégories
                    </h2>
                    <p className="text-sm text-gray-600">
                        Visualisation et analyse approfondie des signalements par catégorie
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 mb-4">
                    <button
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-full ${
                            activeCategory === "tous"
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => setActiveCategory("tous")}
                    >
                        <BarChart className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">Toutes</span>
                    </button>

                    {categories.map((catg) => {
                        const stats = calculateCategoryStats(catg.id);
                        const Icon = catg.icon;
                        return (
                            <button
                                key={catg.id}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all h-full ${
                                    activeCategory === catg.id
                                        ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                                onClick={() => setActiveCategory(catg.id)}
                                title={catg.name}
                            >
                                <Icon className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium truncate w-full text-center">
                  {catg.name.split(' ')[0]}
                </span>
                                <span className="text-xs text-gray-500 mt-1">{stats.total}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        {activeCategory === "tous"
                            ? "Synthèse - Toutes catégories"
                            : `Synthèse - ${cat?.name}`}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {activeCategory === "tous"
                                    ? allReports.length
                                    : categoryStats.total}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">
                                Signalements totaux
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                            <div className="text-2xl font-bold text-amber-600">
                                {activeCategory === "tous"
                                    ? reports.filter((r) => r.status === "en_cours").length
                                    : categoryStats.encours}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">En cours</div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {activeCategory === "tous"
                                    ? reports.filter((r) => r.status === "finalise").length
                                    : categoryStats.resolus}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">Résolus</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
                <button
                    className={
                        currentTab === "tous"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("tous");
                        setCurrentPage(1);
                    }}
                >
                    Tous ({tabStats.tous})
                </button>

                <button
                    className={
                        currentTab === "anonyme"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("anonyme");
                        setCurrentPage(1);
                    }}
                >
                    Anonymes ({tabStats.anonyme})
                </button>

                <button
                    className={
                        currentTab === "non-anonyme"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("non-anonyme");
                        setCurrentPage(1);
                    }}
                >
                    Non-Anonymes ({tabStats["non-anonyme"]})
                </button>

                <button
                    className={
                        currentTab === "assignes"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("assignes");
                        setCurrentPage(1);
                    }}
                >
                    Dossiers Assignés ({tabStats.assignes})
                </button>

                <button
                    className={
                        currentTab === "classifier"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("classifier");
                        setCurrentPage(1);
                    }}
                >
                    Dossiers Complétés ({tabStats.classifier})
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
                <div className="md:col-span-2">
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        placeholder="Rechercher par référence, nom..."
                        className="w-full px-2 py-1 text-xs border rounded-md"
                    />
                </div>

                <div>
                    <input
                        type="date"
                        value={filters.dateDebut}
                        onChange={(e) => handleFilterChange("dateDebut", e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-md"
                        placeholder="Date début"
                    />
                </div>

                <div>
                    <input
                        type="date"
                        value={filters.dateFin}
                        onChange={(e) => handleFilterChange("dateFin", e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-md"
                        placeholder="Date fin"
                    />
                </div>

                <div>
                    <select
                        value={filters.statut}
                        onChange={(e) => handleFilterChange("statut", e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-md"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="en_cours">En cours</option>
                        <option value="finalise">Finalisé</option>
                        <option value="classifier">Complété</option>
                        <option value="investigation">Investigation</option>
                        <option value="transmis_autorite">Transmis aux autorités</option>
                        <option value="refuse">Refusé</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between mb-2 text-xs">
                <button
                    onClick={resetFilters}
                    className="flex items-center gap-1 px-2 py-1 border rounded-md hover:bg-gray-50"
                >
                    <X className="w-3 h-3" />
                    Réinitialiser les filtres
                </button>
                <div className="text-gray-500">
                    {filteredReports.length} signalements trouvés
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-2 mb-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    <span>Erreur lors du chargement des données : {error}</span>
                </div>
            )}

            <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                            Chargement en cours...
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                            Aucun signalement trouvé avec les filtres actuels
                        </div>
                    ) : (
                        <table className="min-w-full text-xs">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 text-left">
                                    <button
                                        onClick={() => handleSort("reference")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                    >
                                        <span>RÉFÉRENCE</span>
                                        {getSortIcon("reference")}
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-left">
                                    <button
                                        onClick={() => handleSort("date")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                                    >
                                        <span>DATE</span>
                                        {getSortIcon("date")}
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-left">NOM / PRÉNOM</th>
                                <th className="px-2 py-2 text-left">CATÉGORIE</th>
                                <th className="px-2 py-2 text-left">STATUT</th>
                                <th className="px-2 py-2 text-left">ASSIGNÉ À</th>
                                <th className="px-2 py-2 text-left">ACTIONS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedReports.map((report) => (
                                <tr key={report.id} className="border-t hover:bg-gray-50">
                                    <td className="px-2 py-2 font-medium">
                                        {report.reference}
                                    </td>
                                    <td className="px-2 py-2">{formatDate(report.date)}</td>
                                    <td className="px-2 py-2">{report.nom_prenom}</td>
                                    <td className="px-2 py-2">{report.categorieLabel}</td>
                                    <td className="px-2 py-2">
                      <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === "en_cours"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : report.status === "finalise"
                                      ? "bg-green-100 text-green-800"
                                      : report.status === "classifier"
                                          ? "bg-blue-100 text-blue-800"
                                          : report.status === "investigation"
                                              ? "bg-purple-100 text-purple-800"
                                              : report.status === "transmis_autorite"
                                                  ? "bg-indigo-100 text-indigo-800"
                                                  : report.status === "refuse"
                                                      ? "bg-red-100 text-red-800"
                                                      : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {getDisplayStatus(report.status)}
                      </span>
                                    </td>
                                    <td className="px-2 py-2">
                      <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.assigned_to === "investigateur"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : report.assigned_to === "cac_daj"
                                      ? "bg-blue-100 text-blue-800"
                                      : report.assigned_to === "autorite_competente"
                                          ? "bg-cyan-100 text-cyan-800"
                                          : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {getDisplayAssignedTo(report.assigned_to)}
                      </span>
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleViewReport(report)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                title="Voir détails"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>

                                            <button
                                                onClick={() => handlePrintReport(report)}
                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                                title="Imprimer"
                                            >
                                                <Printer className="w-3 h-3" />
                                            </button>

                                            <button
                                                onClick={() => handleAssignReport(report)}
                                                className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                                                title="Assigner"
                                            >
                                                <UserCheck className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(report)}
                                                className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                                                title="Mettre à jour statut"
                                            >
                                                <Filter className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleEditReport(report)}
                                                className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteReport(report)}
                                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {filteredReports.length > 0 && (
                    <div className="flex items-center justify-between px-2 py-2 border-t bg-gray-50">
                        <div className="flex items-center gap-2 text-xs">
                            <span>Éléments par page :</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border rounded-md text-xs"
                            >
                                <option value={10}>10</option>
                                <option value={30}>30</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span className="text-gray-500">
                {indexOfFirstItem + 1}-
                                {Math.min(indexOfLastItem, filteredReports.length)} sur{" "}
                                {filteredReports.length}
              </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 border rounded-md disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {getPageNumbers().map((page, idx) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 text-xs text-gray-500"
                                        >
                    ...
                  </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-2 py-1 text-xs border rounded-md ${
                                                currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                            )}

                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="p-1 border rounded-md disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-semibold">Nouveau Signalement</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateReport} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type de signalement <span className="text-red-600">*</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="identifie"
                                            checked={newReport.type === "identifie"}
                                            onChange={(e) =>
                                                setNewReport({ ...newReport, type: e.target.value })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <span>Je m'identifie</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="anonyme"
                                            checked={newReport.type === "anonyme"}
                                            onChange={(e) =>
                                                setNewReport({ ...newReport, type: e.target.value })
                                            }
                                            className="w-4 h-4"
                                        />
                                        <span>Anonyme</span>
                                    </label>
                                </div>
                            </div>

                            {newReport.type === "identifie" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nom et Prénom <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newReport.name}
                                            onChange={(e) =>
                                                setNewReport({ ...newReport, name: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Votre nom complet"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newReport.email}
                                                onChange={(e) =>
                                                    setNewReport({ ...newReport, email: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="email@exemple.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                value={newReport.phone}
                                                onChange={(e) =>
                                                    setNewReport({ ...newReport, phone: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="+261 XX XX XXX XX"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Adresse
                                        </label>
                                        <input
                                            type="text"
                                            value={newReport.address}
                                            onChange={(e) =>
                                                setNewReport({ ...newReport, address: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Ville, région..."
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Catégorie <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={newReport.category}
                                    onChange={(e) =>
                                        setNewReport({ ...newReport, category: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Sélectionner une catégorie</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    value={newReport.description}
                                    onChange={(e) =>
                                        setNewReport({ ...newReport, description: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Décrivez en détail la situation..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pièces jointes (optionnel)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.mp4"
                                    onChange={handleFileChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Formats: JPG, PNG, PDF, MP4 - Max 25 Mo/fichier
                                </p>
                            </div>

                            {newReport.files.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Fichiers ajoutés ({newReport.files.length})
                                    </p>
                                    {newReport.files.map((file, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                        >
                      <span className="text-sm truncate flex-1">
                        {file.name}
                      </span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="ml-2 text-red-600 hover:text-red-800"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        !newReport.category ||
                                        !newReport.description ||
                                        (newReport.type === "identifie" && !newReport.name.trim())
                                    }
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Créer le signalement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Assigner le signalement</h2>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigner à *
                                </label>
                                <select
                                    value={assignData.assignTo}
                                    onChange={(e) =>
                                        setAssignData((prev) => ({
                                            ...prev,
                                            assignTo: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    {assignToOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Assigner
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showStatusModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Mettre à jour le statut</h2>
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleStatusSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nouveau statut <span className="text-red-600">*</span>
                                </label>
                                <select
                                    value={statusData.status}
                                    onChange={(e) =>
                                        setStatusData((prev) => ({
                                            ...prev,
                                            status: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Sélectionner un statut</option>
                                    {/* En cours supprimé */}
                                    <option value="investigation">Investigation</option>
                                    <option value="transmis_autorite">
                                        Transmis aux autorités compétentes
                                    </option>
                                    <option value="classifier">Complété</option>
                                    <option value="refuse">Refusé</option>
                                    {/* Finalisé supprimé */}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700"
                                >
                                    Mettre à jour le statut
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">Modifier le signalement</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Type:</span>{" "}
                                    <span
                                        className={
                                            selectedReportForAction?.type_signalement === "Anonyme"
                                                ? "text-blue-600"
                                                : "text-green-600"
                                        }
                                    >
                    {selectedReportForAction?.type_signalement}
                  </span>
                                </p>
                                {selectedReportForAction?.type_signalement === "Anonyme" && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        ⚠️ Seuls la description et les pièces jointes peuvent être
                                        modifiés pour un signalement anonyme
                                    </p>
                                )}
                            </div>

                            {selectedReportForAction?.type_signalement !== "Anonyme" && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom et Prénom
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.nom_prenom}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        nom_prenom: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                placeholder="Nom complet"
                                                disabled={
                                                    selectedReportForAction?.type_signalement ===
                                                    "Anonyme"
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, email: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                placeholder="email@exemple.com"
                                                disabled={
                                                    selectedReportForAction?.type_signalement ===
                                                    "Anonyme"
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Téléphone
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.telephone}
                                                onChange={(e) =>
                                                    setEditData({
                                                        ...editData,
                                                        telephone: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                placeholder="+261 XX XX XXX XX"
                                                disabled={
                                                    selectedReportForAction?.type_signalement ===
                                                    "Anonyme"
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ville
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.city}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, city: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                placeholder="Ville"
                                                disabled={
                                                    selectedReportForAction?.type_signalement ===
                                                    "Anonyme"
                                                }
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Province
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.province}
                                                onChange={(e) =>
                                                    setEditData({ ...editData, province: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                placeholder="Province"
                                                disabled={
                                                    selectedReportForAction?.type_signalement ===
                                                    "Anonyme"
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Catégorie
                                        </label>
                                        <select
                                            value={editData.category}
                                            onChange={(e) =>
                                                setEditData({ ...editData, category: e.target.value })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                            disabled={
                                                selectedReportForAction?.type_signalement === "Anonyme"
                                            }
                                        >
                                            <option value="">Sélectionner une catégorie</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) =>
                                        setEditData({ ...editData, description: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {selectedReportForAction?.files &&
                                selectedReportForAction.files.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Pièces jointes actuelles
                                        </label>
                                        <div className="space-y-2">
                                            {selectedReportForAction.files.map((file, index) => {
                                                const fileName =
                                                    typeof file === "string" ? file : file.name;
                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                                                    >
                            <span className="text-sm truncate flex-1">
                              {fileName}
                            </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newFiles =
                                                                    selectedReportForAction.files.filter(
                                                                        (_, i) => i !== index
                                                                    );
                                                                setSelectedReportForAction({
                                                                    ...selectedReportForAction,
                                                                    files: newFiles,
                                                                });
                                                                setEditData({
                                                                    ...editData,
                                                                    filesToRemove: [
                                                                        ...(editData.filesToRemove || []),
                                                                        fileName,
                                                                    ],
                                                                });
                                                            }}
                                                            className="ml-2 text-red-600 hover:text-red-800"
                                                            title="Supprimer ce fichier"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ajouter de nouvelles pièces jointes
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf,.mp4"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files);
                                        setEditData({ ...editData, newFiles: files });
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Formats: JPG, PNG, PDF, MP4 - Max 25 Mo/fichier
                                </p>
                            </div>

                            {editData.newFiles && editData.newFiles.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">
                                        Nouveaux fichiers à ajouter ({editData.newFiles.length})
                                    </p>
                                    <div className="space-y-2">
                                        {editData.newFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between bg-blue-50 p-2 rounded border border-blue-200"
                                            >
                        <span className="text-sm truncate flex-1">
                          {file.name}
                        </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newFiles = editData.newFiles.filter(
                                                            (_, i) => i !== index
                                                        );
                                                        setEditData({ ...editData, newFiles });
                                                    }}
                                                    className="ml-2 text-red-600 hover:text-red-800"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Modifier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
                        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Confirmer la suppression
                                    </h2>
                                    <p className="text-red-100 text-sm">Action irréversible</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-red-800 text-sm">
                                        Signalement à supprimer
                                    </h3>
                                    <p className="text-red-600 text-xs">
                                        {selectedReportForAction?.reference} -{" "}
                                        {selectedReportForAction?.nom_prenom}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-amber-800 text-sm mb-1">
                                            Attention
                                        </h4>
                                        <p className="text-amber-700 text-xs leading-relaxed">
                                            Cette action est définitive et ne peut pas être annulée.
                                            Toutes les données associées à ce signalement seront
                                            définitivement supprimées du système.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-gray-400" />
                                <span>
                  Veuillez confirmer votre intention de supprimer ce signalement
                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDeleteReport}
                                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Supprimer définitivement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;