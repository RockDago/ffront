// src/components/DashboardInvest.jsx - VERSION CORRIGÉE (MODE DÉMO)
import React, { useState, useEffect } from "react";
import AuthService from "../services/authService"; // ✅ Utilise AuthService
import Header from "./Header"; // ✅ CHANGEMENT : Utilise Header au lieu de HeaderTeam
import SidebarInvest from "./SidebarInvest";
import DashboardInvestView from "./views/DashboardInvestView";
import EnquetesView from "./views/EnquetesView";
import NotificationsView from "./views/NotificationsView";
import ProfileTeam from "./ProfileTeam";
import { teamUtils } from "../api/teamAPI";

const DashboardInvest = ({ onDeconnexion }) => {
    const [currentView, setCurrentView] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [investData, setInvestData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarUpdated, setAvatarUpdated] = useState(0);

    // ✅ MODE DÉMO : Charge SEULEMENT localStorage (PAS de /profile)
    useEffect(() => {
        const loadProfile = () => {
            try {
                console.log(
                    "🎭 [MODE DÉMO] Investigateur - Chargement depuis localStorage..."
                );
                // ✅ Récupère user depuis AuthService (localStorage/sessionStorage)
                const user = AuthService.getUser();

                if (user && user.email) {
                    console.log("✅ [MODE DÉMO] Investigateur chargé:", user.email);
                    setInvestData(user);
                } else {
                    console.warn("⚠️ [MODE DÉMO] Pas de user → déconnexion");
                    onDeconnexion?.();
                }
            } catch (error) {
                console.error("❌ [MODE DÉMO] Erreur:", error);
                onDeconnexion?.();
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [onDeconnexion]);

    const handleAvatarUpdate = () => {
        setAvatarUpdated((prev) => prev + 1);
        window.location.reload();
    };

    const handleNavigateToProfile = () => setCurrentView("profil");
    const handleNavigateToNotifications = () => setCurrentView("notifications");

    // Écran de chargement
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                    <p className="mt-6 text-lg text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    // Sécurité
    if (!investData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <p className="text-xl text-red-600">Authentification requise</p>
                    <button
                        onClick={onDeconnexion}
                        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded"
                    >
                        Retour au login
                    </button>
                </div>
            </div>
        );
    }

    const renderView = () => {
        const displayData = investData;

        switch (currentView) {
            case "dashboard":
                return <DashboardInvestView data={displayData} />;
            case "enquetes":
                return <EnquetesView />;
            case "notifications":
                return <NotificationsView />;
            case "profil":
                return (
                    <ProfileTeam
                        onReturnToDashboard={() => setCurrentView("dashboard")}
                        onAvatarUpdate={handleAvatarUpdate}
                        userRole="investigateur"
                        userData={investData}
                    />
                );
            default:
                return <DashboardInvestView data={displayData} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ✅ CHANGEMENT : Utilisation du Header commun */}
            {/* On passe investData dans 'adminData' pour compatibilité si le Header attend cette prop */}
            <Header
                adminData={investData}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToNotifications={handleNavigateToNotifications}
                onDeconnexion={onDeconnexion}
                // Props optionnelles selon l'implémentation de votre Header commun :
                onAvatarUpdate={handleAvatarUpdate}
                userRole="investigateur"
            />

            <div className="flex pt-20">
                <SidebarInvest
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                <main
                    className={`flex-1 transition-all duration-300 ${
                        sidebarCollapsed ? "ml-16" : "ml-64"
                    }`}
                >
                    <div className="p-6">{renderView()}</div>
                </main>
            </div>
        </div>
    );
};

export default DashboardInvest;
