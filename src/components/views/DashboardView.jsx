import React, { useEffect, useRef, useState } from "react";
import API from "../../config/axios";
import Chart from "chart.js/auto";
import { useNavigate } from "react-router-dom";

// Palette plus sobre et limitée pour une IHM plus lisible
const chartColors = [
  { border: "#2B6CB0", background: "rgba(43,108,176,0.08)" }, // bleu doux
  { border: "#6B7280", background: "rgba(107,114,128,0.08)" }, // gris moyen
  { border: "#16A34A", background: "rgba(22,163,74,0.08)" }, // vert doux
  { border: "#D97706", background: "rgba(217,119,6,0.06)" }, // orange discret
  { border: "#44403C", background: "rgba(68,64,60,0.06)" }, // brun/gris
  { border: "#475569", background: "rgba(71,85,105,0.06)" }, // indigo doux
];

// Couleurs pour le diagramme circulaire
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

// Définition des catégories fixes
const defaultCategoryStructure = [
  {
    id: "faux-diplomes",
    name: "Faux diplômes",
    subtitle: "Délivrance illégale de diplômes",
    icon: "📜",
  },
  {
    id: "offre-formation-irreguliere",
    name: "Offre de formation irrégulière (non habilité)",
    subtitle: "Établissements non habilités",
    icon: "🎓",
  },
  {
    id: "recrutements-irreguliers",
    name: "Recrutements irréguliers",
    subtitle: "Transparence et intégrité",
    icon: "👥",
  },
  {
    id: "harcelement",
    name: "Harcèlement",
    subtitle: "Signalements de harcèlement",
    icon: "⚠️",
  },
  {
    id: "corruption",
    name: "Corruption",
    subtitle: "Signalements de corruption et malversations",
    icon: "🔴",
  },
  {
    id: "divers",
    name: "Divers",
    subtitle: "Autres signalements et irrégularités",
    icon: "🏷️",
  },
];

