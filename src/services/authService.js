import api from "../config/axios";

class AuthService {

    // ============================================================
    // 1. LOGIN SIMPLE ET FIABLE
    // ============================================================
    static async login(loginIdentifier, password, remember = false) {
        try {
            console.log("[AuthService] Tentative de connexion...", { login: loginIdentifier });

            // ✅ FIX #1 : CSRF OBLIGATOIRE
            console.log("[AuthService] Étape 1/2 : Récup CSRF...");
            await api.get("/sanctum/csrf-cookie");

            // Petit délai de sécurité
            await new Promise((resolve) => setTimeout(resolve, 50));

            // ✅ FIX #2 : LOGIN DIRECT
            console.log("[AuthService] Étape 2/2 : Envoi identifiants...");

            // 👉 ENVOI DU LOGIN (email OU username)
            const response = await api.post("/auth/login", {
                login: loginIdentifier,
                password,
                remember,
            });

            console.log("[AuthService] Connexion réussie (API):", response.data);

            // ✅ FIX #3 : DEBUG OPTIONNEL
            try {
                const sessionDebug = await api.get("/debug/session");
                console.log("[AuthService] Vérification session post-login:", sessionDebug.data);
            } catch (debugError) {
                console.warn("[AuthService] Warning debug session:", debugError.message);
            }

            // Gestion des données utilisateur
            const user = response.data.user || response.data.data?.user || response.data;

            if (!user || (!user.email && !user.username)) {
                console.error("Structure reçue:", response.data);
                throw new Error("Données utilisateur introuvables dans la réponse");
            }

            // Normaliser le rôle
            user.role = (user.role || "agent").toString().toLowerCase().trim();

            // Stockage propre
            this.setUser(user, remember);
            console.log("[AuthService] Utilisateur prêt:", user.email || user.username, user.role);

            return { success: true, user };

        } catch (error) {
            console.error("[AuthService] Échec login:", error.response?.data || error.message);

            let message = "Identifiant ou mot de passe incorrect";
            if (error.response?.status === 401 || error.response?.status === 419) {
                message = "Identifiants incorrects ou session expirée";
            } else if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (!navigator.onLine) {
                message = "Pas de connexion internet";
            }

            return { success: false, message };
        }
    }

    // ============================================================
    // 2. DÉCONNEXION PROPRE
    // ============================================================
    static async logout() {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            console.warn("Logout API échoué (ignoré)", e.message);
        } finally {
            this.clearAuthData();
            window.location.href = "/login";
        }
    }

    // ============================================================
    // 3. VÉRIFICATION RAPIDE DE SESSION
    // ============================================================
    static async checkAuth() {
        const user = this.getUser();
        if (!user) return { success: false, authenticated: false };

        try {
            const res = await api.get("/user");
            return { success: true, authenticated: true, user: res.data };
        } catch (error) {
            if (error.response && error.response.status === 401) {
                this.clearAuthData();
                return { success: false, authenticated: false };
            }
            // Hors ligne : on garde la session locale
            return { success: true, authenticated: true, user };
        }
    }

    // ============================================================
    // 4. GESTION STOCKAGE
    // ============================================================
    static setUser(user, remember = false) {
        this.clearAuthData();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("user_data", JSON.stringify(user));
    }

    static getUser() {
        const data = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
        if (!data) return null;
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    static getRole() {
        const user = this.getUser();
        return user?.role?.toLowerCase() || null;
    }

    static isAuthenticated() {
        return !!this.getUser();
    }

    static clearAuthData() {
        localStorage.removeItem("user_data");
        sessionStorage.removeItem("user_data");
    }
}

export default AuthService;