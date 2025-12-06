import React, { useState, useEffect } from "react";
import {
    Bell,
    ChevronDown,
    LogOut,
    FileText,
    AlertTriangle,
    CheckCircle,
    Settings,
    User,
} from "lucide-react";
import API from "../config/axios";
import LogoFosika from "../assets/images/logo fosika.png";

const Header = ({
                    onNavigateToNotifications,
                    onDeconnexion,
                    onNavigateToProfile,
                    onNavigateToSettings,
                    adminData,
                    userRole = "admin", // Valeur par défaut si non fournie
                }) => {
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showAvatar, setShowAvatar] = useState(false);
    const [avatarVersion, setAvatarVersion] = useState(0);

    // Sécurisation des données reçues
    const displayData = adminData || {};

    // --- CORRECTION DÉTECTION RÔLE ---
    // On priorise le rôle venant des données de l'utilisateur (BDD)
    // plutôt que la prop 'userRole' qui peut être erronée ou par défaut "admin".
    const effectiveRole = (displayData.role || userRole || "admin").toLowerCase();

    // Configuration des couleurs dynamiques par rôle
    const roleColors = {
        admin: {
            bg: "bg-blue-600",
            text: "text-blue-600",
            light: "bg-blue-50",
            border: "border-blue-200",
            badge: "bg-blue-100 text-blue-800",
            ring: "ring-blue-500",
        },
        agent: {
            bg: "bg-green-600",
            text: "text-green-600",
            light: "bg-green-50",
            border: "border-green-200",
            badge: "bg-green-100 text-green-800",
            ring: "ring-green-500",
        },
        investigateur: {
            bg: "bg-purple-600",
            text: "text-purple-600",
            light: "bg-purple-50",
            border: "border-purple-200",
            badge: "bg-purple-100 text-purple-800",
            ring: "ring-purple-500",
        },
    };

    // Sélection de la couleur active (fallback sur admin si rôle inconnu)
    const currentRole = roleColors[effectiveRole] || roleColors.admin;

    // Déconnexion propre
    const performLogout = async () => {
        try {
            await API.post("/auth/logout").catch(() => {});
        } catch (err) {
            // Ignore errors
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            if (typeof onDeconnexion === "function") {
                onDeconnexion();
            } else {
                window.location.href = "/login";
            }
        }
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        performLogout();
    };

    // Chargement des notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await API.get("/notifications/recent");
                if (res.data.success) {
                    const notifs = res.data.data || [];
                    setRecentNotifications(notifs);
                    setUnreadCount(notifs.filter((n) => n.status === "active").length);
                }
            } catch (err) {
                console.error("Erreur notifs:", err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await API.post(`/notifications/${id}/read`);
            setRecentNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Erreur markAsRead:", err);
        }
    };

    // Gestion de l'avatar (mise à jour auto si adminData change)
    useEffect(() => {
        if (!displayData?.avatar) {
            setShowAvatar(false);
            return;
        }
        const url = getAvatarUrl(displayData.avatar);
        const img = new Image();
        img.onload = () => setShowAvatar(true);
        img.onerror = () => setShowAvatar(false);
        img.src = url;
    }, [displayData?.avatar, avatarVersion]);

    const getAvatarUrl = (path) => {
        if (!path) return null;
        let url = path;
        if (url.includes("storage/avatars/")) {
            const file = url.split("/").pop();
            url = `/api/file/avatar/${file}`;
        }
        if (!url.startsWith("http")) {
            const base = process.env.REACT_APP_API_URL || "http://localhost:8000";
            url = `${base}${url.startsWith("/") ? "" : "/"}${url}`;
        }
        // Timestamp pour forcer le rafraîchissement cache
        return `${url}?v=${avatarVersion}&t=${Date.now()}`;
    };

    const avatarUrl = getAvatarUrl(displayData?.avatar);

    const getInitials = () => {
        if (displayData?.first_name && displayData?.last_name) {
            return `${displayData.first_name[0]}${displayData.last_name[0]}`.toUpperCase();
        }
        if (displayData?.name) return displayData.name.substring(0, 2).toUpperCase();
        return "U";
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case "nouveau_signalement":
                return <FileText className="w-5 h-5 text-blue-500" />;
            case "probleme_critique":
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default:
                return <CheckCircle className="w-5 h-5 text-green-500" />;
        }
    };

    const getRoleDisplayName = (role) => {
        const r = role || effectiveRole;
        return r.charAt(0).toUpperCase() + r.slice(1);
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-50 shadow-sm">
                {/* Logo aligné avec la sidebar */}
                <div className="flex items-center ml-6">
                    <img src={LogoFosika} alt="FOSIKA" className="h-28 object-contain" />
                </div>

                <div className="flex items-center space-x-6">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <Bell className="w-6 h-6 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center bg-red-600 text-white shadow-sm ring-2 ring-white">
                  {unreadCount}
                </span>
                            )}
                        </button>

                        {notificationDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setNotificationDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl py-2 z-20 max-h-96 overflow-y-auto border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                        <h3 className="font-semibold text-gray-700">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <span className={`text-xs ${currentRole.text} bg-white px-2 py-1 rounded-full border ${currentRole.border}`}>
                        {unreadCount} nouvelle(s)
                      </span>
                                        )}
                                    </div>

                                    {recentNotifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                            <div className="inline-block p-3 bg-gray-50 rounded-full mb-2">
                                                <Bell className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p>Aucune notification récente</p>
                                        </div>
                                    ) : (
                                        <ul>
                                            {recentNotifications.map((notif) => (
                                                <li
                                                    key={notif.id}
                                                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                                        notif.status === "active" ? `${currentRole.light} bg-opacity-30` : ""
                                                    }`}
                                                >
                                                    <button
                                                        className="w-full text-left px-4 py-3 flex items-start space-x-3"
                                                        onClick={() => {
                                                            markAsRead(notif.id);
                                                            if (onNavigateToNotifications) {
                                                                onNavigateToNotifications();
                                                                setNotificationDropdownOpen(false);
                                                            }
                                                        }}
                                                    >
                                                        <div className="mt-1">{getTypeIcon(notif.type)}</div>
                                                        <div className="flex-1">
                                                            <p className={`text-sm ${notif.status === "active" ? "font-semibold text-gray-800" : "text-gray-600"}`}>
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {new Date(notif.created_at).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        {notif.status === "active" && (
                                                            <div className={`w-2 h-2 rounded-full ${currentRole.bg} mt-2 shadow-sm`} />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="p-2 border-t border-gray-100 text-center">
                                        <button
                                            onClick={() => {
                                                if (onNavigateToNotifications) {
                                                    onNavigateToNotifications();
                                                    setNotificationDropdownOpen(false);
                                                }
                                            }}
                                            className={`text-sm ${currentRole.text} font-medium hover:underline py-1 px-4 rounded-lg hover:${currentRole.light} transition-colors`}
                                        >
                                            Voir tout l'historique
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="relative pl-4 border-l border-gray-200">
                        <button
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center space-x-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors pr-3"
                        >
                            {showAvatar ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profil"
                                    className={`w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-opacity-50 ${currentRole.ring}`}
                                />
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentRole.bg} text-white font-bold text-sm shadow-sm ring-2 ring-offset-2 ring-white`}>
                                    {getInitials()}
                                </div>
                            )}
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-semibold text-gray-700 leading-none mb-1">
                                    {displayData?.name || displayData?.first_name || "Utilisateur"}
                                </p>
                                <p className={`text-xs ${currentRole.text} font-medium`}>
                                    {getRoleDisplayName(effectiveRole)}
                                </p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {userDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setUserDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl py-2 z-20 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* En-tête Dropdown */}
                                    <div className={`px-6 py-4 ${currentRole.light} border-b ${currentRole.border} mb-2`}>
                                        <div className="flex items-center space-x-4">
                                            {showAvatar ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Avatar"
                                                    className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-md"
                                                />
                                            ) : (
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${currentRole.bg} text-white font-bold text-xl border-4 border-white shadow-md`}>
                                                    {getInitials()}
                                                </div>
                                            )}
                                            <div className="overflow-hidden">
                                                <p className="font-bold text-gray-800 truncate" title={displayData?.name}>
                                                    {displayData?.name || "Utilisateur"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mb-1.5" title={displayData?.email}>
                                                    {displayData?.email}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${currentRole.badge}`}>
                          {getRoleDisplayName(effectiveRole)}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2">
                                        <button
                                            onClick={() => {
                                                if (onNavigateToProfile) onNavigateToProfile();
                                                setUserDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <User className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-sm font-medium block">Mon Profil</span>
                                                <span className="text-xs text-gray-400">Gérer vos informations</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (onNavigateToSettings) onNavigateToSettings();
                                                setUserDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-gray-100 rounded-lg mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <Settings className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                                            </div>
                                            <div className="text-left">
                                                <span className="text-sm font-medium block">Paramètres</span>
                                                <span className="text-xs text-gray-400">Préférences du compte</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 my-2 mx-2"></div>

                                    <div className="px-2 pb-1">
                                        <button
                                            onClick={() => {
                                                setShowLogoutConfirm(true);
                                                setUserDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
                                        >
                                            <div className="p-2 bg-red-50 rounded-lg mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <LogOut className="w-4 h-4 text-red-500" />
                                            </div>
                                            <span className="text-sm font-medium">Déconnexion</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Modale de confirmation */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl transform transition-all scale-100 border border-gray-100">
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <LogOut className="w-8 h-8 text-red-600 ml-1" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Déconnexion
                            </h3>
                            <p className="text-gray-500">
                                Êtes-vous sûr de vouloir quitter votre session actuelle ?
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 px-4 py-2.5 text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors font-semibold shadow-lg shadow-red-200"
                            >
                                Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
