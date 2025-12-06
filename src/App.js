import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import LoadingPage from "./components/LoadingPage";
import FormulaireSignalement from "./components/SignalementForm";
import SuiviDossier from "./components/SuiviDossier";
import Login from "./components/login"; // déjà en minuscules → parfait

import DashboardAdmin from "./components/DashboardAdmin";
import DashboardAgent from "./components/DashboardAgent";
import DashboardInvest from "./components/DashboardInvest";

import { authUtils } from "./utils/authUtils";

// ─────────────────────────────────────────────────────────────
// Composant PrivateRoute : protège les dashboards
// ─────────────────────────────────────────────────────────────
const PrivateRoute = ({ children, allowedRoles }) => {
    const [isAuth, setIsAuth] = React.useState(false);
    const [userType, setUserType] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const check = () => {
            const authenticated = authUtils.isAuthenticated();
            const type = authUtils.getUserType(); // "admin" | "agent" | "investigateur"
            setIsAuth(authenticated);
            setUserType(type);
            setLoading(false);
        };
        check();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    // Pas authentifié → login
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    // Mauvais rôle → redirection vers son dashboard
    if (userType && !allowedRoles.includes(userType)) {
        const redirectMap = {
            admin: "/admin",
            agent: "/agent",
            investigateur: "/investigateur",
        };
        return <Navigate to={redirectMap[userType] || "/login"} replace />;
    }

    // Cas improbable : authentifié mais sans rôle
    if (!userType) {
        return <Navigate to="/login" replace />;
    }

    // Tout est bon
    return children;
};

// ─────────────────────────────────────────────────────────────
// App principale
// ─────────────────────────────────────────────────────────────
function App() {
    return (
        <Router>
            <Routes>
                {/* Accueil → page de chargement */}
                <Route path="/" element={<LoadingPage />} />

                {/* Pages publiques */}
                <Route path="/signalement" element={<FormulaireSignalement />} />
                <Route path="/suivi" element={<SuiviDossier />} />
                <Route path="/login" element={<Login />} />

                {/* ──────────────── DASHBOARDS PROTÉGÉS ──────────────── */}

                {/* Admin */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute allowedRoles={["admin"]}>
                            <DashboardAdmin />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/admin/*"
                    element={
                        <PrivateRoute allowedRoles={["admin"]}>
                            <DashboardAdmin />
                        </PrivateRoute>
                    }
                />

                {/* Agent */}
                <Route
                    path="/agent"
                    element={
                        <PrivateRoute allowedRoles={["agent"]}>
                            <DashboardAgent />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/agent/*"
                    element={
                        <PrivateRoute allowedRoles={["agent"]}>
                            <DashboardAgent />
                        </PrivateRoute>
                    }
                />

                {/* Investigateur */}
                <Route
                    path="/investigateur"
                    element={
                        <PrivateRoute allowedRoles={["investigateur"]}>
                            <DashboardInvest />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/investigateur/*"
                    element={
                        <PrivateRoute allowedRoles={["investigateur"]}>
                            <DashboardInvest />
                        </PrivateRoute>
                    }
                />

                {/* 404 */}
                <Route
                    path="*"
                    element={
                        <div className="flex items-center justify-center min-h-screen bg-gray-50">
                            <div className="text-center">
                                <h1 className="text-5xl font-bold text-gray-800 mb-4">404</h1>
                                <p className="text-xl text-gray-600 mb-8">
                                    Page non trouvée
                                </p>
                                <a
                                    href="/"
                                    className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    Retour à l'accueil
                                </a>
                            </div>
                        </div>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;