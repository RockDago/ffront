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

      // OPTION 1: Essayer d'abord l'endpoint assigné
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

      // OPTION 2: Récupérer tous les rapports
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
      (m) => monthsShort[m.getMonth()] + ` ${m.getFullYear()}`
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
      (m) => `${monthsShort[m.getMonth()]} ${m.getFullYear()}`
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
                  `${context.dataset.label}: ${context.parsed.y} signalement(s)`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { size: 12 },
                stepSize: 1,
              },
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
                font: { size: 12 },
                padding: 10,
              },
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
                  const val = context.parsed?.y ?? context.raw;
                  return `${context.dataset.label}: ${val} signalement(s)`;
                },
                footer: (items) => {
                  const total = items.reduce(
                    (s, it) => s + (it.parsed?.y || it.raw || 0),
                    0
                  );
                  return `Total mois: ${total}`;
                },
              },
            },
          },
          interaction: {
            mode: "index",
            intersect: false,
          },
          scales: {
            x: {
              stacked: false,
              title: {
                display: true,
                text: "Mois",
              },
            },
            y: {
              stacked: false,
              beginAtZero: true,
              title: {
                display: true,
                text: "Nombre de signalements",
              },
              ticks: {
                stepSize: 1,
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
                font: { size: 11 },
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Tableau de Bord Investigateur
        </h1>
        <p className="text-sm text-gray-600">
          Vue d'ensemble de vos enquêtes en cours
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Dossiers assignés</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsData.dossiersAssignes}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-blue-600"
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

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Soumis à la BIANCO</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsData.soumisBianco}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-green-600"
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

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Enquêtes complétées</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsData.enquetesCompletees}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-purple-600"
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

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total dossiers</p>
              <p className="text-3xl font-bold text-gray-900">
                {statsData.totalDossiers}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Graphique linéaire */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Évolution temporelle
            </h2>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {timeFilter === "year" ? "Année" : timeFilter}
            </button>
          </div>
          <div className="h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Graphique circulaire */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Répartition par catégorie
          </h2>
          <div className="h-64">
            {categoriesData.some((cat) => cat.total > 0) ? (
              <canvas ref={pieChartRef}></canvas>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Graphique en barres */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Analyse mensuelle détaillée
        </h2>
        <div className="h-80">
          <canvas ref={barChartRef}></canvas>
        </div>
      </div>

      {/* Tableau des dossiers récents */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Dossiers assignés récemment
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Demandeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dossiersRecents.length > 0 ? (
                dossiersRecents.map((dossier, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {dossier.reference}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dossier.categorie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dossier.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dossier.demandeur}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          dossier.statut === "En cours"
                            ? "bg-yellow-100 text-yellow-800"
                            : dossier.statut === "Soumis BIANCO"
                            ? "bg-blue-100 text-blue-800"
                            : dossier.statut === "Complété"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {dossier.statut}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    Aucun dossier assigné pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardInvestView;
