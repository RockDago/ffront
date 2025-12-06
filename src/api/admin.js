import axios from "../config/axios";

// ==================== ADMIN API ====================
export const adminAPI = {
  // ==================== AUTHENTIFICATION ====================
  login: async (credentials) => {
    try {
      console.log("AdminAPI: Tentative de connexion...", {
        email: credentials.email,
      });
      const response = await axios.post("/admin/login", credentials);

      if (response.data.success && response.data.data?.token) {
        const token = response.data.data.token;
        const userData = response.data.data.user;

        console.log("AdminAPI: Connexion réussie, stockage des données...");
        // Utiliser les utilitaires pour stocker correctement
        adminUtils.setAuthData(token, userData, credentials.remember || false);

        return response.data;
      } else {
        console.error("AdminAPI: Réponse de connexion invalide", response.data);
        throw new Error("Réponse de connexion invalide");
      }
    } catch (error) {
      console.error("AdminAPI: Erreur de connexion", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log("AdminAPI: Déconnexion en cours...");
      const response = await axios.post("/admin/logout");
      adminUtils.logout();
      console.log("AdminAPI: Déconnexion réussie");
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur lors de la déconnexion", error);
      adminUtils.logout();
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      console.log("AdminAPI: Vérification authentification...");
      const response = await axios.get("/admin/check");
      console.log("AdminAPI: Check auth résultat:", response.data);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur check auth", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      console.log("AdminAPI: Récupération utilisateur courant...");
      const response = await axios.get("/admin/user");
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur récupération utilisateur", error);
      throw error;
    }
  },

  // ==================== VALIDATION TOKEN ====================
  validateToken: async () => {
    try {
      console.log("AdminAPI: Validation du token...");
      const response = await axios.get("/admin/validate-token");
      console.log("AdminAPI: Token validation résultat:", response.data);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur validation token", error);
      throw error;
    }
  },

  // ==================== PROFIL ADMIN ====================
  getProfile: async () => {
    try {
      console.log("AdminAPI: Récupération profil...");
      const response = await axios.get("/admin/profile");
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur récupération profil", error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      console.log("AdminAPI: Mise à jour profil...");
      const response = await axios.put("/admin/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur mise à jour profil", error);
      throw error;
    }
  },

  updateAvatar: async (avatarFile) => {
    try {
      console.log("AdminAPI: Mise à jour avatar...");
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await axios.post("/admin/profile/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur mise à jour avatar", error);
      throw error;
    }
  },

  deleteAvatar: async () => {
    try {
      console.log("AdminAPI: Suppression avatar...");
      const response = await axios.delete("/admin/profile/avatar");
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur suppression avatar", error);
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      console.log("AdminAPI: Mise à jour mot de passe...");
      const response = await axios.post(
        "/admin/profile/password",
        passwordData
      );
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur mise à jour mot de passe", error);
      throw error;
    }
  },

  // ==================== RAPPORTS ====================
  getReports: async (params = {}) => {
    try {
      console.log("AdminAPI: Récupération rapports...", params);
      const response = await axios.get("/reports", { params });
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur récupération rapports", error);
      throw error;
    }
  },

  getReport: async (reference) => {
    try {
      console.log("AdminAPI: Récupération rapport:", reference);
      const response = await axios.get(`/reports/${reference}`);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur récupération rapport", error);
      throw error;
    }
  },

  updateReportStatus: async (id, statusData) => {
    try {
      console.log("AdminAPI: Mise à jour statut rapport:", id, statusData);
      const response = await axios.put(`/reports/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur mise à jour statut rapport", error);
      throw error;
    }
  },

  updateReportWorkflow: async (id, workflowData) => {
    try {
      console.log("AdminAPI: Mise à jour workflow rapport:", id, workflowData);
      const response = await axios.put(`/reports/${id}/workflow`, workflowData);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur mise à jour workflow rapport", error);
      throw error;
    }
  },

  // ==================== STATISTIQUES ====================
  getStats: async () => {
    try {
      console.log("AdminAPI: Récupération statistiques...");
      const response = await axios.get("/stats");
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur récupération statistiques", error);
      throw error;
    }
  },

  // ==================== TRACKING ====================
  checkTracking: async (reference) => {
    try {
      console.log("AdminAPI: Vérification tracking:", reference);
      const response = await axios.get(`/tracking/${reference}`);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur vérification tracking", error);
      throw error;
    }
  },

  // ==================== RAPPORTS PUBLICS ====================
  createReport: async (reportData) => {
    try {
      console.log("AdminAPI: Création rapport...");
      const response = await axios.post("/reports", reportData);
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur création rapport", error);
      throw error;
    }
  },

  // ==================== SESSION & SÉCURITÉ ====================
  validateSession: async (sessionId) => {
    try {
      console.log("AdminAPI: Validation session:", sessionId);
      const response = await axios.post("/admin/validate-session", {
        session_id: sessionId,
      });
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur validation session", error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      console.log("AdminAPI: Rafraîchissement token...");
      const response = await axios.post("/admin/refresh-token");

      // Mettre à jour le header après refresh
      if (response.data.success && response.data.data?.token) {
        const token = response.data.data.token;
        const userData = response.data.data.user;

        console.log("AdminAPI: Token rafraîchi avec succès");
        // Mettre à jour le stockage avec le nouveau token
        const currentUser = adminUtils.getAuthUser();
        const rememberMe = !!localStorage.getItem("admin_token"); // Vérifier si remember était activé

        adminUtils.setAuthData(token, userData || currentUser, rememberMe);
      }
      return response.data;
    } catch (error) {
      console.error("AdminAPI: Erreur rafraîchissement token", error);
      throw error;
    }
  },
};

// ==================== UTILITAIRES ====================
export const adminUtils = {
  setAuthData: (token, userData, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    console.log("AdminUtils: Stockage données auth...", {
      rememberMe,
      tokenPresent: !!token,
      userDataPresent: !!userData,
    });

    // Nettoyer d'abord les anciennes données
    adminUtils.logout();

    // Stocker les nouvelles données
    storage.setItem("admin_token", token);
    storage.setItem("admin_user", JSON.stringify(userData));
    storage.setItem("user_type", "admin");

    // Injecter le token dans les headers axios
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    console.log("AdminUtils: Données auth stockées avec succès");
  },

  getAuthToken: () => {
    const token =
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token");
    console.log("AdminUtils: Token récupéré:", token ? "PRÉSENT" : "MANQUANT");
    return token;
  },

  getAuthUser: () => {
    const userData =
      localStorage.getItem("admin_user") ||
      sessionStorage.getItem("admin_user");
    const user = userData ? JSON.parse(userData) : null;
    console.log(
      "AdminUtils: Utilisateur récupéré:",
      user ? "PRÉSENT" : "MANQUANT"
    );
    return user;
  },

  isAuthenticated: () => {
    const token = adminUtils.getAuthToken();
    const user = adminUtils.getAuthUser();
    const isAuth = !!(token && user);
    console.log("AdminUtils: Authentifié:", isAuth);
    return isAuth;
  },

  logout: () => {
    console.log("AdminUtils: Déconnexion...");

    const keys = [
      "admin_token",
      "admin_user",
      "user_type",
      // Nettoyer aussi les clés génériques pour éviter les conflits
      "team_token",
      "team_user",
    ];

    keys.forEach((key) => {
      const hadLocal = localStorage.getItem(key);
      const hadSession = sessionStorage.getItem(key);

      localStorage.removeItem(key);
      sessionStorage.removeItem(key);

      if (hadLocal || hadSession) {
        console.log(`AdminUtils: Clé supprimée: ${key}`);
      }
    });

    delete axios.defaults.headers.common["Authorization"];

    console.log("AdminUtils: Déconnexion terminée");
  },

  isAdmin: () => {
    const userType =
      localStorage.getItem("user_type") || sessionStorage.getItem("user_type");
    const isAdmin = userType === "admin";
    console.log("AdminUtils: Est admin:", isAdmin);
    return isAdmin;
  },

  // Nouvelle méthode pour initialiser l'authentification au chargement de l'app
  initializeAuth: () => {
    console.log("AdminUtils: Initialisation auth...");
    const token = adminUtils.getAuthToken();
    const user = adminUtils.getAuthUser();

    if (token && user) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("AdminUtils: Auth initialisée avec succès");
      return { token, user, success: true };
    }

    console.log("AdminUtils: Aucune auth trouvée");
    return { success: false, message: "Aucune session active" };
  },

  // Nouvelle méthode pour valider et rafraîchir l'authentification
  validateAndRefreshAuth: async () => {
    try {
      console.log("AdminUtils: Validation et rafraîchissement auth...");
      const token = adminUtils.getAuthToken();
      const user = adminUtils.getAuthUser();

      if (!token || !user) {
        console.log("AdminUtils: Token ou utilisateur manquant");
        return { valid: false, reason: "missing_data" };
      }

      // Tenter une requête de validation
      console.log("AdminUtils: Tentative de validation token...");
      const result = await adminAPI.validateToken();

      if (result.success) {
        console.log("AdminUtils: Token valide");
        return { valid: true };
      } else {
        console.log("AdminUtils: Token invalide selon le serveur");
        // Tenter de rafraîchir le token
        try {
          console.log("AdminUtils: Tentative de rafraîchissement...");
          const refreshResult = await adminAPI.refreshToken();
          if (refreshResult.success) {
            console.log("AdminUtils: Token rafraîchi avec succès");
            return { valid: true, refreshed: true };
          }
        } catch (refreshError) {
          console.log("AdminUtils: Échec rafraîchissement token");
        }

        // Si tout échoue, nettoyer
        adminUtils.logout();
        return { valid: false, reason: "invalid_token" };
      }
    } catch (error) {
      console.error("AdminUtils: Erreur validation auth", error);

      // En cas d'erreur réseau, on considère le token comme valide temporairement
      if (error.code === "ERR_NETWORK") {
        console.log(
          "AdminUtils: Erreur réseau, token considéré valide temporairement"
        );
        return { valid: true, networkError: true };
      }

      adminUtils.logout();
      return { valid: false, reason: "validation_error" };
    }
  },

  // Méthode pour diagnostiquer l'état de l'authentification
  diagnoseAuth: () => {
    console.log("=== DIAGNOSTIC AUTH ADMIN ===");
    const token = adminUtils.getAuthToken();
    const user = adminUtils.getAuthUser();
    const userType =
      localStorage.getItem("user_type") || sessionStorage.getItem("user_type");

    const diagnosis = {
      token: {
        present: !!token,
        source: localStorage.getItem("admin_token")
          ? "localStorage"
          : sessionStorage.getItem("admin_token")
          ? "sessionStorage"
          : "none",
        length: token ? token.length : 0,
      },
      user: {
        present: !!user,
        data: user ? { id: user.id, email: user.email, role: user.role } : null,
      },
      userType: userType,
      headers: {
        hasAuth: !!axios.defaults.headers.common["Authorization"],
      },
    };

    console.log("Diagnostic:", diagnosis);
    console.log("=== FIN DIAGNOSTIC ===");

    return diagnosis;
  },
};

export default adminAPI;
