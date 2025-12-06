import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/authService";
import fosikaLogo from "../assets/images/logo fosika.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Redirection selon le rôle
  const redirectToDashboard = (role) => {
    const roleRoutes = {
      admin: "/admin",
      agent: "/agent",
      investigateur: "/investigateur",
      investigator: "/investigateur",
    };

    const normalizedRole = role?.toLowerCase();
    const targetRoute = roleRoutes[normalizedRole] || "/admin";

    // Naviguer sans rechargement de page pour préserver la session
    navigate(targetRoute);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // IMPORTANT: Récupérer le cookie CSRF avant de se connecter
      try {
        await fetch(
          `${
            process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"
          }/sanctum/csrf-cookie`,
          {
            credentials: "include",
            mode: "cors",
          }
        );
      } catch (csrfError) {
        console.warn(
          "[Login] CSRF cookie non récupéré, continuation quand même:",
          csrfError
        );
      }

      const result = await AuthService.login(email, password, rememberMe);

      if (result.success) {
        console.log("[Login] Connexion réussie pour:", result.user.email);

        // Stocker les données utilisateur
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("user_data", JSON.stringify(result.user));

        // Stocker également un token d'authentification simple
        if (result.token) {
          storage.setItem("auth_token", result.token);
        }

        // Marquer comme fraîchement connecté
        storage.setItem("just_logged_in", "true");

        // Stocker dans une variable globale pour accès immédiat
        window.__userData = result.user;

        // Émettre l'événement de connexion
        window.dispatchEvent(
          new CustomEvent("userLoggedIn", {
            detail: result.user,
          })
        );

        // Redirection SANS rechargement de page pour garder la session
        const role = result.user.role.toLowerCase();
        const routes = {
          admin: "/admin",
          agent: "/agent",
          investigateur: "/investigateur",
          investigator: "/investigateur",
        };

        // Utiliser navigate() au lieu de window.location.href
        navigate(routes[role] || "/admin");

        // Forcer un petit délai puis rafraîchir pour s'assurer que la session est chargée
        setTimeout(() => {
          // Rafraîchir uniquement si on est toujours sur la même page
          if (window.location.pathname === "/login") {
            window.location.reload();
          }
        }, 500);
      } else {
        setError(result.message || "Email ou mot de passe incorrect");
      }
    } catch (error) {
      console.error("[Login] Erreur:", error);
      setError(error.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  // Vérification session au chargement (si refresh)
  useEffect(() => {
    const checkExistingSession = () => {
      const storedUser =
        localStorage.getItem("user_data") ||
        sessionStorage.getItem("user_data");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);

          // Vérifier si l'utilisateur est encore valide en appelant l'API
          fetch(
            `${
              process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"
            }/api/check-auth`,
            {
              credentials: "include",
            }
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                // Session valide, rediriger
                redirectToDashboard(user.role);
              } else {
                // Session invalide, nettoyer
                console.warn("Session invalide, nettoyage...");
                localStorage.removeItem("user_data");
                sessionStorage.removeItem("user_data");
                setAuthChecked(true);
              }
            })
            .catch(() => {
              // Erreur réseau, nettoyer quand même
              localStorage.removeItem("user_data");
              sessionStorage.removeItem("user_data");
              setAuthChecked(true);
            });

          return; // Ne pas appeler setAuthChecked ici
        } catch (err) {
          console.warn("Données utilisateur corrompues");
          localStorage.removeItem("user_data");
          sessionStorage.removeItem("user_data");
        }
      }
      setAuthChecked(true);
    };

    checkExistingSession();

    // Nettoyer le flag "just_logged_in" après un certain temps
    const cleanupJustLoggedIn = setTimeout(() => {
      localStorage.removeItem("just_logged_in");
      sessionStorage.removeItem("just_logged_in");
    }, 5000);

    return () => clearTimeout(cleanupJustLoggedIn);
  }, [navigate]);

  // Loader pendant vérification
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#b4cd7b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm font-medium">
            Vérification de la session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
        <div className="text-center mb-6">
          <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center overflow-hidden">
            <img
              src={fosikaLogo}
              alt="Fosika Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Connexion</h2>
          <p className="text-gray-600 text-sm mt-1">
            Admin, Agent ou Investigateur
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center text-xs">
              <svg
                className="w-4 h-4 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4cd7b] focus:border-transparent transition duration-200 text-sm"
                required
                disabled={loading}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-gray-700 text-xs font-semibold mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b4cd7b] focus:border-transparent transition duration-200 text-sm"
                required
                disabled={loading}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Rester connecté */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                  disabled={loading}
                />
                <div
                  className={`w-4 h-4 border-2 rounded transition duration-200 ${
                    rememberMe
                      ? "bg-[#b4cd7b] border-[#b4cd7b]"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {rememberMe && (
                    <svg
                      className="w-2.5 h-2.5 text-white mx-auto mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-700 font-medium">
                Rester connecté
              </span>
            </label>

            <button
              type="button"
              className="text-xs text-[#b4cd7b] hover:text-[#9ab567] font-medium"
              disabled={loading}
              onClick={() =>
                alert(
                  "Contactez l'administrateur pour réinitialiser votre mot de passe."
                )
              }
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#b4cd7b] to-[#9ab567] text-white p-3 rounded-lg hover:from-[#a0bd6d] hover:to-[#8aa35c] transition duration-200 font-semibold shadow disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Se connecter</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>
              Mode : {rememberMe ? "Session persistante" : "Session temporaire"}
            </p>
            <p>© daaq-mesupres 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
