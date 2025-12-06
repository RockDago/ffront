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
    Archive,
    ChevronDown,
    ChevronUp,
    FileText,
    ArrowUpDown,
    AlertTriangle,
    Search,
    Users,
    Calendar,
    Printer,
} from "lucide-react";
import API from "../../config/axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import repLogo from "../../assets/images/logo rep.png";
import mesupresLogo from "../../assets/images/logo mesupres.png";
import fosikaLogo from "../../assets/images/logo fosika.png";

const EnquetesView = () => {
    const [currentTab, setCurrentTab] = useState("tous");
    const [filters, setFilters] = useState({
        search: "",
        statut: "",
        dateDebut: "",
        dateFin: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [enquetes, setEnquetes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEnquete, setSelectedEnquete] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [selectedEnqueteForAction, setSelectedEnqueteForAction] = useState(null);
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });
    const [expandedSections, setExpandedSections] = useState({
        general: true,
        auteur: true,
        description: true,
        pieces: true,
    });

    const [statusData, setStatusData] = useState({
        status: "",
    });

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
            emoji: "📜",
            name: "Faux Diplômes",
        },
        {
            id: "offre-formation-irreguliere",
            emoji: "🎓",
            name: "Offre de formation irrégulière (non habilité)",
        },
        {
            id: "recrutements-irreguliers",
            emoji: "💼",
            name: "Recrutements Irréguliers",
        },
        {
            id: "harcelement",
            emoji: "⚠️",
            name: "Harcèlement",
        },
        {
            id: "corruption",
            emoji: "🔴",
            name: "Corruption",
        },
        {
            id: "divers",
            emoji: "🏷️",
            name: "Divers",
        },
    ];

    useEffect(() => {
        fetchAssignedReports();
    }, []);

    const fetchAssignedReports = async () => {
        setIsLoading(true);
        try {
            const response = await API.get("/reports/assigned");

            if (response.data.success) {
                processApiResponse(response.data);
                return;
            }
        } catch (assignError) {
            try {
                const response = await API.get("/reports");

                if (response.data.success) {
                    const allReports = response.data.data || [];
                    const assignedReports = allReports;

                    processApiResponse({
                        success: true,
                        data: assignedReports,
                    });
                    return;
                }
            } catch (reportsError) {
                setEnquetes([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const processApiResponse = (apiData) => {
        if (apiData.success) {
            const reports = apiData.data || [];

            const formattedEnquetes = reports.map((report) => ({
                id: report.id,
                reference: report.reference || `REF-${report.id}`,
                date: new Date(report.created_at || report.date).toLocaleDateString("fr-FR"),
                rawDate: new Date(report.created_at || report.date),
                nom_prenom: report.name || report.demandeur || "Anonyme",
                categorie: getCategoryName(report.category),
                demandeur: getAssignedUserRole(report.assigned_to),
                statut: getStatusLabel(report.status),
                province: report.province || "Non spécifié",
                region: report.region || "Non spécifié",
                rawData: report,
                email: report.email || "N/A",
                telephone: report.phone || "N/A",
                explication: report.description || "Aucune description",
                files: report.files || [],
                type_signalement: report.is_anonymous ? "Anonyme" : "Non-Anonyme",
                assigned_to: report.assigned_to || "Non assigné",
                status: report.status || "en_cours"
            }));

            setEnquetes(formattedEnquetes);
        }
    };

    const getCategoryName = (category) => {
        const names = {
            "faux-diplomes": "Faux Diplômes",
            "offre-formation-irreguliere": "Offre de formation irrégulière (non habilité)",
            "Offre de formation irrégulière ( non habilité)": "Offre de formation irrégulière (non habilité)",
            "recrutements-irreguliers": "Recrutements Irréguliers",
            harcelement: "Harcèlement",
            corruption: "Corruption",
            divers: "Divers",
        };
        return names[category] || category;
    };

    const getAssignedUserRole = (assignedTo) => {
        if (!assignedTo) return "Non assigné";

        const roles = {
            1: "Administrateur",
            2: "Investigateur",
            3: "Agent",
            4: "Superviseur"
        };

        return roles[assignedTo] || `Utilisateur ${assignedTo}`;
    };

    const getStatusLabel = (status) => {
        const labels = {
            en_cours: "En cours",
            finalise: "Finalisé",
            classifier: "Complété",
            investigation: "Investigation",
            transmis_autorite: "Transmis aux autorités compétentes",
        };
        return labels[status] || status;
    };

    const getDisplayAssignedTo = (assignedTo) => {
        const assignMap = {
            investigateur: "Investigateur",
            cac_daj: "DAAQ / CAC / DAJ",
            autorite_competente: "Autorité compétente",
        };
        return assignMap[assignedTo] || assignedTo || "Non assigné";
    };

    const getDisplayStatus = (status) => {
        const statusMap = {
            en_cours: "En cours",
            investigation: "Investigation",
            transmis_autorite: "Transmis aux autorités compétentes",
            classifier: "Complété",
            finalise: "Finalisé",
        };
        return statusMap[status] || status;
    };

    const sortEnquetes = (enquetesToSort) => {
        if (!sortConfig.key) return enquetesToSort;

        return [...enquetesToSort].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === "date") {
                aValue = a.rawDate;
                bValue = b.rawDate;
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
    };

    const allEnquetes = useMemo(() => {
        return sortEnquetes([...enquetes]);
    }, [enquetes, sortConfig]);

    const filteredEnquetes = useMemo(() => {
        let baseEnquetes = allEnquetes;

        if (currentTab !== "tous") {
            baseEnquetes = baseEnquetes.filter(
                (enquete) => enquete.statut.toLowerCase() === currentTab.toLowerCase()
            );
        }

        return baseEnquetes.filter((enquete) => {
            const matchSearch =
                !filters.search ||
                enquete.reference
                    .toLowerCase()
                    .includes(filters.search.toLowerCase()) ||
                enquete.nom_prenom
                    .toLowerCase()
                    .includes(filters.search.toLowerCase()) ||
                enquete.categorie.toLowerCase().includes(filters.search.toLowerCase());

            const matchStatut = !filters.statut || enquete.status === filters.statut;

            let matchDate = true;
            if (filters.dateDebut) {
                const startDate = new Date(filters.dateDebut);
                startDate.setHours(0, 0, 0, 0);
                matchDate = matchDate && enquete.rawDate >= startDate;
            }

            if (filters.dateFin) {
                const endDate = new Date(filters.dateFin);
                endDate.setHours(23, 59, 59, 999);
                matchDate = matchDate && enquete.rawDate <= endDate;
            }

            return matchSearch && matchStatut && matchDate;
        });
    }, [allEnquetes, currentTab, filters]);

    const totalPages = Math.ceil(filteredEnquetes.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedEnquetes = filteredEnquetes.slice(
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

    const handleViewEnquete = (enquete) => {
        setSelectedEnquete(selectedEnquete?.id === enquete.id ? null : enquete);
        setExpandedSections({
            general: true,
            auteur: true,
            description: true,
            pieces: true,
        });
    };

    const handleStatusUpdate = (enquete) => {
        setSelectedEnqueteForAction(enquete);
        setStatusData({
            status: enquete.rawData?.status || "",
        });
        setShowStatusModal(true);
    };

    const handlePrintEnquete = (enquete) => {
        setSelectedEnqueteForAction(enquete);
        setShowPrintModal(true);
    };

    const handleStatusSubmit = async (e) => {
        e.preventDefault();

        if (!selectedEnqueteForAction || !statusData.status) {
            alert("Veuillez sélectionner un statut");
            return;
        }

        try {
            const response = await API.put(
                `/reports/${selectedEnqueteForAction.id}/status`,
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
                setSelectedEnqueteForAction(null);

                await fetchAssignedReports();
            }
        } catch (error) {
            alert(`❌ Erreur: ${error.response?.data?.message || error.message}`);
        }
    };

    const printDossier = () => {
        if (!selectedEnqueteForAction) return;

        const printContent = document.createElement('div');
        printContent.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dossier - ${selectedEnqueteForAction.reference}</title>
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
          }
          
          .logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .logo {
            height: 60px;
            width: auto;
          }
          
          .logo-center {
            text-align: center;
            flex: 1;
            padding: 0 20px;
          }
          
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 20px 0 10px;
          }
          
          .subtitle {
            font-size: 18px;
            color: #7f8c8d;
            margin-bottom: 10px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
            margin-bottom: 5px;
            font-size: 14px;
          }
          
          .info-value {
            color: #333;
            font-size: 15px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 5px;
          }
          
          .description-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-top: 10px;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .files-list {
            list-style-type: none;
            padding: 0;
          }
          
          .file-item {
            padding: 8px 12px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          
          @page {
            size: A4;
            margin: 20mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="logos">
            <div>
              <img src="${repLogo}" alt="République de Madagascar" class="logo">
              <p style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #2c3e50;">
                REPOBLIKAN'I MADAGASIKARA
              </p>
            </div>
            
            <div class="logo-center">
              <img src="${mesupresLogo}" alt="MESUPRES" class="logo">
              <p style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #2c3e50;">
                MINISTERAN'NY FAMPIANARANA AMBONY SY FIKAROHANA ARA-TSIANSA
              </p>
            </div>
            
            <div>
              <img src="${fosikaLogo}" alt="FOSIKA" class="logo">
              <p style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #2c3e50;">
                FOSIKA
              </p>
            </div>
          </div>
          
          <h1 class="title">FICHE DE DOSSIER</h1>
          <h2 class="subtitle">Système de Gestion des Signalements</h2>
          <p style="color: #7f8c8d; font-size: 14px;">
            Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
        
        <div class="section">
          <h3 class="section-title">INFORMATIONS GÉNÉRALES</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Référence du dossier</div>
              <div class="info-value">${selectedEnqueteForAction.reference}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Date de création</div>
              <div class="info-value">${selectedEnqueteForAction.date}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Catégorie</div>
              <div class="info-value">${selectedEnqueteForAction.categorie}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Statut</div>
              <div class="info-value">
                ${getDisplayStatus(selectedEnqueteForAction.status)}
                <span class="status-badge" style="background-color: ${
            selectedEnqueteForAction.status === 'en_cours' ? '#fef3c7' :
                selectedEnqueteForAction.status === 'finalise' ? '#d1fae5' :
                    selectedEnqueteForAction.status === 'classifier' ? '#dbeafe' :
                        selectedEnqueteForAction.status === 'investigation' ? '#f3e8ff' :
                            selectedEnqueteForAction.status === 'transmis_autorite' ? '#e0e7ff' : '#f3f4f6'
        }; color: ${
            selectedEnqueteForAction.status === 'en_cours' ? '#92400e' :
                selectedEnqueteForAction.status === 'finalise' ? '#065f46' :
                    selectedEnqueteForAction.status === 'classifier' ? '#1e40af' :
                        selectedEnqueteForAction.status === 'investigation' ? '#6b21a8' :
                            selectedEnqueteForAction.status === 'transmis_autorite' ? '#3730a3' : '#374151'
        };">
                  ${getDisplayStatus(selectedEnqueteForAction.status)}
                </span>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Assigné à</div>
              <div class="info-value">${getDisplayAssignedTo(selectedEnqueteForAction.assigned_to)}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Type de signalement</div>
              <div class="info-value">${selectedEnqueteForAction.type_signalement}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">INFORMATIONS DE L'AUTEUR</h3>
          ${
            selectedEnqueteForAction.type_signalement === "Anonyme"
                ? '<p><em>Signalement anonyme</em></p>'
                : `
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Nom / Prénom</div>
                    <div class="info-value">${selectedEnqueteForAction.nom_prenom}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${selectedEnqueteForAction.email}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Téléphone</div>
                    <div class="info-value">${selectedEnqueteForAction.telephone}</div>
                  </div>
                </div>
              `
        }
        </div>
        
        <div class="section">
          <h3 class="section-title">DESCRIPTION DU SIGNALEMENT</h3>
          <div class="description-box">
            ${selectedEnqueteForAction.explication || "Aucune description fournie"}
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">INFORMATIONS GÉOGRAPHIQUES</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Région</div>
              <div class="info-value">${selectedEnqueteForAction.region}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Province</div>
              <div class="info-value">${selectedEnqueteForAction.province}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">PIÈCES JOINTES</h3>
          ${
            selectedEnqueteForAction.files && selectedEnqueteForAction.files.length > 0
                ? `
                <p style="margin-bottom: 10px; color: #555;">Nombre de fichiers: ${selectedEnqueteForAction.files.length}</p>
                <ul class="files-list">
                  ${selectedEnqueteForAction.files.map((file, idx) => {
                    const fileName = typeof file === "string" ? file : file.name || "";
                    return `
                      <li class="file-item">
                        Fichier ${idx + 1}: ${fileName}
                      </li>
                    `;
                }).join('')}
                </ul>
              `
                : '<p><em>Aucun fichier joint</em></p>'
        }
        </div>
        
        <div class="footer">
          <p><strong>© DAAQ-MESUPRES - Système FOSIKA</strong></p>
          <p>À usage officiel - Document confidentiel</p>
          <p>Page 1/1 - Référence: ${selectedEnqueteForAction.reference}</p>
        </div>
      </body>
      </html>
    `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent.innerHTML);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        setShowPrintModal(false);
        setSelectedEnqueteForAction(null);
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
            total: filteredEnquetes.length,
            en_cours: filteredEnquetes.filter((r) => r.status === "en_cours").length,
            finalise: filteredEnquetes.filter((r) => r.status === "finalise").length,
            investigation: filteredEnquetes.filter((r) => r.status === "investigation")
                .length,
            transmis_autorite: filteredEnquetes.filter(
                (r) => r.status === "transmis_autorite"
            ).length,
            classifier: filteredEnquetes.filter((r) => r.status === "classifier")
                .length,
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

                pdf.save(`rapport_dossiers_${generatedReport.dateGeneration}.pdf`);
            })
            .catch((error) => {
                console.error("Erreur lors de la génération du PDF:", error);
            });
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

    const exportEnquetes = () => {
        const csvContent = [
            [
                "RÉFÉRENCE",
                "DATE",
                "Nom/Prénom",
                "Catégorie",
                "Statut",
                "Assigné à",
            ],
            ...filteredEnquetes.map((enquete) => [
                enquete.reference,
                enquete.date,
                enquete.nom_prenom,
                enquete.categorie,
                getDisplayStatus(enquete.status),
                getDisplayAssignedTo(enquete.assigned_to),
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
            `dossiers_assignes_${new Date().toISOString().split("T")[0]}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const getTabStats = () => {
        return {
            tous: allEnquetes.length,
            "en cours": allEnquetes.filter((e) => e.status === "en_cours").length,
            "finalisé": allEnquetes.filter((e) => e.status === "finalise").length,
            "complété": allEnquetes.filter((e) => e.status === "classifier").length,
            investigation: allEnquetes.filter((e) => e.status === "investigation").length,
            "transmis aux autorités compétentes": allEnquetes.filter((e) => e.status === "transmis_autorite").length,
        };
    };

    const tabStats = getTabStats();

    if (selectedEnquete && !generatedReport) {
        return (
            <>
                <div className="p-4 bg-white min-h-screen">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                Détail du Dossier - {selectedEnquete.reference}
                            </h1>
                            <p className="text-xs text-gray-600 mt-1">
                                {selectedEnquete.date} • {selectedEnquete.categorie}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedEnquete(null)}
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
                                                {selectedEnquete.reference}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block mb-1">Date:</span>
                                            <p className="font-medium text-sm">{selectedEnquete.date}</p>
                                        </div>
                                        <div>
                      <span className="text-gray-600 block mb-1">
                        Catégorie:
                      </span>
                                            <p className="font-medium text-sm">
                                                {selectedEnquete.categorie}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 block mb-1">Statut:</span>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    selectedEnquete.status === "en_cours"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : selectedEnquete.status === "finalise"
                                                            ? "bg-green-100 text-green-800"
                                                            : selectedEnquete.status === "classifier"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : selectedEnquete.status === "investigation"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : selectedEnquete.status === "transmis_autorite"
                                                                        ? "bg-indigo-100 text-indigo-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                        {getDisplayStatus(selectedEnquete.status)}
                      </span>
                                        </div>
                                        <div>
                      <span className="text-gray-600 block mb-1">
                        Assigné à:
                      </span>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    selectedEnquete.assigned_to === "investigateur"
                                                        ? "bg-indigo-100 text-indigo-800"
                                                        : selectedEnquete.assigned_to === "cac_daj"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : selectedEnquete.assigned_to === "autorite_competente"
                                                                ? "bg-cyan-100 text-cyan-800"
                                                                : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                        {getDisplayAssignedTo(selectedEnquete.assigned_to)}
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
                                    {selectedEnquete.type_signalement === "Anonyme" ? (
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
                                                    {selectedEnquete.nom_prenom}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-gray-600 block mb-1">Email:</span>
                                                <p className="font-medium text-sm">
                                                    {selectedEnquete.email}
                                                </p>
                                            </div>
                                            <div>
                        <span className="text-gray-600 block mb-1">
                          Téléphone:
                        </span>
                                                <p className="font-medium text-sm">
                                                    {selectedEnquete.telephone}
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
                                        {selectedEnquete.explication}
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
                                    {selectedEnquete.files && selectedEnquete.files.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedEnquete.files.map((file, idx) => {
                                                const fileName = typeof file === "string" ? file : file.name || "";
                                                const ext = fileName.split(".").pop()?.toLowerCase();
                                                const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                                                const isPdf = ext === "pdf";

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="bg-gray-50 rounded-lg border overflow-hidden"
                                                    >
                                                        <div className="aspect-video bg-white flex items-center justify-center">
                                                            {isImage ? (
                                                                <img
                                                                    src={`${API.defaults.baseURL}/files/${encodeURIComponent(fileName)}`}
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

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePrintEnquete(selectedEnquete)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Printer className="w-3 h-3" />
                                Imprimer
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleStatusUpdate(selectedEnquete)}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                            >
                                <Filter className="w-3 h-3" />
                                Statut
                            </button>
                        </div>
                    </div>
                </div>

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
                                        <option value="classifier">Complété</option>
                                        <option value="transmis_autorite">
                                            Transmis aux autorités compétentes
                                        </option>
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

                {showPrintModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-full">
                                        <Printer className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            Impression du dossier
                                        </h2>
                                        <p className="text-blue-100 text-sm">Génération du document</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-800 text-sm">
                                            Dossier à imprimer
                                        </h3>
                                        <p className="text-blue-600 text-xs">
                                            {selectedEnqueteForAction?.reference} -{" "}
                                            {selectedEnqueteForAction?.nom_prenom}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="font-semibold text-green-800 text-sm mb-1">
                                                Document professionnel
                                            </h4>
                                            <p className="text-green-700 text-xs leading-relaxed">
                                                Le document généré inclura les logos officiels, toutes les informations du dossier
                                                et sera formaté pour une impression professionnelle.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-gray-400" />
                                    <span>
                    Le document s'ouvrira dans une nouvelle fenêtre pour impression
                  </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                                <button
                                    onClick={() => setShowPrintModal(false)}
                                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={printDossier}
                                    className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Imprimer le dossier
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
                            Génération de Rapport - Dossiers Assignés
                        </h1>
                        <p className="text-sm text-gray-600 mt-2">
                            Configurez et prévisualisez votre rapport des dossiers assignés
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
                                            <span className="text-sm">
                        {cat.emoji} {cat.name}
                      </span>
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
                                        Rapport des Dossiers Assignés
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
                                        Statistiques des Dossiers Assignés
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Total des dossiers assignés:</span>
                                            <span className="font-bold">
                        {generatedReport.stats.total}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Dossiers en cours:</span>
                                            <span className="font-bold text-amber-600">
                        {generatedReport.stats.en_cours}
                      </span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Dossiers finalisés:</span>
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
                                        <div className="flex justify-between">
                                            <span>Dossiers complétés:</span>
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
                                            et présente une analyse exhaustive des dossiers assignés
                                            concernant les irrégularités dans le secteur de
                                            l'enseignement supérieur et de la recherche scientifique.
                                        </p>

                                        <p>
                                            Durant cette période,{" "}
                                            <strong>
                                                {generatedReport.stats.total} dossiers assignés
                                            </strong>{" "}
                                            ont été traités par notre système. La répartition par statut
                                            démontre l'avancement des investigations :
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
                                                <strong>
                                                    {generatedReport.stats.classifier} dossiers
                                                </strong>{" "}
                                                ont été complétés et classés
                                            </li>
                                        </ul>

                                        <p>
                                            Le système FOSIKA continue de démontrer son efficacité dans
                                            le traitement des dossiers assignés et le suivi des
                                            investigations. Notre plateforme assure un suivi rigoureux
                                            de chaque dossier depuis son assignation jusqu'à sa
                                            résolution définitive.
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
                                        Système FOSIKA - Plateforme de gestion des dossiers assignés
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
                            : "Dossiers à enquêter"}
                    </h1>
                    <p className="text-xs text-gray-500">
                        {currentTab === "classifier"
                            ? "Dossiers ayant déjà été complétés."
                            : "Gérez et suivez vos dossiers d'enquête assignés"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={exportEnquetes}
                        className="flex items-center gap-1 px-3 py-1 text-xs border rounded-md hover:bg-gray-50"
                    >
                        <Download className="w-3 h-3" />
                        Exporter CSV
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1 px-3 py-1 text-xs border rounded-md hover:bg-gray-50"
                    >
                        <FileText className="w-3 h-3" />
                        Générer rapport
                    </button>
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
                        currentTab === "en cours"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("en cours");
                        setCurrentPage(1);
                    }}
                >
                    En cours ({tabStats["en cours"]})
                </button>

                <button
                    className={
                        currentTab === "finalisé"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("finalisé");
                        setCurrentPage(1);
                    }}
                >
                    Finalisé ({tabStats["finalisé"]})
                </button>

                <button
                    className={
                        currentTab === "complété"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("complété");
                        setCurrentPage(1);
                    }}
                >
                    Complété ({tabStats["complété"]})
                </button>

                <button
                    className={
                        currentTab === "investigation"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("investigation");
                        setCurrentPage(1);
                    }}
                >
                    Investigation ({tabStats.investigation})
                </button>

                <button
                    className={
                        currentTab === "transmis aux autorités compétentes"
                            ? "px-3 py-1 text-xs rounded-full bg-blue-600 text-white"
                            : "px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                    }
                    onClick={() => {
                        setCurrentTab("transmis aux autorités compétentes");
                        setCurrentPage(1);
                    }}
                >
                    Transmis ({tabStats["transmis aux autorités compétentes"]})
                </button>
            </div>

            {/* Filtres améliorés avec date */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <div className="md:col-span-2">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            placeholder="Rechercher par référence, nom..."
                            className="w-full pl-8 pr-2 py-1 text-xs border rounded-md"
                        />
                    </div>
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
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <div className="relative flex-1">
                        <Calendar className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={filters.dateDebut}
                            onChange={(e) => handleFilterChange("dateDebut", e.target.value)}
                            className="w-full pl-7 pr-2 py-1 text-xs border rounded-md"
                            placeholder="Date début"
                            title="Filtrer par date de début"
                        />
                    </div>
                    <span className="text-xs text-gray-400">à</span>
                    <div className="relative flex-1">
                        <Calendar className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="date"
                            value={filters.dateFin}
                            onChange={(e) => handleFilterChange("dateFin", e.target.value)}
                            className="w-full pl-7 pr-2 py-1 text-xs border rounded-md"
                            placeholder="Date fin"
                            title="Filtrer par date de fin"
                        />
                    </div>
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
                    {filteredEnquetes.length} dossiers trouvés
                    {(filters.dateDebut || filters.dateFin) && (
                        <span className="ml-2 text-blue-600">
              {filters.dateDebut && `Depuis: ${formatDate(filters.dateDebut)}`}
                            {filters.dateDebut && filters.dateFin && " - "}
                            {filters.dateFin && `Jusqu'à: ${formatDate(filters.dateFin)}`}
            </span>
                    )}
                </div>
            </div>

            <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                            Chargement en cours...
                        </div>
                    ) : filteredEnquetes.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                            <div className="flex flex-col items-center justify-center py-8">
                                <Search className="w-8 h-8 text-gray-400 mb-2" />
                                <p>Aucun dossier trouvé avec les filtres actuels</p>
                                {(filters.search || filters.statut || filters.dateDebut || filters.dateFin) && (
                                    <button
                                        onClick={resetFilters}
                                        className="mt-3 px-3 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                )}
                            </div>
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
                                <th className="px-2 py-2 text-left">ACTIONS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginatedEnquetes.map((enquete) => (
                                <tr key={enquete.id} className="border-t hover:bg-gray-50">
                                    <td className="px-2 py-2 font-medium">
                                        {enquete.reference}
                                    </td>
                                    <td className="px-2 py-2">{enquete.date}</td>
                                    <td className="px-2 py-2">{enquete.nom_prenom}</td>
                                    <td className="px-2 py-2">{enquete.categorie}</td>
                                    <td className="px-2 py-2">
                      <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              enquete.status === "en_cours"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : enquete.status === "finalise"
                                      ? "bg-green-100 text-green-800"
                                      : enquete.status === "classifier"
                                          ? "bg-blue-100 text-blue-800"
                                          : enquete.status === "investigation"
                                              ? "bg-purple-100 text-purple-800"
                                              : enquete.status === "transmis_autorite"
                                                  ? "bg-indigo-100 text-indigo-800"
                                                  : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {getDisplayStatus(enquete.status)}
                      </span>
                                    </td>
                                    <td className="px-2 py-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleViewEnquete(enquete)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                title="Voir détails"
                                            >
                                                <Eye className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handlePrintEnquete(enquete)}
                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                                title="Imprimer"
                                            >
                                                <Printer className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleStatusUpdate(enquete)}
                                                className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                                                title="Mettre à jour statut"
                                            >
                                                <Filter className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {filteredEnquetes.length > 0 && (
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
                                {Math.min(indexOfLastItem, filteredEnquetes.length)} sur{" "}
                                {filteredEnquetes.length}
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
                                    <option value="classifier">Complété</option>
                                    <option value="transmis_autorite">
                                        Transmis aux autorités compétentes
                                    </option>
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

            {showPrintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform transition-all">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                    <Printer className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        Impression du dossier
                                    </h2>
                                    <p className="text-blue-100 text-sm">Génération du document</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-800 text-sm">
                                        Dossier à imprimer
                                    </h3>
                                    <p className="text-blue-600 text-xs">
                                        {selectedEnqueteForAction?.reference} -{" "}
                                        {selectedEnqueteForAction?.nom_prenom}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-green-800 text-sm mb-1">
                                            Document professionnel
                                        </h4>
                                        <p className="text-green-700 text-xs leading-relaxed">
                                            Le document généré inclura les logos officiels, toutes les informations du dossier
                                            et sera formaté pour une impression professionnelle.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-gray-400" />
                                <span>
                  Le document s'ouvrira dans une nouvelle fenêtre pour impression
                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={printDossier}
                                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Imprimer le dossier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnquetesView;