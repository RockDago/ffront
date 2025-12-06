// ======================================================
// IMPORTS
// ======================================================
import API from "../config/axios";
import AuthService from "../services/authService";

// ======================================================
// TEAM API
// ======================================================
export const teamAPI = {
    // ==================== AUTHENTIFICATION TEAM ====================
    login: async (credentials) => {
        try {
            if (!credentials.email || !credentials.password) {
                throw {
                    message: "Email et mot de passe sont requis",
                    status: 400,
                    code: "MISSING_CREDENTIALS",
                };
            }

            // Utiliser AuthService.login directement pour l'authentification simple
            const result = await AuthService.login(
                credentials.email,
                credentials.password,
                credentials.remember || false
            );

            if (result.success) {
                return {
                    success: true,
                    data: {
                        user: result.user
                        // Pas de token pour l'authentification simple
                    }
                };
            } else {
                throw {
                    message: result.message || "Email ou mot de passe incorrect",
                    status: 401,
                    code: "INVALID_CREDENTIALS"
                };
            }

        } catch (error) {
            // Si l'erreur est déjà formatée, la renvoyer
            if (error.message && error.status) {
                throw error;
            }

            // Gérer les erreurs réseau
            if (error.response) {
                const { status, data } = error.response;

                let errorMessage = "Erreur de connexion au serveur";
                if (data?.message) errorMessage = data.message;
                else if (data?.error) errorMessage = data.error;

                throw {
                    message: errorMessage,
                    status: status,
                    code: "SERVER_ERROR",
                    data: data
                };
            } else if (error.request) {
                throw {
                    message: "Impossible de joindre le serveur",
                    status: 0,
                    code: "NETWORK_ERROR"
                };
            } else {
                throw {
                    message: error.message || "Erreur inconnue",
                    status: -1,
                    code: "UNKNOWN_ERROR"
                };
            }
        }
    },

    // ==================== LOGOUT ====================
    logout: async () => {
        try {
            // Utiliser AuthService pour le logout
            await AuthService.logout();

            return {
                success: true,
                message: "Déconnexion réussie"
            };
        } catch (error) {
            // Déconnexion locale même en cas d'erreur
            AuthService.clearAuthData();
            throw error;
        }
    },

    // ==================== CHECK SESSION ====================
    checkSession: async () => {
        try {
            const response = await API.get("/team/check-session");
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                AuthService.clearAuthData();
            }
            throw error;
        }
    },

    // ==================== GET PROFILE ====================
    getProfile: async () => {
        try {
            const response = await API.get("/agent/profile");
            return response.data;
        } catch (error) {
            console.error("Erreur getProfile:", error);
            throw error;
        }
    }

    // ... autres méthodes si nécessaire
};

// ======================================================
// TEAM UTILITIES (SIMPLIFIÉ POUR AUTHENTIFICATION SIMPLE)
// ======================================================
export const teamUtils = {
    // Pour l'authentification simple, vérifie seulement le rôle
    getAuthToken: (userRole = null) => {
        const user = AuthService.getUser();

        if (user && user.role) {
            if (userRole && user.role.toLowerCase() !== userRole.toLowerCase()) {
                return null; // Mauvais rôle
            }
            return "authenticated"; // Pas de vrai token, juste un indicateur
        }

        return null;
    },

    // Récupère les données utilisateur
    getAuthUser: (userRole = null) => {
        const user = AuthService.getUser();

        if (user && userRole) {
            if (user.role && user.role.toLowerCase() !== userRole.toLowerCase()) {
                return null; // Mauvais rôle
            }
        }

        return user;
    },

    // Vérifie l'authentification
    isAuthenticated: (userRole = null) => {
        if (!AuthService.isAuthenticated()) {
            return false;
        }

        if (userRole) {
            const user = AuthService.getUser();
            return user?.role?.toLowerCase() === userRole.toLowerCase();
        }

        return true;
    },

    // Récupère le type d'utilisateur
    getUserType: () => {
        const user = AuthService.getUser();
        return user?.role ? user.role.toLowerCase() : null;
    },

    // Déconnexion
    logout: (userRole = null) => {
        AuthService.clearAuthData();
        console.log("TeamUtils: Déconnexion effectuée");
    },

    // Pour compatibilité (ne fait rien de spécial)
    setAuthData: (token, userData, rememberMe = false, userRole) => {
        // Appeler AuthService.setUserData (ignorer le token)
        AuthService.setUserData(userData, rememberMe);
    },

    initializeAuth: () => {
        return {
            isAuthenticated: AuthService.isAuthenticated(),
            user: AuthService.getUser()
        };
    },

    hasPermission: (requiredPermission, userRole = null) => {
        // Logique simple de permission
        const user = AuthService.getUser();
        return !!user; // Authentifié = a la permission
    },

    getCurrentRole: () => {
        const user = AuthService.getUser();
        return user?.role ? user.role.toLowerCase() : null;
    },
};

export default teamAPI;