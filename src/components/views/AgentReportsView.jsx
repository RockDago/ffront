import React, { useState, useEffect, useMemo } from "react";
import {
    Eye,
    Download,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Users,
    ChevronDown,
    ChevronUp,
    FileText,
    ArrowUpDown,
    Printer,
    GraduationCap,
    Briefcase,
    ShieldAlert,
    Tag,
    BarChart,
    X,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import API from "../../config/axios";

import repLogo from "../../assets/images/logo rep.png";
import mesupresLogo from "../../assets/images/logo mesupres.png";
import fosikaLogo from "../../assets/images/logo fosika.png";

const SortIcon = ({ isSorted, isAsc }) => {
    if (!isSorted) {
        return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return isAsc ? (
        <ArrowUp className="w-3 h-3 text-blue-600" />
    ) : (
        <ArrowDown className="w-3 h-3 text-blue-600" />
    );
};

const AgentReportsView = () => {
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
            icon: ShieldAlert,
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

                    // Créer une description abrégée
                    const fullDescription = report.description || "Aucune description";
                    const shortDescription = fullDescription.length > 80
                        ? fullDescription.substring(0, 80) + '...'
                        : fullDescription;

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
                        shortDescription: shortDescription,
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
                (report) => report.status === "classifier"
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
            (report) => report.status === "classifier"
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
            investigation: "Ouverture d'enquêtes",
            transmis_autorite: "Transmis aux autorités compétentes",
            classifier: "Dossier classé sans suite",
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
        let baseReports = allReports;

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
                        .includes(filters.search.toLowerCase())) ||
                report.explication.toLowerCase().includes(filters.search.toLowerCase());

            const matchStatut = !filters.statut || report.status === filters.statut;

            return matchSearch && matchStatut;
        });
    }, [allReports, filters, activeCategory]);

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
            ["ID", "RÉFÉRENCE", "DATE", "NOM / PRÉNOM", "CATÉGORIE", "STATUT", "ASSIGNÉ À"],
            ...filteredReports.map((report) => [
                report.id,
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
            `signalements_agent_${new Date().toISOString().split("T")[0]}.csv`
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

    const cat = categories.find((c) => c.id === activeCategory);
    const categoryStats = calculateCategoryStats(activeCategory);

    if (selectedReport) {
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
                                                        : selectedReport.status === "classifier"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : selectedReport.status === "investigation"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : selectedReport.status === "transmis_autorite"
                                                                    ? "bg-indigo-100 text-indigo-800"
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
                                onClick={() => handlePrintReport(selectedReport)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <Printer className="w-3 h-3" />
                                Imprimer
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h1 className="text-base font-semibold">
                        Liste complète des signalements (Agent)
                    </h1>
                    <p className="text-xs text-gray-500">
                        Consultation et visualisation des dossiers avec filtres avancés.
                    </p>
                </div>

                <div className="flex items-center gap-2">
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
                            <div className="text-2xl font-bold text-blue-600">
                                {activeCategory === "tous"
                                    ? reports.filter((r) => r.status === "classifier").length
                                    : categoryStats.resolus}
                            </div>
                            <div className="text-gray-500 text-sm mt-1">Résolus</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
                <div className="md:col-span-2">
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        placeholder="Rechercher par référence, nom, description..."
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
                        <option value="investigation">Ouverture d'enquêtes</option>
                        <option value="transmis_autorite">
                            Transmis aux autorités compétentes
                        </option>
                        <option value="classifier">Dossier classé sans suite</option>
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
                                        onClick={() => handleSort("id")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full"
                                    >
                                        <span>ID</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "id"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-left">
                                    <button
                                        onClick={() => handleSort("reference")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full"
                                    >
                                        <span>RÉFÉRENCE</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "reference"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-left">
                                    <button
                                        onClick={() => handleSort("date")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full"
                                    >
                                        <span>DATE</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "date"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-2 py-2 text-left">NOM / PRÉNOM</th>
                                <th className="px-2 py-2 text-left">CATÉGORIE</th>
                                <th className="px-2 py-2 text-left">DESCRIPTION</th>
                                <th className="px-2 py-2 text-left">STATUT</th>
                                <th className="px-2 py-2 text-left">ACTIONS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedReports.map((report) => (
                                <tr key={report.id} className="border-t hover:bg-gray-50">
                                    <td className="px-2 py-2 font-medium">
                                        {report.id}
                                    </td>
                                    <td className="px-2 py-2 font-medium">
                                        {report.reference}
                                    </td>
                                    <td className="px-2 py-2">{formatDate(report.date)}</td>
                                    <td className="px-2 py-2">{report.nom_prenom}</td>
                                    <td className="px-2 py-2">{report.categorieLabel}</td>
                                    <td className="px-2 py-2 max-w-[150px]">
                                        <div className="text-xs text-gray-600 line-clamp-2">
                                            {report.shortDescription}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2">
                      <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              report.status === "en_cours"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : report.status === "classifier"
                                      ? "bg-blue-100 text-blue-800"
                                      : report.status === "investigation"
                                          ? "bg-purple-100 text-purple-800"
                                          : report.status === "transmis_autorite"
                                              ? "bg-indigo-100 text-indigo-800"
                                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {getDisplayStatus(report.status)}
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
        </div>
    );
};

export default AgentReportsView;
