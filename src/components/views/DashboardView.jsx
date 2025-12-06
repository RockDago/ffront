import React, { useEffect, useRef, useState } from "react";
import API from "../../config/axios";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";

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

// Catégories
const defaultCategoryStructure = [
    {
        id: "faux-diplomes",
        name: "Faux diplômes",
        subtitle: "Délivrance illégale",
        icon: "📜",
    },
    {
        id: "offre-formation-irreguliere",
        name: "Non habilité",
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

// Composants UI (conservés de l'ancien code)
const KPICard = ({ title, value, subtitle, icon, color, onClick, isActive }) => (
    <div
        onClick={onClick}
        className={`bg-white rounded-xl p-5 shadow-sm border cursor-pointer transition-all duration-200 
      ${
            isActive
                ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/30"
                : "border-slate-100 hover:shadow-md hover:border-slate-300"
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
                <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    </div>
);

const CategoryCard = ({ category }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <div>
                    <p className="text-sm font-semibold text-slate-800">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.subtitle}</p>
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{category.total}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <div>
                <p className="text-[11px] uppercase tracking-wide">En cours</p>
                <p className="mt-1 font-semibold text-amber-600">{category.encours}</p>
            </div>
            <div>
                <p className="text-[11px] uppercase tracking-wide">Traités</p>
                <p className="mt-1 font-semibold text-emerald-600">
                    {(category.soumis_bianco || 0) + (category.enquetes_completees || 0)}
                </p>
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        en_cours: {
            label: "En cours",
            cls: "bg-blue-50 text-blue-700 border-blue-200",
        },
        finalise: {
            label: "Soumis BIANCO",
            cls: "bg-purple-50 text-purple-700 border-purple-200",
        },
        classifier: {
            label: "Complété",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        doublon: {
            label: "Doublon",
            cls: "bg-slate-50 text-slate-600 border-slate-200",
        },
        refuse: {
            label: "Refusé",
            cls: "bg-red-50 text-red-600 border-red-200",
        },
    };
    const cfg =
        map[status] || {
            label: status || "Inconnu",
            cls: "bg-gray-50 text-gray-600 border-gray-200",
        };
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}
        >
      {cfg.label}
    </span>
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
        soumis_bianco: 0,
        enquetes_completees: 0,
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
    }, [allReports, currentPage, pageSize, tableFilterStatus]);

    const initializeCategoriesWithZero = () => {
        const initialCategories = defaultCategoryStructure.map((category, index) => ({
            ...category,
            total: 0,
            encours: 0,
            soumis_bianco: 0,
            enquetes_completees: 0,
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
        const en_cours = reports.filter((r) => r.status === "en_cours").length;
        const soumis_bianco = reports.filter((r) => r.status === "finalise").length;
        const enquetes_completees = reports.filter(
            (r) => r.status === "classifier"
        ).length;

        setGlobalStats({ total, en_cours, soumis_bianco, enquetes_completees });

        const updatedCategories = defaultCategoryStructure.map(
            (category, index) => {
                const catReports = reports.filter((r) => r.category === category.id);
                return {
                    ...category,
                    total: catReports.length,
                    encours: catReports.filter((r) => r.status === "en_cours").length,
                    soumis_bianco: catReports.filter((r) => r.status === "finalise")
                        .length,
                    enquetes_completees: catReports.filter(
                        (r) => r.status === "classifier"
                    ).length,
                    color: chartColors[index],
                };
            }
        );
        setCategories(updatedCategories);
    };

    const updateTableData = () => {
        let filtered = [...allReports];

        if (tableFilterStatus !== "all") {
            filtered = filtered.filter((r) => r.status === tableFilterStatus);
        }

        filtered.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setFilteredTotalCount(filtered.length);

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const slice = filtered.slice(startIndex, endIndex);

        const mapped = slice.map((report) => ({
            id: report.reference || `REF-${report.id}`,
            date: report.created_at
                ? new Date(report.created_at).toLocaleDateString("fr-FR")
                : "-",
            name:
                report.type === "anonyme"
                    ? "Anonyme"
                    : report.name || "Non spécifié",
            category: getCategoryLabel(report.category),
            regionprovince: report.region || "-",
            state: getStatusText(report.status),
            rawStatus: report.status,
        }));

        setPaginatedReports(mapped);
    };

    const handleKPIClick = (status) => {
        const newStatus = tableFilterStatus === status ? "all" : status;
        setTableFilterStatus(newStatus);
        setCurrentPage(1);
    };

    const generateTimeBasedData = () => {
        let labels = [];
        let datasets = [];
        const now = new Date();
        const monthsShort = [
            "Jan",
            "Fév",
            "Mar",
            "Avr",
            "Mai",
            "Juin",
            "Juil",
            "Août",
            "Sep",
            "Oct",
            "Nov",
            "Déc",
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
                    label: category.name,
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
            labels = months.map(
                (m) =>
                    `${monthsShort[m.getMonth()]} ${m
                        .getFullYear()
                        .toString()
                        .slice(2)}`
            );
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
            "Jan",
            "Fév",
            "Mar",
            "Avr",
            "Mai",
            "Juin",
            "Juil",
            "Août",
            "Sep",
            "Oct",
            "Nov",
            "Déc",
        ];

        const labels = months.map((m) => monthsShort[m.getMonth()]);

        const datasets = categories.map((cat) => {
            return {
                label: cat.name,
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
                        labels: { usePointStyle: true, boxWidth: 8 },
                    },
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
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
                            padding: 20,
                        }
                    },
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Nombre de signalements'
                        }
                    }
                },
                // Pour afficher les barres côte à côte au lieu de les empiler
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
        const ctx = pieChartRef.current.getContext("2d");

        pieChartInstance.current = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: validCats.map((c) => c.name),
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
                    legend: { position: "right", labels: { boxWidth: 12 } },
                },
            },
        });
    };

    const getCategoryLabel = (id) =>
        defaultCategoryStructure.find((c) => c.id === id)?.name || id;

    const getStatusText = (status) => {
        const map = {
            en_cours: "En cours",
            finalise: "Soumis BIANCO",
            classifier: "Complété",
            doublon: "Doublon",
            refuse: "Refusé",
        };
        return map[status] || status;
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
        <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-64">
            <div className="space-y-2">
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
                    onClick={() => {
                        setTimeFilter("day");
                        setShowDatePicker(false);
                    }}
                >
                    Jour
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
                    onClick={() => {
                        setTimeFilter("week");
                        setShowDatePicker(false);
                    }}
                >
                    Semaine
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
                    onClick={() => {
                        setTimeFilter("month");
                        setShowDatePicker(false);
                    }}
                >
                    Mois
                </button>
                <button
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                    <h3 className="text-red-600 font-bold">Erreur</h3>
                    <p className="text-slate-600 mt-2">{error}</p>
                    <button
                        type="button"
                        onClick={fetchDashboardData}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const totalPages =
        filteredTotalCount === 0 ? 1 : Math.ceil(filteredTotalCount / pageSize);

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Tableau de bord
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Vue d&apos;ensemble synchronisée en temps réel
                        </p>
                    </div>
                    <div className="relative">
                        <button
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white"
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <svg
                                className="w-5 h-5 text-gray-500"
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
                            <span>
                                Période:{" "}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Dossiers"
                        value={globalStats.total}
                        subtitle="Tous les signalements"
                        icon="📊"
                        color="bg-blue-500"
                        isActive={tableFilterStatus === "all"}
                        onClick={() => handleKPIClick("all")}
                    />
                    <KPICard
                        title="Dossiers Actifs"
                        value={globalStats.en_cours}
                        subtitle="En cours de traitement"
                        icon="⏳"
                        color="bg-amber-500"
                        isActive={tableFilterStatus === "en_cours"}
                        onClick={() => handleKPIClick("en_cours")}
                    />
                    <KPICard
                        title="Soumis BIANCO"
                        value={globalStats.soumis_bianco}
                        subtitle="Transmis pour action"
                        icon="⚖️"
                        color="bg-purple-500"
                        isActive={tableFilterStatus === "finalise"}
                        onClick={() => handleKPIClick("finalise")}
                    />
                    <KPICard
                        title="Complétés"
                        value={globalStats.enquetes_completees}
                        subtitle="Classés / Terminés"
                        icon="✅"
                        color="bg-emerald-500"
                        isActive={tableFilterStatus === "classifier"}
                        onClick={() => handleKPIClick("classifier")}
                    />
                </div>

                {/* Catégories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <CategoryCard key={category.id} category={category} />
                    ))}
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Évolution temporelle</h3>
                        </div>
                        <div className="h-72 w-full">
                            <canvas ref={chartRef} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">
                            Répartition par type
                        </h3>
                        <div className="h-72 w-full flex items-center justify-center">
                            <canvas ref={pieChartRef} />
                        </div>
                    </div>
                </div>

                {/* Graphique en barres - Chaque catégorie séparée */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">
                        Détails mensuels par catégorie (non empilé)
                    </h3>
                    <div className="h-72 w-full">
                        <canvas ref={barChartRef} />
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Chaque catégorie est représentée par des barres individuelles côte à côte pour chaque mois
                    </p>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Header table */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-slate-800">
                                Liste des dossiers
                            </h3>
                            {tableFilterStatus !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                    Filtre actif : {getStatusText(tableFilterStatus)}
                                    <button
                                        type="button"
                                        onClick={() => handleKPIClick("all")}
                                        className="ml-1 p-0.5 hover:bg-blue-100 rounded-full"
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

                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-slate-500">Lignes par page :</span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="form-select text-sm border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 py-1.5 px-3 bg-slate-50"
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
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Référence
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Nom
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Catégorie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Région
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Statut
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                            {paginatedReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <span className="text-4xl mb-2">🔍</span>
                                            <p className="text-sm">
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-600 group-hover:text-blue-700">
                                            {report.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {report.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {report.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {report.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {report.regionprovince}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={report.rawStatus} />
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer pagination */}
                    <div className="bg-white px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Affichage de{" "}
                                    <span className="font-bold text-slate-800">
                                        {filteredTotalCount === 0
                                            ? 0
                                            : (currentPage - 1) * pageSize + 1}
                                    </span>{" "}
                                    à{" "}
                                    <span className="font-bold text-slate-800">
                                        {Math.min(currentPage * pageSize, filteredTotalCount)}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-bold text-slate-800">
                                        {filteredTotalCount}
                                    </span>{" "}
                                    résultats
                                </p>
                            </div>
                            <div>
                                <nav
                                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                                    aria-label="Pagination"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Précédent</span>
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 19l-7-7 7-7"
                                            />
                                        </svg>
                                    </button>

                                    <span className="relative inline-flex items-center px-4 py-2 border border-slate-300 bg-white text-sm font-medium text-slate-700">
                                        Page {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                        disabled={
                                            currentPage === totalPages || totalPages === 0
                                        }
                                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="sr-only">Suivant</span>
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}