// config/axios.js - VERSION CORRIGÉE (intercepteur 401 désactivé temporairement)
import axios from "axios";

export const API_URL = "http://127.0.0.1:8000/api";

const API = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CRITIQUE pour les cookies de session
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Intercepteur CSRF amélioré
API.interceptors.request.use(
  (config) => {
    // Récupérer le token CSRF du cookie
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers["X-CSRF-TOKEN"] = csrfToken;
      config.headers["X-XSRF-TOKEN"] = csrfToken;
    }

    // Ajouter un timestamp pour éviter le cache
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    console.log(`[Axios] ${config.method.toUpperCase()} ${config.url}`, {
      hasCSRFToken: !!csrfToken,
      withCredentials: config.withCredentials,
    });

    return config;
  },
  (error) => {
    console.error("[Axios] Erreur requête:", error);
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTEUR MODIFIÉ : 401/419 DÉSACTIVÉS TEMPORAIREMENT
API.interceptors.response.use(
  (response) => {
    console.log(`[Axios] Réponse ${response.status} de ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("[Axios] Erreur réponse:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });

    // ❌ TEMPO : DÉSACTIVÉ POUR DEBUG - NE DÉCONNECTE PAS AUTOMATIQUEMENT
    /*
    if (error.response?.status === 401 || error.response?.status === 419) {
      console.warn("[Axios] Session expirée (401/419) → déconnexion forcée");
      clearAuthData();
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    */

    // Toutes les erreurs passent normalement (pas de déconnexion auto)
    return Promise.reject(error);
  }
);

// Fonction pour récupérer le token CSRF
function getCsrfToken() {
  try {
    // Essayer XSRF-TOKEN (format Laravel Sanctum)
    const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (xsrfMatch) {
      return decodeURIComponent(xsrfMatch[1]);
    }

    // Essayer laravel_token
    const laravelMatch = document.cookie.match(/laravel_token=([^;]+)/);
    if (laravelMatch) {
      return decodeURIComponent(laravelMatch[1]);
    }

    // Essayer laravel_session
    const sessionMatch = document.cookie.match(/laravel_session=([^;]+)/);
    if (sessionMatch) {
      return decodeURIComponent(sessionMatch[1]);
    }

    return null;
  } catch (err) {
    console.warn("[Axios] Erreur récupération CSRF token:", err);
    return null;
  }
}

export const clearAuthData = () => {
  console.log("[Axios] Nettoyage des données d'authentification");

  const itemsToClear = [
    "user",
    "user_data",
    "user_type",
    "auth_token",
    "just_logged_in",
    "admin_token",
    "token",
  ];

  itemsToClear.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });

  // Effacer également les cookies de session
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.trim().split("=")[0];
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

// Fonction utilitaire pour vérifier l'état de la connexion
export const checkConnection = async () => {
  try {
    const response = await API.get("/health");
    return {
      connected: true,
      data: response.data,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};

export default API;
