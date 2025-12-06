import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  RefreshCw,
  Eye,
  X,
  Filter,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import API from "../../config/axios";

// --- Composants UI réutilisables ---

const StatusBadge = ({ status }) => {
  const getStyles = () => {
    // Gestion des valeurs null ou undefined
    const s = (status || "").toLowerCase();
    if (s.includes("succès") || s.includes("success") || s === "200")
      return "bg-green-100 text-green-700 border-green-200";
    if (
      s.includes("échec") ||
      s.includes("fail") ||
      s.includes("refusé") ||
      s.includes("40")
    )
      return "bg-red-100 text-red-700 border-red-200";
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${getStyles()}`}
    >
      {(status || "").toLowerCase().includes("succès") ? (
        <CheckCircle size={12} />
      ) : (
        <AlertCircle size={12} />
      )}
      {status || "Inconnu"}
    </span>
  );
};

const ActionBadge = ({ action }) => {
  return (
    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
      {action || "Action"}
    </span>
  );
};

const UserAvatar = ({ name }) => {
  const displayName = name || "Système";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
      {initials}
    </div>
  );
};

// --- Composant Principal ---

const JournalView = () => {
  // --- State ---
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    status: "",
    auditDateStart: "",
    auditDateEnd: "",
  });

  const [auditData, setAuditData] = useState({ audit_log: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null); // Pour le Slide-over

  // --- Effects ---
  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(fetchAuditData, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Logic ---
  const fetchAuditData = async () => {
    try {
      setErrorMsg(null);
      // CORRECTION ROUTE ICI : /admin/audit/journal au lieu de /journal-audit
      const response = await API.get("/admin/audit/journal");

      if (response.data.success) {
        setAuditData(response.data.data);
      }
    } catch (error) {
      console.error("Erreur data audit:", error);
      // Gestion spécifique erreur 404 ou Auth
      if (error.response && error.response.status === 404) {
        setErrorMsg(
          "Route API introuvable (/admin/audit/journal). Vérifiez api.php."
        );
      } else if (
        error.response &&
        (error.response.status === 401 || error.response.status === 419)
      ) {
        setErrorMsg("Session expirée. Veuillez rafraîchir la page.");
      } else {
        setErrorMsg("Impossible de charger les logs.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const exportAudit = async () => {
    try {
      // CORRECTION ROUTE EXPORT ICI AUSSI
      const response = await API.post("/admin/audit/journal/export", {
        type: "systeme",
      });
      if (response.data.success) {
        alert(`Export réussi! ${response.data.data_count} lignes préparées.`);
      } else {
        alert("Erreur export");
      }
    } catch (error) {
      console.error("Erreur export:", error);
      alert("Erreur technique lors de l'export");
    }
  };

  // Filtrage côté client (si vous n'avez pas de filtrage serveur)
  const filteredAuditLog = (auditData.audit_log || []).filter((log) => {
    const logUser = log.utilisateur || "";
    const logAction = log.action || "";
    const logStatus = log.statut || "";

    const matchUser =
      !filters.user ||
      logUser.toLowerCase().includes(filters.user.toLowerCase());
    const matchAction = !filters.action || logAction === filters.action;
    const matchStatus = !filters.status || logStatus.includes(filters.status);

    let matchDate = true;
    if (filters.auditDateStart || filters.auditDateEnd) {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      if (filters.auditDateStart)
        matchDate = matchDate && logDate >= filters.auditDateStart;
      if (filters.auditDateEnd)
        matchDate = matchDate && logDate <= filters.auditDateEnd;
    }
    return matchUser && matchAction && matchStatus && matchDate;
  });

  // Helper pour formatter le JSON ou texte dans le panneau latéral
  const renderDetails = (details) => {
    try {
      if (!details)
        return (
          <span className="text-gray-500 italic">Aucun détail technique.</span>
        );

      // Si c'est une string qui contient du JSON, on essaie de parse
      const parsed =
        typeof details === "string" &&
        (details.trim().startsWith("{") || details.trim().startsWith("["))
          ? JSON.parse(details)
          : details;

      if (typeof parsed === "object") {
        return (
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      }
      return (
        <p className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
          {details}
        </p>
      );
    } catch (e) {
      return (
        <p className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
          {details}
        </p>
      );
    }
  };

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-start">
        <div className="flex items-center gap-3 text-gray-500 animate-pulse mt-10">
          <RefreshCw className="animate-spin" /> Chargement du journal
          d'audit...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 0. Error Banner (si erreur) */}
        {errorMsg && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
            <button
              onClick={fetchAuditData}
              className="ml-auto text-sm underline hover:text-red-800"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-blue-600" /> Journal d'Audit
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Surveillance et traçabilité des actions système
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
              {filteredAuditLog.length} événements
            </div>
            <button
              onClick={exportAudit}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium shadow-md hover:shadow-lg"
            >
              <Download size={16} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* 2. Filters Section */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
            <Filter size={16} /> Filtres avancés
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={16}
              />
              <input
                type="text"
                value={filters.user}
                onChange={(e) => handleFilterChange("user", e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Toutes les actions</option>
              <option value="Connexion">Connexion</option>
              <option value="Création">Création</option>
              <option value="Modification">Modification</option>
              <option value="Suppression">Suppression</option>
              <option value="Export">Export</option>
              <option value="Tentative d'accès">Tentative d'accès</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="Succès">Succès</option>
              <option value="Echec">Echec</option>
              <option value="Refusé">Refusé</option>
            </select>

            <input
              type="date"
              value={filters.auditDateStart}
              onChange={(e) =>
                handleFilterChange("auditDateStart", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="date"
              value={filters.auditDateEnd}
              onChange={(e) =>
                handleFilterChange("auditDateEnd", e.target.value)
              }
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 3. Table Section */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {filteredAuditLog.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Aucun résultat
              </h3>
              <p className="text-sm">
                Modifiez vos filtres ou vérifiez la connexion API.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Utilisateur</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">Entité Ciblée</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Détails
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAuditLog.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={log.utilisateur} />
                          <div>
                            <div className="font-medium text-gray-900">
                              {log.utilisateur || "Système"}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {log.ip || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {log.entite || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={log.statut} />
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(log.timestamp).toLocaleDateString("fr-FR")}
                          <span className="text-xs text-gray-400 ml-1">
                            {new Date(log.timestamp).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. SLIDE-OVER (Panneau Latéral) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end isolate">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/20 backdrop-blur-[1px] transition-opacity"
            onClick={() => setSelectedLog(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200">
            {/* Header Panel */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Détails de l'événement
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">
                  ID: {selectedLog.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Utilisateur
                  </span>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <UserAvatar name={selectedLog.utilisateur} />
                    {selectedLog.utilisateur || "Inconnu"}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">
                    Date & Heure
                  </span>
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    {new Date(selectedLog.timestamp).toLocaleString("fr-FR")}
                  </div>
                </div>
              </div>

              {/* IP & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <span className="text-xs text-gray-500">Adresse IP</span>
                  <div className="font-mono text-sm mt-1">
                    {selectedLog.ip || "N/A"}
                  </div>
                </div>
                <div className="p-3 border rounded-lg">
                  <span className="text-xs text-gray-500">Résultat</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedLog.statut} />
                  </div>
                </div>
              </div>

              {/* JSON/Details Area */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                  Données Techniques / Changements
                </h3>
                <div className="bg-gray-900 rounded-xl p-4 overflow-hidden shadow-inner border border-gray-800">
                  {renderDetails(selectedLog.details)}
                </div>
              </div>
            </div>

            {/* Footer Panel */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
              Enregistrement système sécurisé • lecture seule
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalView;
