import React, { useState, useEffect } from "react";
import {
  Search,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ✅ Importez votre nouvelle instance Axios configurée
import API from "../config/axios";

import LogoFosika from "../assets/images/logo fosika.png";
import LogoRep from "../assets/images/logo rep.png";
import LogoMesupres from "../assets/images/logo mesupres.png";

const categoryIcons = {
  "faux-diplomes": "📜",
  "offre-formation-irreguliere": "🎓",
  "recrutements-irreguliers": "💼",
  harcelement: "⚠️",
  corruption: "🔴",
  divers: "📋",
};

const categoryLabels = {
  "faux-diplomes": "Faux Diplômes",
  "offre-formation-irreguliere":
    "Offre de formation irrégulière (non habilité)",
  "recrutements-irreguliers": "Recrutements Irréguliers",
  harcelement: "Harcèlement",
  corruption: "Corruption",
  divers: "Divers",
};

// Nouveaux titres par défaut selon la catégorie
const defaultTitles = {
  "faux-diplomes": "Signalement de faux diplôme",
  "offre-formation-irreguliere":
    "Signalement d'offre de formation irrégulière (non habilité)",
  "recrutements-irreguliers": "Signalement de recrutement irrégulier",
  harcelement: "Signalement de harcèlement",
  corruption: "Signalement de corruption",
  divers: "Signalement divers",
};

const statusLabels = {
  en_cours: "En cours",
  finalise: "Finalisé",
  doublon: "Doublon",
  refuse: "Refusé",
};

const workflowLabels = {
  completed: "Complété",
  in_progress: "En cours",
  pending: "En attente",
  rejected: "Rejeté",
  duplicate: "Doublon",
  not_required: "Non requis",
};

export default function DossierTracker() {
  const navigate = useNavigate();
  const [page, setPage] = useState("recherche");
  const [reference, setReference] = useState("");
  const [dossierActuel, setDossierActuel] = useState(null);
  const [erreur, setErreur] = useState("");
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // ✅ UTILISEZ LA NOUVELLE INSTANCE AXIOS
        const response = await API.get("/reports");

        const result = response.data;

        let reportsData = [];

        if (result.success && result.data && result.data.reports) {
          reportsData = result.data.reports;
        } else if (result.success && Array.isArray(result.data)) {
          reportsData = result.data;
        } else if (Array.isArray(result)) {
          reportsData = result;
        } else {
          reportsData = [];
        }

        if (reportsData && reportsData.length > 0) {
          const mappedReports = reportsData.map((report) => {
            let workflowData = {
              drse: {
                date: report.created_at || report.drse_date,
                status: "in_progress",
                agent: "Traitement et classification",
              },
              cac: {
                date: report.cac_date || null,
                status: "pending",
                agent: "Investigation",
              },
              bianco: {
                date: report.bianco_date || null,
                status: "pending",
                agent: "Transmis aux autorités compétentes",
              },
            };

            try {
              if (report.workflow && typeof report.workflow === "string") {
                workflowData = JSON.parse(report.workflow);
              } else if (
                report.workflow &&
                typeof report.workflow === "object"
              ) {
                workflowData = report.workflow;
              }
            } catch (e) {
              // Garder les valeurs par défaut
            }

            let filesArray = [];
            try {
              if (report.files) {
                if (typeof report.files === "string") {
                  filesArray = JSON.parse(report.files);
                } else if (Array.isArray(report.files)) {
                  filesArray = report.files;
                }
              }
            } catch (e) {
              filesArray = [];
            }

            // ✅ GÉRER LES SIGNALEMENTS SANS PREUVES
            const hasProof = report.has_proof || filesArray.length > 0;

            // Utiliser le titre par défaut selon la catégorie si aucun titre n'est fourni
            const getDefaultTitle = (category) => {
              return defaultTitles[category] || "Signalement sans titre";
            };

            const mappedReport = {
              id: report.id,
              reference: report.reference,
              titre: report.title || getDefaultTitle(report.category),
              dateCreation: report.created_at,
              dateMiseAJour: report.updated_at,
              category: report.category,
              statut: report.status,
              isAnonymous: report.isAnonymous || report.type === "anonyme",
              name: report.name || "Anonyme",
              email: report.email || "",
              phone: report.phone || "",
              description:
                report.description || report.title || "Aucune description",
              files: filesArray,
              hasProof: hasProof, // ✅ AJOUT DU CHAMP HAS_PROOF
              workflow: workflowData,
              region: report.region || "Non spécifié",
              city: report.city || "Non spécifié",
            };

            return mappedReport;
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

    fetchReports();
  }, []);

  // Fonction pour nettoyer la référence (supprimer les espaces)
  const cleanReference = (ref) => {
    return ref.replace(/\s+/g, ""); // Supprime tous les espaces
  };

  const handleRecherche = () => {
    const cleanedReference = cleanReference(reference);

    if (!cleanedReference.trim()) {
      setErreur("Veuillez saisir une référence");
      return;
    }

    const dossier = reports.find(
      (r) => r.reference.toLowerCase() === cleanedReference.toLowerCase()
    );

    if (dossier) {
      setErreur("");
      setDossierActuel(dossier);
      setPage("details");
    } else {
      setErreur("Aucun dossier trouvé avec cette référence");
    }
  };

  // Gestionnaire de changement pour le champ de référence
  const handleReferenceChange = (e) => {
    const value = e.target.value;
    const cleanedValue = cleanReference(value);
    setReference(cleanedValue);

    // Effacer l'erreur quand l'utilisateur tape
    if (erreur) {
      setErreur("");
    }
  };

  const retourRecherche = () => {
    setPage("recherche");
    setReference("");
    setDossierActuel(null);
    setErreur("");
  };

  const retourAccueil = () => {
    navigate("/");
  };

  // ===== FONCTION POUR EXTRAIRE LE NOM DU FICHIER - AJOUTÉE =====
  const extractFileName = (file) => {
    // Si c'est déjà juste un nom de fichier
    if (typeof file === "string") {
      // Si c'est une URL complète, extraire le nom
      if (file.includes("http://") || file.includes("https://")) {
        return file.split("/").pop();
      }
      // Si c'est juste un chemin, prendre le dernier segment
      if (file.includes("/")) {
        return file.split("/").pop();
      }
      // Sinon c'est déjà le nom du fichier
      return file;
    }

    // Si c'est un objet
    if (typeof file === "object") {
      return (
        file.file_name ||
        file.filename ||
        extractFileName(file.path || file.url || "")
      );
    }

    return file;
  };

  // ===== FONCTION POUR VOIR UN FICHIER - CORRIGÉE =====
  const handleViewFile = async (file) => {
    try {
      // Extraire uniquement le nom du fichier
      const fileName = extractFileName(file);

      // Construire l'URL correcte
      const fileUrl = `${API.defaults.baseURL}/files/${fileName}`;

      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(fileUrl, "_blank");
      if (!newWindow) {
        alert("Veuillez autoriser les pop-ups pour visualiser les fichiers");
      }
    } catch (error) {
      alert("Erreur lors de l'ouverture du fichier: " + error.message);
    }
  };

  // ===== FONCTION POUR TÉLÉCHARGER UN FICHIER - CORRIGÉE =====
  const handleDownloadFile = async (file) => {
    try {
      // Extraire uniquement le nom du fichier
      const fileName = extractFileName(file);

      // Construire l'URL de téléchargement
      const downloadUrl = `${API.defaults.baseURL}/files/${fileName}/download`;

      // Créer un lien invisible pour forcer le téléchargement
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");

      // Simuler le clic
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Erreur lors du téléchargement: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "finalise":
        return "bg-green-100 text-green-800 border-green-200";
      case "doublon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "refuse":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getWorkflowStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "in_progress":
        return <Clock className="text-blue-600" size={20} />;
      case "rejected":
        return <XCircle className="text-red-600" size={20} />;
      case "duplicate":
        return <Clock className="text-yellow-600" size={20} />;
      case "not_required":
        return <Clock className="text-gray-400" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getWorkflowStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in_progress":
        return "bg-blue-50 border-blue-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "duplicate":
        return "bg-yellow-50 border-yellow-200";
      case "not_required":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (error && page === "recherche") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <img
                  src={LogoRep}
                  alt="Logo République"
                  className="h-12 w-12 object-contain"
                />
                <img
                  src={LogoMesupres}
                  alt="Logo MESUPRES"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div className="w-[2px] bg-gray-400 h-28"></div>

              <div className="flex flex-col justify-center space-y-1">
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Repoblikan'i Madagasikara
                </span>
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Ministère de l'Enseignement Supérieur
                  <br />
                  et de la Recherche Scientifique
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Erreur de chargement
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>

        {/* COPYRIGHT AJOUTÉ - SANS CHANGER L'AFFICHAGE EXISTANT */}
        <div className="w-full text-center py-4 mt-auto">
          <div className="text-gray-500 text-xs">
            copyright @ daaq-Mesupres 2025
          </div>
        </div>
      </div>
    );
  }

  if (page === "recherche") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <img
                  src={LogoRep}
                  alt="Logo République"
                  className="h-12 w-12 object-contain"
                />
                <img
                  src={LogoMesupres}
                  alt="Logo MESUPRES"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div className="w-[2px] bg-gray-400 h-28"></div>

              <div className="flex flex-col justify-center space-y-1">
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Repoblikan'i Madagasikara
                </span>
                <span className="font-semibold text-sm uppercase leading-tight p-2">
                  Ministère de l'Enseignement Supérieur
                  <br />
                  et de la Recherche Scientifique
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-3">
                  <img
                    src={LogoFosika}
                    alt="FOSIKA"
                    className="h-16 object-contain"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Suivi de Dossier
                </h2>
                <p className="text-gray-600">
                  Consultez l'état d'avancement de votre signalement
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Référence du dossier
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={reference}
                      onChange={handleReferenceChange}
                      placeholder="Ex: REF-20251119-6AB2BF"
                      className="w-full px-4 py-3.5 pl-12 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5e8f3e] focus:border-[#5e8f3e] transition-all outline-none"
                      onKeyPress={(e) => e.key === "Enter" && handleRecherche()}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {erreur && (
                    <p className="text-red-500 text-sm mt-2">{erreur}</p>
                  )}
                </div>

                <button
                  onClick={handleRecherche}
                  disabled={isLoading}
                  className="w-full bg-[#5e8f3e] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#4a7b32] transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Recherche en cours..."
                    : "Rechercher le dossier"}
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={retourAccueil}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all shadow-md border-2 border-gray-200 hover:border-[#b3d088]"
              >
                <ArrowLeft size={20} />
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>

        {/* COPYRIGHT AJOUTÉ - SANS CHANGER L'AFFICHAGE EXISTANT */}
        <div className="w-full text-center py-4 mt-auto">
          <div className="text-gray-500 text-xs">
            copyright @ daaq-Mesupres 2025
          </div>
        </div>
      </div>
    );
  }

  if (!dossierActuel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Aucun dossier sélectionné</p>
          <button
            onClick={retourRecherche}
            className="bg-[#5e8f3e] text-white px-6 py-3 rounded-lg hover:bg-[#4a7b32] transition-colors"
          >
            Retour à la recherche
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full bg-white border-b-2 border-gray-200 py-4 shadow-sm">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <img
                src={LogoRep}
                alt="Logo République"
                className="h-12 w-12 object-contain"
              />
              <img
                src={LogoMesupres}
                alt="Logo MESUPRES"
                className="h-12 w-12 object-contain"
              />
            </div>

            <div className="w-[2px] bg-gray-400 h-28"></div>

            <div className="flex flex-col justify-center space-y-1">
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Repoblikan'i Madagasikara
              </span>
              <span className="font-semibold text-sm uppercase leading-tight p-2">
                Ministère de l'Enseignement Supérieur
                <br />
                et de la Recherche Scientifique
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-[#0c2844] to-[#09407e] p-6">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {categoryIcons[dossierActuel.category]}
                  </span>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {dossierActuel.titre}
                    </h1>
                    <p className="text-white/90 text-sm mt-1">
                      {categoryLabels[dossierActuel.category]}
                    </p>
                  </div>
                </div>
                <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <p className="text-white font-mono font-semibold text-sm">
                    Référence: {dossierActuel.reference}
                  </p>
                </div>
                {/* ✅ INDICATION SI LE SIGNALEMENT A DES PREUVES */}
                <div className="mt-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      dossierActuel.hasProof
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {dossierActuel.hasProof ? "Avec preuves" : "Sans preuves"}
                  </span>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-lg text-sm font-bold border-2 shadow-lg ${getStatusColor(
                  dossierActuel.statut
                )}`}
              >
                {statusLabels[dossierActuel.statut]}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] rounded-full mr-3"></div>
                {dossierActuel.isAnonymous
                  ? "Signalement anonyme"
                  : "Informations de l'émetteur"}
              </h2>

              {!dossierActuel.isAnonymous ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Nom complet
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Téléphone
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.phone || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Email
                        </p>
                        <p className="font-semibold text-gray-800 text-sm break-all">
                          {dossierActuel.email || "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Localisation
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {dossierActuel.city}, {dossierActuel.region}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[#09407e] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-0.5">
                          Date de création
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDate(dossierActuel.dateCreation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 text-center">
                  <User className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-semibold text-sm">
                    Ce signalement a été effectué de manière anonyme
                  </p>
                  <div className="mt-3 bg-white rounded-lg p-3 border border-gray-200 inline-block">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#4c7026]" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          Date de création
                        </p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {formatDate(dossierActuel.dateCreation)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] rounded-full mr-3"></div>
                Description du signalement
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                  {dossierActuel.description}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] rounded-full mr-3"></div>
                Pièces jointes
                <span className="ml-3 text-sm font-normal text-gray-500">
                  ({dossierActuel.files?.length || 0} fichier
                  {(dossierActuel.files?.length || 0) > 1 ? "s" : ""})
                </span>
              </h2>
              {dossierActuel.files && dossierActuel.files.length > 0 ? (
                <div className="grid gap-2">
                  {dossierActuel.files.map((file, index) => {
                    // Extraire uniquement le nom du fichier pour l'affichage
                    const displayName = extractFileName(file);
                    const extension =
                      displayName.split(".").pop()?.toUpperCase() || "FILE";

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-[#4c7026] to-[#b4cd7b] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-white text-xs font-bold">
                              {extension}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-800 font-medium text-sm block">
                              Preuve {index + 1}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {displayName}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewFile(file)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Eye size={14} />
                            Voir
                          </button>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <Download size={14} />
                            Télécharger
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-500">
                    {dossierActuel.hasProof
                      ? "Aucun fichier joint à ce dossier"
                      : "Signalement soumis sans pièces jointes"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-1 h-6 bg-[#4c7026] rounded-full mr-3"></div>
                Suivi du traitement
              </h2>
              <div className="space-y-3">
                <div
                  className={`border-2 rounded-lg p-4 ${getWorkflowStatusColor(
                    dossierActuel.workflow.drse.status
                  )} transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getWorkflowStatusIcon(
                        dossierActuel.workflow.drse.status
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">
                          Traitement et Classification
                        </h4>
                        <p className="text-xs text-gray-600">
                          {dossierActuel.workflow.drse.agent}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200">
                      {workflowLabels[dossierActuel.workflow.drse.status]}
                    </span>
                  </div>
                  {dossierActuel.workflow.drse.date && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <Calendar size={12} />
                      {formatDate(dossierActuel.workflow.drse.date)}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="w-1 h-6 bg-[#cccdce] rounded-full"></div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${getWorkflowStatusColor(
                    dossierActuel.workflow.cac.status
                  )} transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getWorkflowStatusIcon(dossierActuel.workflow.cac.status)}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">
                          Investigation
                        </h4>
                        <p className="text-xs text-gray-600">
                          {dossierActuel.workflow.cac.agent}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200">
                      {workflowLabels[dossierActuel.workflow.cac.status]}
                    </span>
                  </div>
                  {dossierActuel.workflow.cac.date && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <Calendar size={12} />
                      {formatDate(dossierActuel.workflow.cac.date)}
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <div className="w-1 h-6 bg-[#cccdce] rounded-full"></div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${getWorkflowStatusColor(
                    dossierActuel.workflow.bianco.status
                  )} transition-all`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getWorkflowStatusIcon(
                        dossierActuel.workflow.bianco.status
                      )}
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">
                          Transmis aux autorités compétentes
                        </h4>
                        <p className="text-xs text-gray-600">
                          {dossierActuel.workflow.bianco.agent}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200">
                      {workflowLabels[dossierActuel.workflow.bianco.status]}
                    </span>
                  </div>
                  {dossierActuel.workflow.bianco.date && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                      <Calendar size={12} />
                      {formatDate(dossierActuel.workflow.bianco.date)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={retourRecherche}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-all shadow-md border-2 border-[#b4cd7b] hover:border-[#4c7026]"
          >
            <Search size={18} />
            Nouvelle recherche
          </button>
          <button
            onClick={retourAccueil}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4c7026] hover:bg-[#3a5a1d] text-white font-semibold rounded-lg transition-all shadow-md"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </button>
        </div>

        {/* COPYRIGHT AJOUTÉ SUR LA PAGE DE DÉTAILS - SANS CHANGER L'AFFICHAGE EXISTANT */}
        <div className="w-full text-center py-4 mt-6">
          <div className="text-gray-500 text-xs">
            copyright @ daaq-Mesupres 2025
          </div>
        </div>
      </div>
    </div>
  );
}
