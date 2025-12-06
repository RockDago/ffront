import React, { useState, useEffect } from "react";
import API from "../../config/axios";
import {
  Bell,
  RefreshCw,
  Trash2,
  Check,
  FileText,
  AlertTriangle,
  Shield,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  MailOpen,
  Download,
  Eye,
  File,
} from "lucide-react";

const NotificationsView = ({ navigationData, onCloseNotification }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  useEffect(() => {
    if (navigationData) {
      if (navigationData.view === "detail" && navigationData.notification) {
        // Ouvrir directement le détail de la notification
        setSelectedNotification(navigationData.notification);
        setViewMode("detail");
      } else if (navigationData.view === "list") {
        // Afficher la liste complète
        setSelectedNotification(null);
        setViewMode("list");
      }
    }
  }, [navigationData]);

  const fetchAllNotifications = async () => {
    try {
      const response = await API.get("/notifications");
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await API.post(
        `/notifications/${notificationId}/read`,
        {}
      );

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, status: "read" } : notif
          )
        );
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification((prev) => ({ ...prev, status: "read" }));
        }
      }
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await API.post("/notifications/read-all", {});

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            status: "read",
          }))
        );
      }
    } catch (error) {
      console.error("Erreur lors du marquage de tout comme lu:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await API.delete(`/notifications/${notificationId}`);

      if (response.data.success) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
        if (selectedNotification?.id === notificationId) {
          setSelectedNotification(null);
          setViewMode("list");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const confirmDelete = (notificationId, notificationTitle) => {
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 mx-4">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Supprimer la notification</h3>
            <p class="text-gray-600 text-sm mt-1">Cette action est irréversible</p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <p class="text-gray-700 text-sm">
            Êtes-vous sûr de vouloir supprimer définitivement la notification 
            <strong class="text-gray-900 block mt-1">"${notificationTitle}"</strong> ?
          </p>
        </div>
        <div class="flex gap-3 justify-end">
          <button id="cancel-btn" class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
            Annuler
          </button>
          <button id="confirm-btn" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
            Supprimer
          </button>
        </div>
      </div>
    `;

    const cancelBtn = modal.querySelector("#cancel-btn");
    const confirmBtn = modal.querySelector("#confirm-btn");

    cancelBtn.onclick = () => document.body.removeChild(modal);
    confirmBtn.onclick = () => {
      deleteNotification(notificationId);
      document.body.removeChild(modal);
    };

    document.body.appendChild(modal);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "nouveau_signalement":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "doublon_detecte":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case "signalement_urgent":
        return <Shield className="w-4 h-4 text-red-600" />;
      case "statut_modifie":
        return <RefreshCw className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "nouveau_signalement":
        return "Nouveau dossier";
      case "doublon_detecte":
        return "Doublon détecté";
      case "signalement_urgent":
        return "Signalement urgent";
      case "statut_modifie":
        return "Statut modifié";
      default:
        return "Notification système";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} j`;

      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch (e) {
      return timestamp;
    }
  };

  const formatDetailedTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return notification.status === "active";
    if (filter === "read") return notification.status === "read";
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotifications = filteredNotifications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const unreadCount = notifications.filter((n) => n.status === "active").length;

  const handleNotificationClick = async (notification) => {
    if (notification.status === "active") {
      await markAsRead(notification.id);
    }

    let signalementDetails = null;
    if (notification.reference_dossier) {
      signalementDetails = await fetchSignalementDetails(
        notification.reference_dossier
      );
    }

    setSelectedNotification({
      ...notification,
      signalementDetails,
    });
    setViewMode("detail");
  };

  const fetchSignalementDetails = async (reference) => {
    try {
      const response = await API.get(`/reports/${reference}`);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
    }
    return null;
  };

  const handleBackToList = () => {
    setSelectedNotification(null);
    setViewMode("list");
    if (onCloseNotification) {
      onCloseNotification();
    }
  };

  const handleViewFile = (fileUrl) => {
    window.open(fileUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-3 mb-2 border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vue détaillée (quand on clique sur une notification dans le header ou dans la liste)
  if (viewMode === "detail" && selectedNotification) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour aux notifications
            </button>
            <div className="flex items-center gap-2">
              {selectedNotification.status === "active" && (
                <button
                  onClick={() => markAsRead(selectedNotification.id)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Marquer comme lu
                </button>
              )}
              <button
                onClick={() =>
                  confirmDelete(
                    selectedNotification.id,
                    selectedNotification.titre
                  )
                }
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Supprimer
              </button>
            </div>
          </div>

          {/* Carte de notification */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* En-tête */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  {getTypeIcon(selectedNotification.type)}
                </div>
                <div className="flex-1">
                  <h1 className="text-lg font-bold text-gray-900 mb-1">
                    {selectedNotification.titre}
                  </h1>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Bell className="w-3 h-3" />
                      {getTypeText(selectedNotification.type)}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDetailedTime(
                        selectedNotification.created_at ||
                          selectedNotification.timestamp
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 space-y-4">
              {/* Message principal */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Message
                </h3>
                <div className="bg-gray-50 rounded border p-3">
                  <p className="text-gray-900 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              {/* Détails spécifiques pour les doublons */}
              {selectedNotification.type === "doublon_detecte" && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    Analyse du doublon
                  </h3>
                  <div className="bg-orange-50 border border-orange-200 rounded p-3">
                    <div className="space-y-2">
                      <p className="text-orange-800 text-sm font-medium">
                        Ce signalement a été identifié comme un doublon pour les
                        raisons suivantes :
                      </p>

                      {selectedNotification.metadata?.raisons_doublon ? (
                        <ul className="list-disc list-inside space-y-1 text-orange-800 text-sm">
                          {selectedNotification.metadata.raisons_doublon.map(
                            (raison, index) => (
                              <li key={index}>{raison}</li>
                            )
                          )}
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside space-y-1 text-orange-800 text-sm">
                          <li>
                            Informations du plaignant identiques ou très
                            similaires
                          </li>
                          <li>
                            Description des faits correspondante à un
                            signalement précédent
                          </li>
                          <li>Localisation et période temporelle identiques</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Détails du signalement */}
              {selectedNotification.signalementDetails && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Détails du dossier
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            PLAIGNANT:
                          </span>
                          <p className="text-gray-900">
                            {selectedNotification.signalementDetails.isAnonymous
                              ? "Anonyme"
                              : selectedNotification.signalementDetails.name ||
                                "Non spécifié"}
                          </p>
                        </div>
                        {selectedNotification.signalementDetails.email && (
                          <div>
                            <span className="font-medium text-gray-700 text-xs">
                              EMAIL:
                            </span>
                            <p className="text-gray-900">
                              {selectedNotification.signalementDetails.email}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            LOCALISATION:
                          </span>
                          <p className="text-gray-900">
                            {selectedNotification.signalementDetails.region ||
                              "Non spécifié"}
                            {selectedNotification.signalementDetails.city &&
                              `, ${selectedNotification.signalementDetails.city}`}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            CATÉGORIE:
                          </span>
                          <p className="text-gray-900 capitalize">
                            {selectedNotification.signalementDetails.category?.replace(
                              /-/g,
                              " "
                            ) || "Non spécifié"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            RÉFÉRENCE:
                          </span>
                          <p className="text-gray-900 font-mono text-blue-600">
                            {selectedNotification.signalementDetails.reference}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 text-xs">
                            DATE DE SOUMISSION:
                          </span>
                          <p className="text-gray-900">
                            {new Date(
                              selectedNotification.signalementDetails.created_at
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {selectedNotification.signalementDetails.description && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-xs">
                          DESCRIPTION:
                        </span>
                        <div className="bg-white rounded border p-2 mt-1">
                          <p className="text-gray-900 text-sm leading-relaxed">
                            {
                              selectedNotification.signalementDetails
                                .description
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pièces jointes */}
                    {selectedNotification.signalementDetails.files &&
                      selectedNotification.signalementDetails.files.length >
                        0 && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700 text-xs">
                            PREUVES (PIÈCES JOINTES):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {selectedNotification.signalementDetails.files.map(
                              (file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                                  onClick={() => handleViewFile(file.url)}
                                >
                                  <File className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Eye className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Fallback pour filesCount si files n'existe pas */}
                    {(!selectedNotification.signalementDetails.files ||
                      selectedNotification.signalementDetails.files.length ===
                        0) &&
                      selectedNotification.signalementDetails.filesCount >
                        0 && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700 text-xs">
                            PREUVES:
                          </span>
                          <div className="flex items-center gap-2 p-2 bg-white rounded border mt-1">
                            <Download className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-700">
                              {
                                selectedNotification.signalementDetails
                                  .filesCount
                              }{" "}
                              fichier(s) attaché(s)
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Référence seule */}
              {selectedNotification.reference_dossier &&
                !selectedNotification.signalementDetails && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Référence
                    </h3>
                    <div className="bg-gray-50 rounded border p-3">
                      <p className="font-mono text-blue-600 text-sm font-medium">
                        {selectedNotification.reference_dossier}
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue liste (quand on clique sur "Voir tout" dans le header)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 text-xs mt-1">
                {notifications.length} notification(s) • {unreadCount} non lu(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAllNotifications}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-3 mt-4 border-b border-gray-200 -mb-px">
            <button
              onClick={() => {
                setFilter("all");
                setCurrentPage(1);
              }}
              className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors ${
                filter === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                Toutes
              </span>
            </button>
            <button
              onClick={() => {
                setFilter("unread");
                setCurrentPage(1);
              }}
              className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors ${
                filter === "unread"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Non lues
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => {
                setFilter("read");
                setCurrentPage(1);
              }}
              className={`pb-2 px-1 text-xs font-medium border-b-2 transition-colors ${
                filter === "read"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="flex items-center gap-1">
                <MailOpen className="w-3 h-3" />
                Lues
              </span>
            </button>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {filter === "all"
                  ? "Aucune notification"
                  : filter === "unread"
                  ? "Aucune notification non lue"
                  : "Aucune notification lue"}
              </h3>
              <p className="text-gray-600 text-xs">
                {filter === "all"
                  ? "Vos notifications apparaîtront ici."
                  : "Aucune notification ne correspond au filtre sélectionné."}
              </p>
            </div>
          ) : (
            <>
              {/* Liste */}
              <div className="divide-y divide-gray-100">
                {currentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status === "active"
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Icône type */}
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getTypeIcon(notification.type)}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-semibold text-xs ${
                              notification.status === "active"
                                ? "text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {getTypeText(notification.type)}
                          </span>
                          {notification.status === "active" && (
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(
                            notification.created_at || notification.timestamp
                          )}
                        </div>
                      </div>

                      <h3
                        className={`font-semibold text-gray-900 text-xs mb-1 ${
                          notification.status === "active"
                            ? ""
                            : "text-gray-600"
                        }`}
                      >
                        {notification.titre}
                      </h3>

                      <p className="text-gray-600 text-xs mb-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.reference_dossier && (
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border text-xs">
                            Réf: {notification.reference_dossier}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {indexOfFirstItem + 1}-
                      {Math.min(indexOfLastItem, filteredNotifications.length)}{" "}
                      sur {filteredNotifications.length}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>

                      <span className="text-xs text-gray-600 mx-2">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