export default function DashboardView() {
  const chartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const chartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const pieChartInstance = useRef(null);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("year");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [allReports, setAllReports] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    en_cours: 0,
    soumis_bianco: 0,
    enquetes_completees: 0,
  });
  const [monthTotal, setMonthTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [error, setError] = useState("");

  useEffect(() => {
    initializeCategoriesWithZero();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && allReports.length > 0) {
      initializeChart();
      initializeBarChart();
      initializePieChart();
      calculateMonthTotal();
    }
  }, [timeFilter, categories, allReports]);

  const initializeCategoriesWithZero = () => {
    const initialCategories = defaultCategoryStructure.map(
      (category, index) => ({
        ...category,
        total: 0,
        encours: 0,
        soumis_bianco: 0,
        enquetes_completees: 0,
        color: chartColors[index],
      })
    );
    setCategories(initialCategories);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/reports?per_page=1000");

      // Validation robuste de la réponse
      if (!response.data) {
        throw new Error("Aucune donnée reçue du serveur");
      }

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Erreur de chargement des données"
        );
      }

      const allReportsData = Array.isArray(response.data.data)
        ? response.data.data
        : [];
      setAllReports(allReportsData);

      if (allReportsData.length > 0) {
        calculateStatsFromReports(allReportsData);
        updateRecentReportsWithRealData(allReportsData);
        calculateMonthTotal();
      } else {
        setCategories(
          defaultCategoryStructure.map((cat) => ({
            ...cat,
            total: 0,
            encours: 0,
            soumis_bianco: 0,
            enquetes_completees: 0,
          }))
        );
        setRecentReports([]);
        setGlobalStats({
          total: 0,
          en_cours: 0,
          soumis_bianco: 0,
          enquetes_completees: 0,
        });
        setMonthTotal(0);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);

      let errorMessage = "Erreur lors du chargement des données";
      if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.response?.status === 403) {
        errorMessage = "Accès non autorisé";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Problème de connexion. Vérifiez votre réseau.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthTotal = () => {
    if (!allReports || allReports.length === 0) {
      setMonthTotal(0);
      return;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthReports = allReports.filter((report) => {
      if (!report.created_at) return false;
      const reportDate = new Date(report.created_at);
      return reportDate >= startOfMonth;
    });

    setMonthTotal(monthReports.length);
  };

  const calculateStatsFromReports = (reports) => {
    if (!reports || !Array.isArray(reports)) return;

    const total = reports.length;
    const en_cours = reports.filter((r) => r.status === "en_cours").length;
    const soumis_bianco = reports.filter((r) => r.status === "finalise").length;
    const enquetes_completees = reports.filter(
      (r) => r.status === "classifier"
    ).length;

    const by_category = {};
    defaultCategoryStructure.forEach((cat) => {
      const categoryReports = reports.filter((r) => r.category === cat.id);
      by_category[cat.id] = categoryReports.length;
    });

    const statsData = {
      total,
      en_cours,
      soumis_bianco,
      enquetes_completees,
      by_category,
    };
    updateGlobalStats(statsData);
    updateCategoriesWithRealData(statsData, reports);
  };

  const updateGlobalStats = (statsData) => {
    setGlobalStats({
      total: statsData.total || 0,
      en_cours: statsData.en_cours || 0,
      soumis_bianco: statsData.soumis_bianco || 0,
      enquetes_completees: statsData.enquetes_completees || 0,
    });
  };

  const updateCategoriesWithRealData = (statsData, reports) => {
    const updatedCategories = defaultCategoryStructure.map((category) => {
      const realTotal = statsData.by_category?.[category.id] || 0;

      // Calcul réel des en cours et résolus par catégorie
      const categoryReports = reports.filter(
        (report) => report.category === category.id
      );
      const encours = categoryReports.filter(
        (report) => report.status === "en_cours"
      ).length;
      const soumis_bianco = categoryReports.filter(
        (report) => report.status === "finalise"
      ).length;
      const enquetes_completees = categoryReports.filter(
        (report) => report.status === "classifier"
      ).length;

      return {
        ...category,
        total: realTotal,
        encours,
        soumis_bianco,
        enquetes_completees,
      };
    });
    setCategories(updatedCategories);
  };

  const updateRecentReportsWithRealData = (reportsArray) => {
    if (
      !reportsArray ||
      !Array.isArray(reportsArray) ||
      reportsArray.length === 0
    ) {
      setRecentReports([]);
      return;
    }

    const sortedReports = [...reportsArray].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const updatedReports = sortedReports.slice(0, pageSize).map((report) => {
      return {
        id: report.reference || `REF-${report.id}`,
        date: report.created_at
          ? new Date(report.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        name:
          report.type === "anonyme" ? "Anonyme" : report.name || "Non spécifié",
        category: getCategoryLabel(report.category),
        regionprovince: report.region || "Localisation non disponible",
        state: getStatusText(report.status),
        originalCategory: report.category,
      };
    });

    setRecentReports(updatedReports);
  };

  useEffect(() => {
    if (allReports.length > 0) {
      updateRecentReportsWithRealData(allReports);
    }
  }, [pageSize, allReports]);

  const getCategoryLabel = (categoryId) => {
    const categoryMap = {
      "faux-diplomes": "Faux diplômes",
      "offre-formation-irreguliere":
        "Offre de formation irrégulière (non habilité)",
      "recrutements-irreguliers": "Recrutements irréguliers",
      harcelement: "Harcèlement",
      corruption: "Corruption",
      divers: "Divers",
    };
    return categoryMap[categoryId] || categoryId;
  };

  const getStatusText = (status) => {
    const statusMap = {
      en_cours: "En cours",
      finalise: "Soumis BIANCO",
      classifier: "Complété",
      doublon: "Doublon",
      refuse: "Refusé",
    };
    return statusMap[status] || "En cours";
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
      return categories.map((category, index) => {
        const data = labelArray.map((_, li) => {
          const check = rangeChecks[li];
          const count = allReports.filter((report) => {
            if (!report.created_at) return false;
            const d = new Date(report.created_at);
            return check(d) && report.category === category.id;
          }).length;
          return count;
        });

        return {
          label: category.name,
          data,
          borderColor: chartColors[index].border,
          backgroundColor: chartColors[index].background,
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        };
      });
    };

    if (timeFilter === "day") {
      // last 24 hours chronological
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - 23);
      const hours = Array.from({ length: 24 }, (_, i) => {
        const h = new Date(start.getTime() + i * 3600 * 1000);
        return h;
      });

      labels = hours.map((h) => `${h.getHours()}h`);
      const rangeChecks = hours.map((h) => (d) => {
        return (
          d.getFullYear() === h.getFullYear() &&
          d.getMonth() === h.getMonth() &&
          d.getDate() === h.getDate() &&
          d.getHours() === h.getHours()
        );
      });

      datasets = makeDatasets(labels, rangeChecks);
    } else if (timeFilter === "week") {
      // last 7 days chronological (6 days ago -> today)
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 6);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start.getTime() + i * 24 * 3600 * 1000);
        return d;
      });

      const frDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      labels = days.map(
        (d) => `${frDays[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
      );

      const rangeChecks = days.map((dayStart) => (d) => {
        return (
          d.getFullYear() === dayStart.getFullYear() &&
          d.getMonth() === dayStart.getMonth() &&
          d.getDate() === dayStart.getDate()
        );
      });

      datasets = makeDatasets(labels, rangeChecks);
    } else if (timeFilter === "month") {
      // last 4 weeks chronological (approx. 28 days)
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - 27);
      const weeks = Array.from({ length: 4 }, (_, i) => {
        const wStart = new Date(start.getTime() + i * 7 * 24 * 3600 * 1000);
        return wStart;
      });

      labels = weeks.map(
        (w, idx) => `Sem ${idx + 1} (${w.getDate()}/${w.getMonth() + 1})`
      );

      const rangeChecks = weeks.map((wStart) => (d) => {
        const wEnd = new Date(wStart.getTime() + 7 * 24 * 3600 * 1000);
        return d >= wStart && d < wEnd;
      });

      datasets = makeDatasets(labels, rangeChecks);
    } else {
      // year or default: last 12 months chronological
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setMonth(start.getMonth() - 11);
      const months = Array.from({ length: 12 }, (_, i) => {
        const m = new Date(start.getFullYear(), start.getMonth() + i, 1);
        return m;
      });

      labels = months.map(
        (m) => monthsShort[m.getMonth()] + ` ${m.getFullYear()}`
      );

      const rangeChecks = months.map((m) => (d) => {
        return (
          d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth()
        );
      });

      datasets = makeDatasets(labels, rangeChecks);
    }

    return { labels, datasets };
  };

  const getReportsByMonthAndCategory = () => {
    // Build last 12 months chronological (oldest -> newest)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setMonth(start.getMonth() - 11);
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

    const labels = months.map(
      (m) => `${monthsShort[m.getMonth()]} ${m.getFullYear()}`
    );

    const datasets = categories.map((category, index) => {
      const data = months.map((m) => {
        const monthReports = allReports.filter((report) => {
          if (!report.created_at) return false;
          const reportDate = new Date(report.created_at);
          return (
            reportDate.getMonth() === m.getMonth() &&
            reportDate.getFullYear() === m.getFullYear() &&
            report.category === category.id
          );
        });
        return monthReports.length;
      });

      // Use the predefined background rgba if available, otherwise derive from border
      const bg =
        category.color?.background ||
        chartColors[index]?.background ||
        chartColors[index]?.border + "33";

      return {
        label: category.name,
        data: data,
        backgroundColor: bg,
        borderColor: chartColors[index].border,
        borderWidth: 1,
      };
    });

    return { labels, datasets };
  };

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
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                usePointStyle: true,
                padding: 12,
                font: { size: 12 },
                color: "#455160",
              },
            },
            tooltip: {
              backgroundColor: "#fff",
              titleColor: "#383e45",
              bodyColor: "#22282c",
              borderColor: "#ddd",
              borderWidth: 1,
              padding: 12,
              displayColors: true,
              titleFont: { size: 12 },
              bodyFont: { size: 12 },
              callbacks: {
                label: (context) =>
                  `${context.dataset.label}: ${context.parsed.y} signalements`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { size: 12 } },
              grid: { color: "rgba(120,130,140,0.06)" },
              title: {
                display: true,
                text: "Nombre de signalements",
                font: { size: 13, weight: "500" },
              },
            },
            x: {
              ticks: { font: { size: 12 } },
              grid: { display: false },
              title: {
                display: true,
                text: getTimeFilterTitle(),
                font: { size: 13, weight: "500" },
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
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: { usePointStyle: true, font: { size: 12 }, padding: 10 },
            },
            title: {
              display: true,
              text: `Répartition des signalements par type - 12 derniers mois`,
            },
            tooltip: {
              mode: "index",
              intersect: false,
              titleFont: { size: 12 },
              bodyFont: { size: 12 },
              callbacks: {
                label: (context) => {
                  const val =
                    context.parsed && context.parsed.y != null
                      ? context.parsed.y
                      : context.raw;
                  return `${context.dataset.label}: ${String(
                    val
                  )} signalement(s)`;
                },
                footer: (items) => {
                  const total = items.reduce(
                    (s, it) => s + (it.parsed?.y || it.raw || 0),
                    0
                  );
                  return `Total mois: ${String(total)}`;
                },
              },
            },
          },
          interaction: { mode: "index", intersect: false },
          scales: {
            x: {
              stacked: false,
              title: { display: true, text: "Mois" },
            },
            y: {
              stacked: false,
              beginAtZero: true,
              title: { display: true, text: "Nombre de signalements" },
              ticks: {
                callback: (value) => String(value),
                font: { size: 12 },
              },
            },
          },
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

    const categoryData = categories.map((cat) => cat.total);
    const total = categoryData.reduce((sum, value) => sum + value, 0);

    // Only show categories that have data
    const validCategories = categories.filter(
      (cat, index) => categoryData[index] > 0
    );
    const validData = categoryData.filter((value) => value > 0);

    if (pieChartInstance.current) pieChartInstance.current.destroy();

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
              borderColor: "#fff",
              borderWidth: 2,
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
                padding: 10,
                usePointStyle: true,
                font: {
                  size: 11,
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ${value} (${percentage}%)`;
                },
              },
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

  const handleTimeFilterSelect = (filter) => {
    setTimeFilter(filter);
    setShowDatePicker(false);
  };

  const DatePicker = () => (
    <div className="absolute top-12 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-64">
      <div className="space-y-2">
        <button
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
          onClick={() => handleTimeFilterSelect("day")}
        >
          Jour
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
          onClick={() => handleTimeFilterSelect("week")}
        >
          Semaine
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
          onClick={() => handleTimeFilterSelect("month")}
        >
          Mois
        </button>
        <button
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-gray-700 font-medium"
          onClick={() => handleTimeFilterSelect("year")}
        >
          Année
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (pieChartInstance.current) pieChartInstance.current.destroy();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600 mt-2">
            Vue d'ensemble globale de tous les signalements
          </p>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Signalements */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total signalements</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {globalStats.total}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* En Cours */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-orange-600 mt-2">
                  {globalStats.en_cours}
                </p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Soumis à la BIANCO */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Soumis à la BIANCO</p>
                <p className="text-2xl font-bold text-purple-600 mt-2">
                  {globalStats.soumis_bianco}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Enquêtes complétées */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enquêtes complétées</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {globalStats.enquetes_completees}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Catégories - 3x3 avec taille normale et sans redirection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xl font-semibold text-gray-900">
                  {cat.total}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-1">
                {cat.name}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{cat.subtitle}</p>
              <div className="flex justify-between text-sm">
                <span className="text-orange-600">En cours: {cat.encours}</span>
                <span className="text-purple-600">
                  Soumis BIANCO: {cat.soumis_bianco}
                </span>
                <span className="text-green-600">
                  Complétés: {cat.enquetes_completees}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Graphique linéaire avec filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Évolution des signalements
            </h2>
            <div className="flex items-center space-x-3">
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
          </div>
          <div className="h-96">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Graphiques supplémentaires */}
        <div className="space-y-6">
          {/* Diagramme en barres agrandi */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Répartition des signalements par type et par mois -{" "}
              {new Date().getFullYear()}
            </h2>
            <div className="h-96">
              <canvas ref={barChartRef}></canvas>
            </div>
          </div>

          {/* Diagramme circulaire en bas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Répartition par catégories
            </h2>
            <div className="h-80">
              <canvas ref={pieChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Signalements récents */}
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Signalements récents
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Afficher:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom/Prénom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Région/Province
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    État
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {report.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.regionprovince}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          report.state === "En cours"
                            ? "bg-orange-100 text-orange-800"
                            : report.state === "Soumis BIANCO"
                            ? "bg-purple-100 text-purple-800"
                            : report.state === "Complété"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.state}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentReports.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      Aucun signalement récent
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
}
