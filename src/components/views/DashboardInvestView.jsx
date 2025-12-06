// DashboardInvestView.jsx
import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import API from "../../config/axios";

// Palette de couleurs pour les graphiques
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
];

// Composants UI (inspirés de DashboardView)
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

const StatusBadge = ({ status }) => {
    const map = {
        En_cours: {
            label: "En cours",
            cls: "bg-blue-50 text-blue-700 border-blue-200",
        },
        Soumis_BIANCO: {
            label: "Soumis BIANCO",
            cls: "bg-purple-50 text-purple-700 border-purple-200",
        },
        Complété: {
            label: "Complété",
            cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        Doublon: {
            label: "Doublon",
            cls: "bg-slate-50 text-slate-600 border-slate-200",
        },
        Refusé: {
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

const DashboardInvestView = ({ data }) => {
    const chartRef = useRef(null);
    const barChartRef = useRef(null);
    const pieChartRef = useRef(null);
    const chartInstance = useRef(null);
    const barChartInstance = useRef(null);
    const pieChartInstance = useRef(null);

    const [timeFilter, setTimeFilter] = useState("year");
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // États pour les données réelles
    const [statsData, setStatsData] = useState({
        dossiersAssignes: 0,
        soumisBianco: 0,
        enquetesCompletees: 0,
        totalDossiers: 0,
    });

    const [categoriesData, setCategoriesData] = useState([]);
    const [dossiersRecents, setDossiersRecents] = useState([]);
    const [allReports, setAllReports] = useState([]);

    // Charger les données réelles depuis l'API
    useEffect(() => {
        fetchAssignedReports();
    }, []);

    const fetchAssignedReports = async () => {
        setIsLoading(true);
        try {
            console.log("🔄 Tentative de récupération des données réelles...");

            try {
                const response = await API.get("/reports/assigned");
                console.log("✅ Données réelles chargées:", response.data);

                if (response.data.success) {
                    processApiResponse(response.data);
                    return;
                }
            } catch (assignError) {
                console.log(
                    "❌ Endpoint /assigned non disponible, tentative avec /reports"
                );
            }


            try {
                const response = await API.get("/reports");
                console.log("✅ Tous les rapports chargés:", response.data);

                if (response.data.success) {
                    const allReports = response.data.data || [];

                    // Utiliser tous les rapports disponibles
                    const assignedReports = allReports;

                    // Calculer les statistiques depuis les données réelles
                    const stats = {
                        dossiersAssignes: assignedReports.length,
                        soumisBianco: assignedReports.filter((r) => r.status === "finalise")
                            .length,
                        enquetesCompletees: assignedReports.filter(
                            (r) => r.status === "classifier"
                        ).length,
                        totalDossiers: assignedReports.length,
                        byCategory: {},
                    };

                    // Calculer les catégories depuis les données réelles
                    assignedReports.forEach((report) => {
                        const categoryName = getCategoryName(report.category);
                        stats.byCategory[categoryName] =
                            (stats.byCategory[categoryName] || 0) + 1;
                    });

                    processApiResponse({
                        success: true,
                        data: assignedReports,
                        stats: stats,
                    });
                    return;
                }
            } catch (reportsError) {
                console.error("❌ Erreur avec l'endpoint /reports:", reportsError);
            }

            // Si les deux endpoints échouent
            throw new Error("Impossible de charger les données depuis l'API");
        } catch (error) {
            console.error("❌ Erreur finale:", error);
            // En cas d'erreur, initialiser avec des données vides
            setAllReports([]);
            setDossiersRecents([]);
            setCategoriesData(getDefaultCategories());
            setStatsData({
                dossiersAssignes: 0,
                soumisBianco: 0,
                enquetesCompletees: 0,
                totalDossiers: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour traiter la réponse API
    const processApiResponse = (apiData) => {
        if (apiData.success) {
            const reports = apiData.data || [];
            const stats = apiData.stats || {};

            setAllReports(reports);
            setStatsData({
                dossiersAssignes: stats.dossiersAssignes || reports.length,
                soumisBianco: stats.soumisBianco || 0,
                enquetesCompletees: stats.enquetesCompletees || 0,
                totalDossiers: stats.totalDossiers || reports.length,
            });

            // Formater les dossiers récents
            const formattedReports = reports.slice(0, 6).map((report) => ({
                reference: report.reference || `REF-${report.id}`,
                categorie:
                    getCategoryIcon(report.category) +
                    " " +
                    getCategoryName(report.category),
                date: new Date(report.created_at || report.date).toLocaleDateString(
                    "fr-FR"
                ),
                demandeur: report.name || report.demandeur || "Anonyme",
                statut: getStatusLabel(report.status),
                rawStatus: report.status,
            }));

            setDossiersRecents(formattedReports);
            updateCategoriesData(stats, reports);
        }
    };

    // Fonction pour les catégories par défaut
    const getDefaultCategories = () => {
        return [
            { id: "faux-diplomes", name: "Faux Diplômes", total: 0, icon: "📜" },
            {
                id: "offre-formation-irreguliere",
                name: "Offre de formation irrégulière (non habilité)",
                total: 0,
                icon: "🎓",
            },
            {
                id: "recrutements-irreguliers",
                name: "Recrutements Irréguliers",
                total: 0,
                icon: "💼",
            },
            { id: "harcelement", name: "Harcèlement", total: 0, icon: "⚠️" },
            { id: "corruption", name: "Corruption", total: 0, icon: "🔴" },
            { id: "divers", name: "Divers", total: 0, icon: "🏷️" },
        ];
    };

    // Fonction pour mettre à jour les catégories
    const updateCategoriesData = (stats, reports) => {
        const defaultCategories = getDefaultCategories();

        // Utiliser les stats de l'API ou calculer depuis les rapports
        if (stats.byCategory) {
            defaultCategories.forEach((cat) => {
                const realCount =
                    stats.byCategory[cat.name] || stats.byCategory[cat.id] || 0;
                cat.total = realCount;
            });
        } else {
            // Calculer depuis les rapports réels
            defaultCategories.forEach((cat) => {
                const count = reports.filter(
                    (report) => getCategoryName(report.category) === cat.name
                ).length;
                cat.total = count;
            });
        }

        setCategoriesData(defaultCategories);
    };

    const getCategoryIcon = (category) => {
        const icons = {
            "faux-diplomes": "📜",
            "Faux Diplômes": "📜",
            "Offre de formation irrégulière ( non habilité)": "🎓",
            "offre-formation-irreguliere": "🎓",
            "recrutements-irreguliers": "💼",
            "Recrutements Irréguliers": "💼",
            harcelement: "⚠️",
            Harcèlement: "⚠️",
            corruption: "🔴",
            Corruption: "🔴",
            divers: "🏷️",
            Divers: "🏷️",
        };
        return icons[category] || "📋";
    };

    const getCategoryName = (category) => {
        const names = {
            "faux-diplomes": "Faux Diplômes",
            "offre-formation-irreguliere":
                "Offre de formation irrégulière (non habilité)",
            "Offre de formation irrégulière ( non habilité)":
                "Offre de formation irrégulière (non habilité)",
            "recrutements-irreguliers": "Recrutements Irréguliers",
            harcelement: "Harcèlement",
            corruption: "Corruption",
            divers: "Divers",
        };
        return names[category] || category;
    };

    const getStatusLabel = (status) => {
        const labels = {
            en_cours: "En cours",
            finalise: "Soumis BIANCO",
            classifier: "Complété",
            doublon: "Doublon",
            refuse: "Refusé",
        };
        return labels[status] || status;
    };

    // Calculer les données par mois à partir des vrais rapports
    const calculateMonthlyData = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setMonth(start.getMonth() - 11);

        const months = Array.from({ length: 12 }, (_, i) => {
            return new Date(start.getFullYear(), start.getMonth() + i, 1);
        });

        // Initialiser les compteurs par catégorie et par mois
        const dataByCategory = {};
        categoriesData.forEach((cat) => {
            dataByCategory[cat.name] = new Array(12).fill(0);
        });

        // Compter les rapports réels par mois et par catégorie
        allReports.forEach((report) => {
            const reportDate = new Date(report.created_at);
            const monthIndex = months.findIndex((month) => {
                return (
                    reportDate.getFullYear() === month.getFullYear() &&
                    reportDate.getMonth() === month.getMonth()
                );
            });

            if (monthIndex !== -1) {
                const categoryName = getCategoryName(report.category);
                if (dataByCategory[categoryName]) {
                    dataByCategory[categoryName][monthIndex]++;
                }
            }
        });

        return { months, dataByCategory };
    };

    // Générer des données temporelles basées sur les VRAIES données
    const generateTimeBasedData = () => {
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

        const { months, dataByCategory } = calculateMonthlyData();

        const labels = months.map(
            (m) => `${monthsShort[m.getMonth()]} ${m.getFullYear().toString().slice(2)}`
        );

        const datasets = categoriesData.map((category, index) => {
            return {
                label: category.name,
                data: dataByCategory[category.name] || new Array(12).fill(0),
                borderColor: chartColors[index % chartColors.length].border,
                backgroundColor: chartColors[index % chartColors.length].background,
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
            };
        });

        return { labels, datasets };
    };

    // Données RÉELLES pour le diagramme en barres par mois
    const getReportsByMonthAndCategory = () => {
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

        const { months, dataByCategory } = calculateMonthlyData();

        const labels = months.map(
            (m) => monthsShort[m.getMonth()]
        );

        const datasets = categoriesData.map((category, index) => {
            return {
                label: category.name,
                data: dataByCategory[category.name] || new Array(12).fill(0),
                backgroundColor: chartColors[index % chartColors.length].background,
                borderColor: chartColors[index % chartColors.length].border,
                borderWidth: 1,
            };
        });

        return { labels, datasets };
    };

    // Initialiser les graphiques
    useEffect(() => {
        if (!isLoading && categoriesData.length > 0 && allReports.length >= 0) {
            initializeChart();
            initializeBarChart();
            initializePieChart();
        }

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
            if (barChartInstance.current) barChartInstance.current.destroy();
            if (pieChartInstance.current) pieChartInstance.current.destroy();
        };
    }, [timeFilter, categoriesData, isLoading, allReports]);

    const initializeChart = () => {
        if (!chartRef.current) return;

        const { labels, datasets } = generateTimeBasedData();

        if (chartInstance.current) chartInstance.current.destroy();

        try {
            const ctx = chartRef.current.getContext("2d");
            chartInstance.current = new Chart(ctx, {
                type: "line",
                data: { labels, datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: "index",
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: "bottom",
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                                padding: 12,
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { borderDash: [2, 4] },
                            ticks: {
                                font: { size: 12 },
                                stepSize: 1,
                            },
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Erreur lors de l'initialisation du graphique:", error);
        }
    };

    const initializeBarChart = () => {
        if (!barChartRef.current) return;

        const { labels, datasets } = getReportsByMonthAndCategory();

        if (barChartInstance.current) barChartInstance.current.destroy();

        try {
            const ctx = barChartRef.current.getContext("2d");
            barChartInstance.current = new Chart(ctx, {
                type: "bar",
                data: { labels: labels, datasets: datasets },
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
                            },
                        },
                    },
                    scales: {
                        x: {
                            stacked: false,
                            grid: { display: false }
                        },
                        y: {
                            stacked: false,
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
                        },
                    },
                    datasets: {
                        bar: {
                            categoryPercentage: 0.8,
                            barPercentage: 0.9,
                        }
                    }
                },
            });
        } catch (error) {
            console.error(
                "Erreur lors de l'initialisation du diagramme en barres:",
                error
            );
        }
    };

    const initializePieChart = () => {
        if (!pieChartRef.current) return;

        const categoryData = categoriesData.map((cat) => cat.total);
        const total = categoryData.reduce((sum, value) => sum + value, 0);

        // Only show categories that have data
        const validCategories = categoriesData.filter(
            (cat, index) => categoryData[index] > 0
        );
        const validData = categoryData.filter((value) => value > 0);

        if (pieChartInstance.current) pieChartInstance.current.destroy();

        // Si pas de données, ne pas créer le graphique
        if (validData.length === 0 || total === 0) {
            return;
        }

        try {
            const ctx = pieChartRef.current.getContext("2d");
            pieChartInstance.current = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: validCategories.map((cat) => cat.name),
                    datasets: [
                        {
                            data: validData,
                            backgroundColor: pieColors.slice(0, validCategories.length),
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
                                boxWidth: 12
                            }
                        },
                    },
                },
            });
        } catch (error) {
            console.error(
                "Erreur lors de l'initialisation du diagramme circulaire:",
                error
            );
        }
    };

    const getTimeFilterTitle = () => {
        switch (timeFilter) {
            case "day":
                return "Heures (24h)";
            case "week":
                return "Jours de la semaine";
            case "month":
                return "Semaines du mois";
            case "year":
                return "Mois de l'année";
            default:
                return "Mois 2025";
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Tableau de Bord Investigateur
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Vue d'ensemble de vos enquêtes en cours
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
                        title="Dossiers Assignés"
                        value={statsData.dossiersAssignes}
                        subtitle="Affectés à votre compte"
                        icon="📊"
                        color="bg-blue-500"
                        onClick={() => {}}
                    />
                    <KPICard
                        title="Soumis BIANCO"
                        value={statsData.soumisBianco}
                        subtitle="Transmis pour action"
                        icon="⚖️"
                        color="bg-purple-500"
                        onClick={() => {}}
                    />
                    <KPICard
                        title="Enquêtes Complétées"
                        value={statsData.enquetesCompletees}
                        subtitle="Classés / Terminés"
                        icon="✅"
                        color="bg-emerald-500"
                        onClick={() => {}}
                    />
                    <KPICard
                        title="Total Dossiers"
                        value={statsData.totalDossiers}
                        subtitle="Tous les signalements"
                        icon="📁"
                        color="bg-slate-500"
                        onClick={() => {}}
                    />
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Graphique linéaire */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Évolution temporelle</h3>
                        </div>
                        <div className="h-72 w-full">
                            <canvas ref={chartRef} />
                        </div>
                    </div>

                    {/* Graphique circulaire */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-4">
                            Répartition par catégorie
                        </h3>
                        <div className="h-72 w-full flex items-center justify-center">
                            {categoriesData.some((cat) => cat.total > 0) ? (
                                <canvas ref={pieChartRef} />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                    <span className="text-4xl mb-2">📊</span>
                                    <p className="text-sm">Aucune donnée disponible</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Graphique en barres */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-4">
                        Analyse mensuelle détaillée
                    </h3>
                    <div className="h-72 w-full">
                        <canvas ref={barChartRef} />
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        Chaque catégorie est représentée par des barres individuelles côte à côte pour chaque mois
                    </p>
                </div>

                {/* Tableau des dossiers récents */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Header table */}
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-lg text-slate-800">
                                Dossiers assignés récemment
                            </h3>
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
                                    Catégorie
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Demandeur
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Statut
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                            {dossiersRecents.length > 0 ? (
                                dossiersRecents.map((dossier, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-600 group-hover:text-blue-700">
                                            {dossier.reference}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {dossier.categorie}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {dossier.date}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {dossier.demandeur}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={dossier.statut} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <span className="text-4xl mb-2">🔍</span>
                                            <p className="text-sm">
                                                Aucun dossier assigné pour le moment.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardInvestView;