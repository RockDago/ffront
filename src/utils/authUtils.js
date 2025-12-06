// utils/authUtils.js
const authUtils = {
    // Vérifie si l'utilisateur est authentifié
    isAuthenticated: () => {
        // Vérifie simplement si l'utilisateur existe dans le stockage
        const user = localStorage.getItem('user') ||
            localStorage.getItem('user_data') ||
            sessionStorage.getItem('user') ||
            sessionStorage.getItem('user_data');

        return !!user; // Retourne true si un utilisateur existe
    },

    // Récupère le type d'utilisateur (rôle)
    getUserType: () => {
        // Essayer d'abord de récupérer depuis l'objet user
        const userData = localStorage.getItem('user') ||
            localStorage.getItem('user_data') ||
            sessionStorage.getItem('user') ||
            sessionStorage.getItem('user_data');

        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                // Normalise le rôle en minuscules pour les comparaisons
                const role = parsedUser.role || parsedUser.user_type || parsedUser.type;
                return role ? role.toLowerCase() : null;
            } catch (error) {
                console.error("Erreur parsing user data:", error);
            }
        }

        // Fallback sur user_type direct
        const userType = localStorage.getItem('user_type') ||
            sessionStorage.getItem('user_type');

        return userType ? userType.toLowerCase() : null;
    },

    // Récupère les données utilisateur complètes
    getUser: () => {
        const userData = localStorage.getItem('user') ||
            localStorage.getItem('user_data') ||
            sessionStorage.getItem('user') ||
            sessionStorage.getItem('user_data');

        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error("Erreur parsing user data:", error);
                return null;
            }
        }
        return null;
    },

    // Déconnexion
    logout: () => {
        // Nettoyer toutes les clés possibles
        localStorage.removeItem('user');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_type');

        sessionStorage.removeItem('user');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('user_type');

        // Rediriger vers la page de login
        window.location.href = '/admin/login';
    }
};

export { authUtils };