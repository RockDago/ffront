import React, { useEffect, useRef, useState } from "react";
import API from "../../config/axios";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Eye,
    Printer,
    Filter,
    Edit,
    Trash2,
} from "lucide-react";

// Couleurs graphiques
const chartColors = [
    { border: "#2B6CB0", background: "rgba(43,108,176,0.08)" },
    { border: "#6B7280", background: "rgba(107,114,128,0.08)" },
    { border: "#16A34A", background: "rgba(22,163,74,0.08)" },
    { border: "#D97706", background: "rgba(217,119,6,0.06)" },
    { border: "#44403C", background: "rgba(68,64,60,0.06)" },
    { border: "#475569", background: "rgba(71,85,105,0.06)" },
];

const pieColors = [
    "#2B6CB0",
    "#6B7280",
    "#16A34A",
    "#D97706",
    "#475569",
    "#94A3B8",
    "#CBD5E1",
    "#9CA3AF",
];

// Catégories avec texte à la ligne pour les noms trop longs
const defaultCategoryStructure = [
    {
        id: "faux-diplomes",
        name: "Faux diplômes",
        subtitle: "Délivrance illégale",
        icon: "📜",
    },
    {
        id: "offre-formation-irreguliere",
        name: "Offre de formation\nirrégulière (non habilité)",
        subtitle: "Offre irrégulière",
        icon: "🎓",
    },
    {
        id: "recrutements-irreguliers",
        name: "Recrutements",
        subtitle: "Irrégularités RH",
        icon: "👥",
    },
    {
        id: "harcelement",
        name: "Harcèlement",
        subtitle: "Signalements",
        icon: "⚠️",
    },
    {
        id: "corruption",
        name: "Corruption",
        subtitle: "Malversations",
        icon: "🔴",
    },
    {
        id: "divers",
        name: "Divers",
        subtitle: "Autres",
        icon: "🏷️",
    },
];

// Composants UI
const KPICard = ({ title, value, subtitle, icon, color, onClick, isActive }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-xl p-4 shadow-sm border cursor-pointer transition-all duration-200 
      ${
            isActive
                ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/30"
                : "border-slate-100 hover:shadow-md hover:border-slate-200"
        }`}
    >
        <div className="flex justify-between items-start">
            <div>
                <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                        isActive ? "text-blue-700" : "text-slate-500"
                    }`}
                >
                    {title}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
                <span className="text-xl">{icon}</span>
            </div>
        </div>
    </div>
);

// Fonction pour obtenir l'affichage du statut (identique à ReportsView)
const getDisplayStatus = (status) => {
    const statusMap = {
        en_cours: "En cours",
        investigation: "Ouverture d'enquêtes",
        transmis_autorite: "Transmis aux autorités compétentes",
        classifier: "Dossier classé sans suite",
    };
    return statusMap[status] || status || "Statut inconnu";
};

// Composant pour l'icône de tri (nouveau style comme ReportsView)
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

