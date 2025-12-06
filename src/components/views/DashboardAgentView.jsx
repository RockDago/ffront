import React, { useState, useEffect } from "react";
import API from "../../config/axios";

const DashboardAgentView = ({ data }) => {
  const [stats, setStats] = useState({
    missionsEnCours: 0,
    missionsTerminees: 0,
    rapportsSoumis: 0,
    tauxCompletion: 0,
  });

  const [missionsRecentes, setMissionsRecentes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStats();
    fetchRecentMissions();
  }, []);

  const fetchAgentStats = async () => {
    try {
      const response = await API.get("/agent/stats");
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
      // Données simulées en attendant l'API
      setStats({
        missionsEnCours: 3,
        missionsTerminees: 12,
        rapportsSoumis: 15,
        tauxCompletion: 80,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMissions = async () => {
    try {
      const response = await API.get("/agent/missions/recent");
      if (response.data.success) {
        setMissionsRecentes(response.data.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des missions:", error);
      // Données simulées en attendant l'API
      setMissionsRecentes([
        {
          id: 1,
          titre: "Surveillance Quartier",
          statut: "En cours",
          date: "2024-01-15",
        },
        {
          id: 2,
          titre: "Contrôle Routier",
          statut: "Terminé",
          date: "2024-01-14",
        },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Tableau de Bord Agent
        </h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Missions en cours</p>
              <p className="text-2xl font-bold">{stats.missionsEnCours}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Missions terminées</p>
              <p className="text-2xl font-bold">{stats.missionsTerminees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Rapports soumis</p>
              <p className="text-2xl font-bold">{stats.rapportsSoumis}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Taux de completion</p>
              <p className="text-2xl font-bold">{stats.tauxCompletion}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Missions récentes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Missions Récentes</h2>
        <div className="space-y-4">
          {missionsRecentes.map((mission) => (
            <div
              key={mission.id}
              className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-semibold">{mission.titre}</h3>
                <p className="text-sm text-gray-600">Date: {mission.date}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  mission.statut === "En cours"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {mission.statut}
              </span>
            </div>
          ))}
          {missionsRecentes.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              Aucune mission récente
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAgentView;
