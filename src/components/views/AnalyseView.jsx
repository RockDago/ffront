import React, { useState, useEffect } from "react";
import API from "../../config/axios";

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

const provinces = ["Toutes les provinces", "Analamanga", "Betsiboka", "Diana"];

const regions = [
  "Toutes les régions",
  "Antananarivo",
  "Mahajanga",
  "Antsiranana",
];

export default function AnalyseView({ selectedCategory }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);
  const [selectedProvince, setSelectedProvince] = useState(provinces[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statut, setStatut] = useState("Tous");
  const [anonymat, setAnonymat] = useState("Tous");
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les données depuis l'API
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.get("/reports");

        // ADAPTATION À LA NOUVELLE STRUCTURE DE VOTRE API
        let reportsData = [];

        if (
          response.data.success &&
          response.data.data &&
          response.data.data.reports
        ) {
          // Structure: {success: true, data: {reports: [...], pagination: {...}}}
          reportsData = response.data.data.reports;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          // Structure alternative: {success: true, data: [...]}
          reportsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Structure: [...] (tableau direct)
          reportsData = response.data;
        } else {
          reportsData = [];
        }

        if (reportsData && reportsData.length > 0) {
          const mappedReports = reportsData.map((report) => {
            // Parser les fichiers
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

            // Construction de l'objet rapport adapté pour AnalyseView
            const mappedReport = {
              id: report.id,
              reference: report.reference,
              date: report.created_at,
              category: report.category,
              status: report.status,
              isAnonymous: report.isAnonymous || report.type === "anonyme",
              name: report.name || "Anonyme",
              email: report.email || "",
              phone: report.phone || "",
              description:
                report.description || report.title || "Aucune description",
              filesCount: filesArray.length,
              files: filesArray,
              region: report.region || "Non spécifié",
              city: report.city || "Non spécifié",
              title: report.title,
              type: report.type,
            };

            return mappedReport;
          });

          setReports(mappedReports);
        } else {
          setReports([]);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Utiliser la catégorie sélectionnée si fournie
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Calcul des statistiques par catégorie basées sur les données réelles
  const calculateCategoryStats = (categoryId) => {
    const categoryReports = reports.filter(
      (report) => report.category === categoryId
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

  const cat = categories.find((c) => c.id === activeCategory);
  const categoryStats = calculateCategoryStats(activeCategory);

  // Fonction pour formater la date
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

  // Fonction pour obtenir le statut affichable
  const getDisplayStatus = (status) => {
    const statusMap = {
      en_cours: "En cours",
      finalise: "Résolu",
      doublon: "Doublon",
      refuse: "Refusé",
    };
    return statusMap[status] || status;
  };

  // Fonction pour obtenir le type d'anonymat affichable
  const getDisplayAnonymat = (isAnonymous) => {
    return isAnonymous ? "Anonyme" : "Non-Anonyme";
  };

  // Filtrage des données basé sur les données réelles
  let filteredData = reports.filter(
    (item) =>
      item.category === activeCategory &&
      (search === "" ||
        item.reference.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.region.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())) &&
      (selectedProvince === provinces[0] ||
        item.region.includes(selectedProvince)) &&
      (selectedRegion === regions[0] || item.region.includes(selectedRegion)) &&
      (statut === "Tous" || getDisplayStatus(item.status) === statut) &&
      (anonymat === "Tous" ||
        getDisplayAnonymat(item.isAnonymous) === anonymat) &&
      (startDate === "" || item.date >= startDate) &&
      (endDate === "" || item.date <= endDate)
  );

  function resetFilters() {
    setSearch("");
    setSelectedRegion(regions[0]);
    setSelectedProvince(provinces[0]);
    setStartDate("");
    setEndDate("");
    setStatut("Tous");
    setAnonymat("Tous");
  }

  // Calcul des statistiques d'anonymat
  const statsAnonymat = {
    Tous: filteredData.length,
    Anonymes: filteredData.filter((i) => i.isAnonymous).length,
    "Non-Anonymes": filteredData.filter((i) => !i.isAnonymous).length,
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-600">Chargement des données...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-semibold mb-2">
            Erreur de chargement
          </div>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Analyse Détaillée par Catégories
        </h1>
        <p className="text-gray-600">
          Visualisation et analyse approfondie des signalements par catégorie
        </p>
      </div>

      {/* Catégorie Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((catg) => {
          const stats = calculateCategoryStats(catg.id);
          return (
            <button
              key={catg.id}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                activeCategory === catg.id
                  ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveCategory(catg.id)}
            >
              <span className="text-xl">{catg.emoji}</span>
              <span>{catg.name}</span>
              <span className="bg-gray-100 rounded-full px-2 py-1 text-xs font-medium">
                {stats.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Synthèse */}
      <div className="mb-8">
        <h2 className="font-semibold text-lg text-gray-900 mb-3">
          Synthèse - {cat?.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="text-3xl font-bold text-gray-900">
              {categoryStats.total}
            </div>
            <div className="text-gray-500 text-sm mt-1">
              Signalements totaux
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="text-3xl font-bold text-amber-600">
              {categoryStats.encours}
            </div>
            <div className="text-gray-500 text-sm mt-1">En cours</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border text-center">
            <div className="text-3xl font-bold text-green-600">
              {categoryStats.resolus}
            </div>
            <div className="text-gray-500 text-sm mt-1">Résolus</div>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-lg text-gray-900">
            Filtres Avancés
          </h3>
          <button
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            onClick={resetFilters}
          >
            <span>🔄</span>
            Réinitialiser
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span>🔍</span> Recherche
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Référence, nom, région, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span>📅</span> Date début
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span>📅</span> Date fin
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span>🗺️</span> Province
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                {provinces.map((prov) => (
                  <option key={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <span>🗺️</span> Région
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {regions.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Statut du dossier
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
              >
                <option value="Tous">Tous les statuts</option>
                <option value="En cours">En cours</option>
                <option value="Résolu">Résolu</option>
                <option value="Doublon">Doublon</option>
                <option value="Refusé">Refusé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs anonymat et export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {["Tous", "Anonymes", "Non-Anonymes"].map((tab) => (
            <button
              key={tab}
              className={`flex items-center px-3 py-2 rounded-md transition-all ${
                anonymat === tab || (tab === "Tous" && anonymat === "Tous")
                  ? "bg-white text-blue-700 font-semibold shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setAnonymat(tab)}
            >
              <span className="mr-2">{tab}</span>
              <span className="bg-gray-200 rounded-full px-2 py-1 text-xs font-medium">
                {statsAnonymat[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm">
            <span>📄</span> Exporter PDF
          </button>
          <button className="bg-blue-600 text-white rounded-lg px-3 py-2 font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors text-sm">
            <span>📥</span> Exporter CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  RÉFÉRENCE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DATE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  NOM/PRÉNOM
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  RÉGION/PROVINCE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  DESCRIPTION
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ÉTAT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ANONYMAT
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">🔍</span>
                      <p>Aucun signalement trouvé avec les critères actuels</p>
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                        onClick={resetFilters}
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.reference}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                      {row.reference}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {row.region} / {row.city}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          row.status === "en_cours"
                            ? "bg-amber-100 text-amber-800"
                            : row.status === "finalise"
                            ? "bg-green-100 text-green-800"
                            : row.status === "doublon"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {getDisplayStatus(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          row.isAnonymous
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {getDisplayAnonymat(row.isAnonymous)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Éditer le signalement"
                        >
                          <span className="text-lg">✏️</span>
                        </button>
                        <button
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <span className="text-lg">👁️</span>
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Plus d'actions"
                        >
                          <span className="text-lg">⚙️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination ou info résultats */}
        {filteredData.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
            Affichage de {filteredData.length} signalement(s) pour {cat?.name}
          </div>
        )}
      </div>
    </div>
  );
}