export default function DashboardView() {
    const chartRef = useRef(null);
    const barChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const chartInstance = useRef(null);
    const barChartInstance = useRef(null);
    const pieChartInstance = useRef(null);

    const navigate = useNavigate();

    const [allReports, setAllReports] = useState([]);
    const [categories, setCategories] = useState([]);
    const [globalStats, setGlobalStats] = useState({
        total: 0,
        en_cours: 0,
        investigation: 0,
        transmis_autorite: 0,
        classifier: 0,
    });
    const [monthTotal, setMonthTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [timeFilter, setTimeFilter] = useState("year");
    const [tableFilterStatus, setTableFilterStatus] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [paginatedReports, setPaginatedReports] = useState([]);
    const [filteredTotalCount, setFilteredTotalCount] = useState(0);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // États pour le tri (nouveau style)
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });

    useEffect(() => {
        initializeCategoriesWithZero();
        fetchDashboardData();
        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
            if (barChartInstance.current) barChartInstance.current.destroy();
            if (pieChartInstance.current) pieChartInstance.current.destroy();
        };
    }, []);

    useEffect(() => {
        if (categories.length > 0 && allReports.length > 0) {
            initializeChart();
            initializeBarChart();
            initializePieChart();
        }
    }, [timeFilter, categories, allReports]);

    useEffect(() => {
        updateTableData();
    }, [allReports, currentPage, pageSize, tableFilterStatus, sortConfig]);

    const initializeCategoriesWithZero = () => {
        const initialCategories = defaultCategoryStructure.map((category, index) => ({
            ...category,
            total: 0,
            encours: 0,
            investigation: 0,
            transmis_autorite: 0,
            classifier: 0,
            color: chartColors[index],
        }));
        setCategories(initialCategories);
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await API.get("/reports?per_page=5000");

            const data = Array.isArray(response?.data?.data)
                ? response.data.data
                : [];

            setAllReports(data);

            if (data.length > 0) {
                calculateStatsFromReports(data);
                calculateMonthTotal(data);
            }
        } catch (err) {
            console.error("Erreur dashboard:", err);
            setError("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthTotal = (data) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const count = data.filter(
            (r) => r.created_at && new Date(r.created_at) >= startOfMonth
        ).length;
        setMonthTotal(count);
    };

    const calculateStatsFromReports = (reports) => {
        const total = reports.length;

        // Compter basé sur les valeurs exactes comme dans ReportsView
        const en_cours = reports.filter((r) => r.status === "en_cours").length;
        const investigation = reports.filter((r) => r.status === "investigation").length;
        const transmis_autorite = reports.filter((r) => r.status === "transmis_autorite").length;
        const classifier = reports.filter((r) => r.status === "classifier").length;

        setGlobalStats({
            total,
            en_cours,
            investigation,
            transmis_autorite,
            classifier
        });

        const updatedCategories = defaultCategoryStructure.map(
            (category, index) => {
                const catReports = reports.filter((r) => r.category === category.id);

                const cat_en_cours = catReports.filter((r) => r.status === "en_cours").length;
                const cat_investigation = catReports.filter((r) => r.status === "investigation").length;
                const cat_transmis_autorite = catReports.filter((r) => r.status === "transmis_autorite").length;
                const cat_classifier = catReports.filter((r) => r.status === "classifier").length;

                return {
                    ...category,
                    total: catReports.length,
                    encours: cat_en_cours,
                    investigation: cat_investigation,
                    transmis_autorite: cat_transmis_autorite,
                    classifier: cat_classifier,
                    color: chartColors[index],
                };
            }
        );
        setCategories(updatedCategories);
    };

    const updateTableData = () => {
        let filtered = [...allReports];

        if (tableFilterStatus !== "all") {
            // Pour "en_cours", inclure aussi "investigation" comme dans ReportsView
            if (tableFilterStatus === "en_cours") {
                filtered = filtered.filter((r) =>
                    r.status === "en_cours" || r.status === "investigation"
                );
            } else {
                filtered = filtered.filter((r) => r.status === tableFilterStatus);
            }
        }

        // Appliquer le tri (nouveau style)
        filtered.sort((a, b) => {
            if (!sortConfig.key) return 0;

            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            if (sortConfig.key === "date") {
                aValue = new Date(a.created_at || 0);
                bValue = new Date(b.created_at || 0);
            }

            if (sortConfig.key === "reference") {
                aValue = (a.reference || `REF-${a.id}`).toLowerCase();
                bValue = (b.reference || `REF-${b.id}`).toLowerCase();
            }

            if (sortConfig.key === "description") {
                aValue = (a.description || "").toLowerCase();
                bValue = (b.description || "").toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });

        setFilteredTotalCount(filtered.length);

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const slice = filtered.slice(startIndex, endIndex);

        // Créer une description abrégée exactement comme dans ReportsView
        const mapped = slice.map((report) => {
            const fullDescription = report.description || "Aucune description";
            const shortDescription = fullDescription.length > 80
                ? fullDescription.substring(0, 80) + '...'
                : fullDescription;

            // Obtenir le label de catégorie avec gestion des lignes
            const cat = categories.find(c => c.id === report.category);
            const categorieLabel = cat ? cat.name : report.category;

            return {
                id: report.id,
                reference: report.reference || `REF-${report.id}`,
                date: report.created_at
                    ? new Date(report.created_at).toLocaleDateString("fr-FR")
                    : "-",
                name: report.is_anonymous
                    ? "Anonyme"
                    : report.name || "Non spécifié",
                category: categorieLabel,
                regionprovince: report.region || "-",
                status: report.status,
                displayStatus: getDisplayStatus(report.status),
                description: report.description || "Aucune description",
                shortDescription: shortDescription,
                rawStatus: report.status,
            };
        });

        setPaginatedReports(mapped);
    };

    const handleSortClick = (key) => {
        setSortConfig((current) => ({
            key,
            direction:
                current.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
        setCurrentPage(1);
    };

    const handleKPIClick = (status) => {
        let newStatus;

        // Si on clique sur "en_cours" KPI, filtrer aussi les "investigation"
        if (status === "en_cours") {
            // Si le filtre actif est déjà "en_cours", le désactiver
            if (tableFilterStatus === "en_cours") {
                newStatus = "all";
            } else {
                newStatus = "en_cours";
            }
        } else {
            newStatus = tableFilterStatus === status ? "all" : status;
        }

        setTableFilterStatus(newStatus);
        setCurrentPage(1);
    };

    const generateTimeBasedData = () => {
        let labels = [];
        let datasets = [];
        const now = new Date();
        const monthsShort = [
            "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
            "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
        ];

        const makeDatasets = (labelArray, rangeChecks) => {
            return categories.map((category) => {
                const data = labelArray.map((_, li) => {
                    const check = rangeChecks[li];
                    return allReports.filter((report) => {
                        if (!report.created_at) return false;
                        const d = new Date(report.created_at);
                        return check(d) && report.category === category.id;
                    }).length;
                });
                return {
                    label: category.name.replace(/\n/g, ' '),
                    data,
                    borderColor: category.color.border,
                    backgroundColor: category.color.background,
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3,
                    borderWidth: 2,
                };
            });
        };

        if (timeFilter === "day") {
            const start = new Date(now);
            start.setHours(start.getHours() - 23);
            const hours = Array.from(
                { length: 24 },
                (_, i) => new Date(start.getTime() + i * 3600000)
            );
            labels = hours.map((h) => `${h.getHours()}h`);
            const rangeChecks = hours.map(
                (h) => (d) =>
                    d.getDate() === h.getDate() &&
                    d.getMonth() === h.getMonth() &&
                    d.getHours() === h.getHours()
            );
            datasets = makeDatasets(labels, rangeChecks);
        } else if (timeFilter === "week") {
            const start = new Date(now);
            start.setDate(start.getDate() - 6);
            const days = Array.from(
                { length: 7 },
                (_, i) => new Date(start.getTime() + i * 86400000)
            );
            labels = days.map((d) => `${d.getDate()}/${d.getMonth() + 1}`);
            const rangeChecks = days.map(
                (day) => (d) =>
                    d.getDate() === day.getDate() && d.getMonth() === day.getMonth()
            );
            datasets = makeDatasets(labels, rangeChecks);
        } else if (timeFilter === "month") {
            labels = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
            const rangeChecks = [0, 1, 2, 3].map(
                (w) => (d) => Math.ceil(d.getDate() / 7) === w + 1
            );
            datasets = makeDatasets(labels, rangeChecks);
        } else {
            const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
            const months = Array.from(
                { length: 12 },
                (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1)
            );
            // Afficher seulement le nom du mois, pas l'année
            labels = months.map((m) => monthsShort[m.getMonth()]);
            const rangeChecks = months.map(
                (m) => (d) =>
                    d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
            );
            datasets = makeDatasets(labels, rangeChecks);
        }

        return { labels, datasets };
    };

    const getReportsByMonthAndCategory = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        const months = Array.from(
            { length: 12 },
            (_, i) => new Date(start.getFullYear(), start.getMonth() + i, 1)
        );
        const monthsShort = [
            "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
            "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
        ];

        // Afficher seulement le nom du mois
        const labels = months.map((m) => monthsShort[m.getMonth()]);

        const datasets = categories.map((cat) => {
            return {
                label: cat.name.replace(/\n/g, ' '),
                data: months.map((m) =>
                    allReports.filter((r) => {
                        const d = new Date(r.created_at);
                        return (
                            d.getMonth() === m.getMonth() &&
                            d.getFullYear() === m.getFullYear() &&
                            r.category === cat.id
                        );
                    }).length
                ),
                backgroundColor: cat.color.border,
                borderColor: cat.color.border,
                borderWidth: 1,
            };
        });

        return { labels, datasets };
    };

    const initializeChart = () => {
        if (!chartRef.current) return;
        const { labels, datasets } = generateTimeBasedData();
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext("2d");
        chartInstance.current = new Chart(ctx, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            font: {
                                size: 9
                            },
                            padding: 15
                        },
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { borderDash: [2, 4] },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                },
            },
        });
    };

    const initializeBarChart = () => {
        if (!barChartRef.current) return;
        if (barChartInstance.current) barChartInstance.current.destroy();

        const { labels, datasets } = getReportsByMonthAndCategory();

        const ctx = barChartRef.current.getContext("2d");
        barChartInstance.current = new Chart(ctx, {
            type: "bar",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 10,
                            font: {
                                size: 9
                            }
                        }
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                            },
                            font: {
                                size: 10
                            }
                        },
                        title: {
                            display: true,
                            text: 'Nombre de signalements',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                datasets: {
                    bar: {
                        categoryPercentage: 0.8,
                        barPercentage: 0.9,
                    }
                }
            },
        });
    };

    const initializePieChart = () => {
        if (!pieChartRef.current) return;
        if (pieChartInstance.current) pieChartInstance.current.destroy();

        const validCats = categories.filter((c) => c.total > 0);
        const total = validCats.reduce((sum, cat) => sum + cat.total, 0);

        // Calculer les pourcentages
        const percentages = validCats.map(cat =>
            total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0
        );

        // Créer les labels avec pourcentages
        const labelsWithPercent = validCats.map((c, i) =>
            `${c.name.replace(/\n/g, ' ')} (${percentages[i]}%)`
        );

        const ctx = pieChartRef.current.getContext("2d");
        pieChartInstance.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labelsWithPercent,
                datasets: [
                    {
                        data: validCats.map((c) => c.total),
                        backgroundColor: pieColors,
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "right",
                        labels: {
                            boxWidth: 10,
                            font: {
                                size: 9
                            },
                            padding: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label.split(' (')[0]}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
            },
        });
    };

    const getTimeFilterTitle = () => {
        switch (timeFilter) {
            case "day": return "Heures (24h)";
            case "week": return "Jours de la semaine";
            case "month": return "Semaines du mois";
            case "year": return "Mois de l'année";
            default: return "Mois";
        }
    };

    const DatePicker = () => (
        <div className="absolute top-10 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 min-w-60">
            <div className="space-y-1">
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    onClick={() => {
                        setTimeFilter("day");
                        setShowDatePicker(false);
                    }}
                >
                    Jour
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    onClick={() => {
                        setTimeFilter("week");
                        setShowDatePicker(false);
                    }}
                >
                    Semaine
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    onClick={() => {
                        setTimeFilter("month");
                        setShowDatePicker(false);
                    }}
                >
                    Mois
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                    onClick={() => {
                        setTimeFilter("year");
                        setShowDatePicker(false);
                    }}
                >
                    Année
                </button>
            </div>
        </div>
    );

    // Fonction pour générer les numéros de page (style ReportsView)
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

    const totalPages =
        filteredTotalCount === 0 ? 1 : Math.ceil(filteredTotalCount / pageSize);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-red-600 font-bold text-sm">Erreur</h3>
                    <p className="text-slate-600 mt-1 text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-5 space-y-5">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Tableau de bord
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Vue d'ensemble synchronisée en temps réel
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 bg-white"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="text-sm">
                                {timeFilter === "day"
                                    ? "Jour"
                                    : timeFilter === "week"
                                        ? "Semaine"
                                        : timeFilter === "month"
                                            ? "Mois"
                                            : "Année"}
                            </span>
                        </button>
                        {showDatePicker && <DatePicker />}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <KPICard
                        title="Total"
                        value={globalStats.total}
                        subtitle="Tous les signalements"
                        icon="📊"
                        color="bg-blue-500"
                        isActive={tableFilterStatus === "all"}
                        onClick={() => handleKPIClick("all")}
                    />
                    <KPICard
                        title="En cours"
                        value={globalStats.en_cours}
                        subtitle="Signalements en cours"
                        icon="⏳"
                        color="bg-yellow-500"
                        isActive={tableFilterStatus === "en_cours"}
                        onClick={() => handleKPIClick("en_cours")}
                    />
                    <KPICard
                        title="Enquêtes"
                        value={globalStats.investigation}
                        subtitle="Investigation en cours"
                        icon="🔍"
                        color="bg-purple-500"
                        isActive={tableFilterStatus === "investigation"}
                        onClick={() => handleKPIClick("investigation")}
                    />
                    <KPICard
                        title="Transmis"
                        value={globalStats.transmis_autorite}
                        subtitle="Transmis pour action"
                        icon="⚖️"
                        color="bg-indigo-500"
                        isActive={tableFilterStatus === "transmis_autorite"}
                        onClick={() => handleKPIClick("transmis_autorite")}
                    />
                    <KPICard
                        title="Classés"
                        value={globalStats.classifier}
                        subtitle="Classés sans suite"
                        icon="📋"
                        color="bg-emerald-500"
                        isActive={tableFilterStatus === "classifier"}
                        onClick={() => handleKPIClick("classifier")}
                    />
                </div>

                {/* Catégories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-slate-800 whitespace-pre-line leading-tight">
                                            {category.name}
                                        </p>
                                        <p className="text-xs text-slate-400">{category.subtitle}</p>
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-slate-900">{category.total}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide">En cours</p>
                                    <p className="font-semibold text-amber-600">{category.encours}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide">Enquêtes</p>
                                    <p className="font-semibold text-purple-600">{category.investigation}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide">Transmis</p>
                                    <p className="font-semibold text-indigo-600">{category.transmis_autorite}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wide">Classés</p>
                                    <p className="font-semibold text-emerald-600">{category.classifier}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-800 text-sm">Évolution temporelle</h3>
                        </div>
                        <div className="h-64 w-full">
                            <canvas ref={chartRef} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                        <h3 className="font-bold text-slate-800 mb-3 text-sm">
                            Répartition par type
                        </h3>
                        <div className="h-64 w-full flex items-center justify-center">
                            <canvas ref={pieChartRef} />
                        </div>
                    </div>
                </div>

                {/* Graphique en barres */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                    <h3 className="font-bold text-slate-800 mb-3 text-sm">
                        Détails mensuels par catégorie
                    </h3>
                    <div className="h-64 w-full">
                        <canvas ref={barChartRef} />
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">
                        Chaque catégorie est représentée par des barres individuelles côte à côte pour chaque mois
                    </p>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Header table */}
                    <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">
                                Liste des dossiers récents
                            </h3>
                            {tableFilterStatus !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                    Filtre : {getDisplayStatus(tableFilterStatus)}
                                    <button
                                        type="button"
                                        onClick={() => handleKPIClick("all")}
                                        className="ml-0.5 p-0.5 hover:bg-blue-100 rounded-full"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="w-3 h-3"
                                        >
                                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                        </svg>
                                    </button>
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500 text-xs">Lignes :</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="form-select text-xs border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500 py-1 px-2 bg-slate-50"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    {/* Content table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSortClick("id")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full text-left"
                                    >
                                        <span>ID</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "id"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSortClick("reference")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full text-left"
                                    >
                                        <span>RÉFÉRENCE</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "reference"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSortClick("date")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full text-left"
                                    >
                                        <span>DATE</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "date"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    NOM / PRÉNOM
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[120px]">
                                    CATÉGORIE
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSortClick("description")}
                                        className="flex items-center gap-1 hover:text-blue-600 transition-colors w-full text-left"
                                    >
                                        <span>DESCRIPTION</span>
                                        <SortIcon
                                            isSorted={sortConfig.key === "description"}
                                            isAsc={sortConfig.direction === "asc"}
                                        />
                                    </button>
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    STATUT
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedReports.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <span className="text-3xl mb-1">🔍</span>
                                            <p className="text-xs">
                                                Aucun dossier trouvé pour ce filtre.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-default"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-medium text-slate-700">
                                            {report.id}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-medium text-blue-600 group-hover:text-blue-700">
                                            {report.reference}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                                            {report.date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-900">
                                            {report.name}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-pre-line leading-tight">
                                            {report.category}
                                        </td>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <div className="text-xs text-gray-600 line-clamp-2">
                                                {report.shortDescription}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    report.status === "en_cours"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : report.status === "transmis_autorite"
                                                            ? "bg-indigo-100 text-indigo-800"
                                                            : report.status === "classifier"
                                                                ? "bg-blue-100 text-blue-800"
                                                                : report.status === "investigation"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {report.displayStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer pagination */}
                    <div className="bg-white px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500">Éléments par page :</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-2 py-1 border rounded text-xs"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span className="text-gray-500">
                                {filteredTotalCount === 0
                                    ? 0
                                    : (currentPage - 1) * pageSize + 1}
                                -
                                {Math.min(currentPage * pageSize, filteredTotalCount)} sur{" "}
                                {filteredTotalCount}
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>

                            {getPageNumbers().map((page, idx) =>
                                page === "..." ? (
                                    <span
                                        key={`ellipsis-${idx}`}
                                        className="px-1.5 text-xs text-gray-500"
                                    >
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-2 py-0.5 text-xs border rounded ${
                                            currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "bg-white hover:bg-gray-50"
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
                                className="p-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}