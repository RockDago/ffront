import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthService from "../services/authService";
import fosikaLogo from "../assets/images/logo fosika.png";

const Login = () => {
    const [loginIdentifier, setLoginIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const navigate = useNavigate();

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const triggerForgotPasswordToast = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    const redirectToDashboard = (role) => {
        const roleRoutes = {
            admin: "/admin",
            agent: "/agent",
            investigateur: "/investigateur",
            investigator: "/investigateur",
        };
        const normalizedRole = role?.toLowerCase();
        const targetRoute = roleRoutes[normalizedRole] || "/admin";
        navigate(targetRoute);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            try {
                await fetch(
                    `${process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"}/sanctum/csrf-cookie`,
                    { credentials: "include", mode: "cors" }
                );
            } catch (csrfError) {
                console.warn("[Login] CSRF warning:", csrfError);
            }

            const result = await AuthService.login(loginIdentifier, password, rememberMe);

            if (result.success) {
                const storage = rememberMe ? localStorage : sessionStorage;
                storage.setItem("user_data", JSON.stringify(result.user));
                if (result.token) storage.setItem("auth_token", result.token);
                storage.setItem("just_logged_in", "true");
                window.__userData = result.user;
                window.dispatchEvent(new CustomEvent("userLoggedIn", { detail: result.user }));

                const role = result.user.role.toLowerCase();
                const routes = {
                    admin: "/admin",
                    agent: "/agent",
                    investigateur: "/investigateur",
                    investigator: "/investigateur",
                };
                navigate(routes[role] || "/admin");

                setTimeout(() => {
                    if (window.location.pathname === "/login") window.location.reload();
                }, 500);
            } else {
                setError(result.message || "Identifiant ou mot de passe incorrect");
            }
        } catch (error) {
            console.error("[Login] Erreur:", error);
            setError(error.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkExistingSession = () => {
            const storedUser = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    fetch(`${process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"}/api/check-auth`, {
                        credentials: "include",
                    })
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.success) redirectToDashboard(user.role);
                            else {
                                localStorage.removeItem("user_data");
                                sessionStorage.removeItem("user_data");
                                setAuthChecked(true);
                            }
                        })
                        .catch(() => {
                            localStorage.removeItem("user_data");
                            sessionStorage.removeItem("user_data");
                            setAuthChecked(true);
                        });
                    return;
                } catch (err) {
                    localStorage.removeItem("user_data");
                    sessionStorage.removeItem("user_data");
                }
            }
            setAuthChecked(true);
        };

        checkExistingSession();
        const cleanupJustLoggedIn = setTimeout(() => {
            localStorage.removeItem("just_logged_in");
            sessionStorage.removeItem("just_logged_in");
        }, 5000);
        return () => clearTimeout(cleanupJustLoggedIn);
    }, [navigate]);

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#b4cd7b] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600 text-sm font-medium">Vérification de la session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-hidden relative">

            {/* === TOAST NOTIFICATION (Haut Droite) === */}
            <div
                className={`fixed top-5 right-5 z-50 transition-all duration-500 transform ${
                    showToast ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                }`}
            >
                <div className="bg-white border-l-4 border-[#b4cd7b] rounded shadow-2xl p-4 w-80 flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-[#b4cd7b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-bold text-gray-900 leading-5">Mot de passe oublié ?</p>
                        <p className="mt-1 text-sm leading-5 text-gray-600">
                            Contactez l'administrateur pour réinitialiser votre mot de passe.
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => setShowToast(false)}
                            className="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>


            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">

                {/* === HEADER PROFESSIONNEL === */}
                <div className="text-center mb-8"> {/* mb-6 -> mb-8 pour plus d'espace */}
                    <div className="mx-auto w-40 h-40 rounded-full flex items-center justify-center overflow-hidden mb-4">
                        <img src={fosikaLogo} alt="Fosika Logo" className="w-full h-full object-contain" />
                    </div>
                    {/* Titre Pro */}
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight"> {/* text-xl -> text-2xl, font-bold -> font-extrabold */}
                        Connexion
                    </h2>
                    {/* Sous-titre Pro */}
                    <p className="mt-2 text-sm font-medium text-gray-500">
                        Portail <span className="text-[#b4cd7b] font-bold">Admin</span> ou <span className="text-[#b4cd7b] font-bold">Agent</span>
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6"> {/* space-y-5 -> space-y-6 pour aérer */}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center text-xs">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* === CHAMP IDENTIFIANT (Floating Label) === */}
                    <div className="relative group">
                        <input
                            type="text"
                            id="login_field"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            className="block px-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-[#b4cd7b] peer"
                            placeholder=" "
                            required
                            disabled={loading}
                        />
                        <label
                            htmlFor="login_field"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-[#b4cd7b] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                        >
                            Email ou Nom d'utilisateur
                        </label>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-[#b4cd7b] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                        </div>
                    </div>

                    {/* === CHAMP MOT DE PASSE (Floating Label) === */}
                    <div className="relative group">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password_field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block px-3 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-lg border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-[#b4cd7b] peer"
                            placeholder=" "
                            required
                            disabled={loading}
                        />
                        <label
                            htmlFor="password_field"
                            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-[#b4cd7b] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-1"
                        >
                            Mot de passe
                        </label>
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                            disabled={loading}
                        >
                            {showPassword ? (
                                <svg className="w-4 h-4 group-focus-within:text-[#b4cd7b] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 group-focus-within:text-[#b4cd7b] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
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
                                <div className={`w-4 h-4 border-2 rounded transition duration-200 ${rememberMe ? "bg-[#b4cd7b] border-[#b4cd7b]" : "bg-white border-gray-300"}`}>
                                    {rememberMe && (
                                        <svg className="w-2.5 h-2.5 text-white mx-auto mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-700 font-medium">Rester connecté</span>
                        </label>

                        {/* BOUTON MOT DE PASSE OUBLIÉ (ACTION TOAST) */}
                        <button
                            type="button"
                            className="text-xs text-[#b4cd7b] hover:text-[#9ab567] font-medium focus:outline-none"
                            disabled={loading}
                            onClick={triggerForgotPasswordToast}
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Se connecter</span>
                            </div>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center text-xs text-gray-500 space-y-1">
                        <p>Mode : {rememberMe ? "Session persistante" : "Session temporaire"}</p>
                        <p>© daaq-mesupres 2025</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
