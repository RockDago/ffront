import api from "../config/axios";

class AuthService {
    // ============================================================
    // 1. LOGIN SIMPLE ET FIABLE
    // ============================================================
    static async login(email, password, remember = false) {
        try {
            console.log("[AuthService] Tentative de connexion...", { email });

            // ✅ FIX #1 : CSRF OBLIGATOIRE
            // C'est la SEULE requête nécessaire avant le login
            console.log("[AuthService] Étape 1/2 : Récup CSRF...");
            await api.get("/sanctum/csrf-cookie");

            // Petit délai de sécurité pour s'assurer que le cookie est bien setté par le navigateur
            await new Promise((resolve) => setTimeout(resolve, 50));

            // ✅ FIX #2 : LOGIN DIRECT
            // On ne fait PAS de requête debug ici pour éviter le 401
            console.log("[AuthService] Étape 2/2 : Envoi identifiants...");

            const response = await api.post("/auth/login", {
                email,
                password,
                remember,
            });

            console.log("[AuthService] Connexion réussie (API):", response.data);

            // ✅ FIX #3 : DEBUG OPTIONNEL (APRÈS CONNEXION)
            // Maintenant qu'on est connecté, on peut appeler les routes protégées si besoin
            try {
                // Cette étape est facultative pour le fonctionnement, mais utile pour votre debug
                const sessionDebug = await api.get("/debug/session");
                console.log("[AuthService] Vérification session post-login:", sessionDebug.data);
            } catch (debugError) {
                console.warn("[AuthService] Warning debug session:", debugError.message);
                // On ne bloque pas le login si le debug échoue
            }

            // Gestion des données utilisateur
            // Adaptez selon le retour réel de votre API (data.user ou data directement)
            const user = response.data.user || response.data.data?.user || response.data;

            if (!user || !user.email) {
                console.error("Structure reçue:", response.data);
                throw new Error("Données utilisateur introuvables dans la réponse");
            }

            // Normaliser le rôle (fallback sur 'agent' si vide)
            user.role = (user.role || "agent").toString().toLowerCase().trim();

            // Stockage propre
            this.setUser(user, remember);

            console.log("[AuthService] Utilisateur prêt:", user.email, user.role);

            return { success: true, user };

        } catch (error) {
            console.error(
                "[AuthService] Échec login:",
                error.response?.data || error.message
            );

            let message = "Email ou mot de passe incorrect";

            // Gestion fine des erreurs
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
            // Redirection forcée pour nettoyer l'état de React
            window.location.href = "/login";
        }
    }

    // ============================================================
    // 3. VÉRIFICATION RAPIDE DE SESSION
    // ============================================================
    static async checkAuth() {
        const user = this.getUser();
        // Si pas de user en local, on considère déconnecté direct
        if (!user) return { success: false, authenticated: false };

        try {
            // On vérifie si le cookie de session est toujours valide côté serveur
            const res = await api.get("/user"); // Convention standard Sanctum: /api/user
            return { success: true, authenticated: true, user: res.data };
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Session serveur expirée -> on nettoie tout
                this.clearAuthData();
                return { success: false, authenticated: false };
            }
            // En cas d'erreur réseau (hors ligne), on fait confiance au localStorage
            return { success: true, authenticated: true, user };
        }
    }

    // ============================================================
    // 4. GESTION STOCKAGE ULTRA-SIMPLE
    // ============================================================
    static setUser(user, remember = false) {
        this.clearAuthData(); // Nettoyer d'abord pour éviter les doublons
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem("user_data", JSON.stringify(user));
    }

    static getUser() {
        const data =
            localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
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
