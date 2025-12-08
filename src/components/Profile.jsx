import React, { useState, useEffect } from "react";
import API from "../config/axios";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Shield,
    Key,
    Camera,
    Save,
    Loader,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    Lock,
    Check,
    X,
} from "lucide-react";

const Profile = ({ onReturnToDashboard, onAvatarUpdate }) => {
    const [profileData, setProfileData] = useState({
        name: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        adresse: "",
        departement: "",
        username: "",
        responsabilites: "",
        specialisations: "",
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
        role: "",
        formatted_role: "",
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [activeTab, setActiveTab] = useState("informations");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // État pour la validation du mot de passe
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: null,
        hasUpperCase: null,
        hasNumber: null,
        hasSpecialChar: null,
    });

    // Couleurs par rôle
    const effectiveRole = (profileData.role || "admin").toLowerCase();
    const roleColors = {
        admin: {
            bg: "bg-blue-600",
            text: "text-blue-600",
            light: "bg-blue-50",
            gradient: "from-blue-600 to-blue-700",
        },
        agent: {
            bg: "bg-green-600",
            text: "text-green-600",
            light: "bg-green-50",
            gradient: "from-green-600 to-green-700",
        },
        investigateur: {
            bg: "bg-purple-600",
            text: "text-purple-600",
            light: "bg-purple-50",
            gradient: "from-purple-600 to-purple-700",
        },
    };
    const currentRole = roleColors[effectiveRole] || roleColors.admin;

    useEffect(() => {
        fetchUserProfile();
    }, []);

    // Validation du mot de passe en temps réel
    useEffect(() => {
        const password = profileData.new_password;

        if (!password) {
            // Si le champ est vide, tout en gris (null)
            setPasswordValidation({
                minLength: null,
                hasUpperCase: null,
                hasNumber: null,
                hasSpecialChar: null,
            });
            return;
        }

        setPasswordValidation({
            minLength: password.length >= 8,
            hasUpperCase: /[A-Z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password),
        });
    }, [profileData.new_password]);

    const fetchUserProfile = async () => {
        try {
            setIsLoading(true);
            const response = await API.get("/profile");

            if (response.data.success) {
                const data = response.data.data;
                setProfileData((prev) => ({
                    ...prev,
                    name: data.name || "",
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    adresse: data.adresse || "",
                    departement: data.departement || "",
                    username: data.username || "",
                    responsabilites: data.responsabilites || "",
                    specialisations: data.specialisations || "",
                    role: data.role || "",
                    formatted_role: data.formatted_role || data.role || "Utilisateur",
                }));

                if (data.avatar) {
                    setAvatarPreview(getAvatarUrl(data.avatar));
                }
            }
        } catch (error) {
            console.error("Erreur profil:", error);
            setErrors({ submit: "Erreur lors du chargement du profil" });
        } finally {
            setIsLoading(false);
        }
    };

    const getAvatarUrl = (path) => {
        if (!path) return null;
        let url = path;
        if (!url.startsWith("http")) {
            const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";
            url = `${baseURL}${url.startsWith("/") ? "" : "/"}${url}`;
        }
        return `${url}?t=${Date.now()}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        if (errors.submit) {
            setErrors((prev) => ({ ...prev, submit: null }));
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!validTypes.includes(file.type)) {
            setErrors({ ...errors, avatar: "Format invalide (JPEG, PNG, WebP, GIF)" });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ ...errors, avatar: "Image trop lourde (max 5 Mo)" });
            return;
        }

        try {
            setAvatarLoading(true);
            const formData = new FormData();
            formData.append("avatar", file);

            const reader = new FileReader();
            reader.onload = (ev) => setAvatarPreview(ev.target.result);
            reader.readAsDataURL(file);

            const res = await API.post("/profile/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success) {
                setSuccessMessage("Photo mise à jour");
                setTimeout(() => setSuccessMessage(""), 3000);
                if (onAvatarUpdate) onAvatarUpdate();
            }
        } catch (err) {
            setErrors({ ...errors, avatar: "Erreur upload avatar" });
        } finally {
            setAvatarLoading(false);
            e.target.value = "";
        }
    };

    const handleSaveInformations = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");

        if (!profileData.first_name.trim() || !profileData.last_name.trim() || !profileData.email.trim()) {
            setErrors({ submit: "Prénom, Nom et Email sont obligatoires" });
            return;
        }

        try {
            setIsLoading(true);
            const res = await API.put("/profile", {
                name: profileData.name || `${profileData.first_name} ${profileData.last_name}`,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                phone: profileData.phone,
                adresse: profileData.adresse,
                responsabilites: profileData.responsabilites,
                specialisations: profileData.specialisations,
            });

            if (res.data.success) {
                setSuccessMessage("Informations mises à jour avec succès");
                setTimeout(() => setSuccessMessage(""), 3000);
                if (onAvatarUpdate) onAvatarUpdate();
            }
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || "Erreur sauvegarde" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");

        if (profileData.new_password !== profileData.new_password_confirmation) {
            setErrors({ submit: "Les mots de passe ne correspondent pas" });
            return;
        }

        // Validation complète
        const allValid = Object.values(passwordValidation).every(val => val === true);
        if (!allValid) {
            setErrors({ submit: "Le mot de passe ne respecte pas tous les critères de sécurité" });
            return;
        }

        try {
            setIsLoading(true);
            await API.put("/profile/password", {
                current_password: profileData.current_password,
                new_password: profileData.new_password,
                new_password_confirmation: profileData.new_password_confirmation,
            });

            setSuccessMessage("Mot de passe changé avec succès");
            setProfileData((prev) => ({
                ...prev,
                current_password: "",
                new_password: "",
                new_password_confirmation: "",
            }));
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || "Erreur lors du changement de mot de passe" });
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = () => {
        if (profileData.first_name && profileData.last_name) {
            return `${profileData.first_name[0]}${profileData.last_name[0]}`.toUpperCase();
        }
        return profileData.name ? profileData.name.substring(0, 2).toUpperCase() : "U";
    };

    // Composant pour afficher les critères de validation
    const ValidationItem = ({ isValid, text }) => {
        let color = "text-gray-400";
        let Icon = null;

        if (isValid === true) {
            color = "text-green-600";
            Icon = Check;
        } else if (isValid === false) {
            color = "text-red-600";
            Icon = X;
        }

        return (
            <div className={`flex items-center gap-2 text-xs ${color} transition-colors`}>
                {Icon ? (
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />
                )}
                <span>{text}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-4">
            <div className="max-w-4xl mx-auto px-3 sm:px-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* HEADER PROFIL */}
                    <div className={`px-4 py-4 border-b border-gray-200 bg-gradient-to-r ${currentRole.gradient}`}>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-xl font-bold shadow-md overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className={currentRole.text}>{getInitials()}</span>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-white text-gray-700 p-1 rounded-full cursor-pointer shadow hover:bg-gray-100">
                                    {avatarLoading ? (
                                        <Loader className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Camera className="w-3.5 h-3.5" />
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        disabled={avatarLoading || isLoading}
                                    />
                                </label>
                            </div>
                            <div className="text-white">
                                <h1 className="text-lg font-bold">
                                    {profileData.first_name || profileData.last_name
                                        ? `${profileData.first_name} ${profileData.last_name}`
                                        : profileData.name || "Utilisateur"}
                                </h1>
                                <p className="text-xs opacity-90">{profileData.email}</p>
                                <p className="text-xs opacity-80 mt-0.5">
                                    {profileData.formatted_role} • {profileData.departement || "Département non défini"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Onglets */}
                    <div className="border-b border-gray-200 bg-white">
                        <nav className="flex -mb-px text-sm font-medium">
                            <button
                                onClick={() => setActiveTab("informations")}
                                className={`px-4 py-2.5 border-b-2 transition-colors ${
                                    activeTab === "informations"
                                        ? `${currentRole.text} border-current`
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Informations personnelles
                            </button>
                            <button
                                onClick={() => setActiveTab("password")}
                                className={`px-4 py-2.5 border-b-2 transition-colors ${
                                    activeTab === "password"
                                        ? `${currentRole.text} border-current`
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Mot de passe
                            </button>
                        </nav>
                    </div>

                    {/* Messages globaux */}
                    {(successMessage || errors.submit) && (
                        <div
                            className={`px-4 py-2.5 text-sm ${
                                successMessage
                                    ? "bg-green-50 border-b border-green-200 text-green-700"
                                    : "bg-red-50 border-b border-red-200 text-red-700"
                            }`}
                        >
                            {successMessage || errors.submit}
                        </div>
                    )}

                    {/* CONTENU */}
                    <div className="p-4">
                        {activeTab === "informations" ? (
                            <form onSubmit={handleSaveInformations} className="space-y-5">
                                {/* Identité */}
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-gray-400" />
                                        Identité
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={profileData.first_name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profileData.last_name}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        Coordonnées
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={profileData.email}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={profileData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="+261 ..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                                            <div className="relative">
                                                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                <input
                                                    type="text"
                                                    name="adresse"
                                                    value={profileData.adresse}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Infos système */}
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                        <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                        Informations système
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Rôle
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profileData.formatted_role}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                                />
                                                <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Département
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={profileData.departement || "Non spécifié"}
                                                    disabled
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                                />
                                                <Lock className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Nom d'utilisateur
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData.username || "Non défini"}
                                                disabled
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Spécialisations
                                            </label>
                                            <input
                                                type="text"
                                                name="specialisations"
                                                value={profileData.specialisations}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Ex : Fraude, Corruption..."
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Responsabilités
                                            </label>
                                            <textarea
                                                name="responsabilites"
                                                value={profileData.responsabilites}
                                                onChange={handleInputChange}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Boutons en bas */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={onReturnToDashboard}
                                        className="flex items-center text-gray-600 hover:text-gray-800 font-medium text-sm"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Retour au tableau de bord
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-5 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2 ${
                                            isLoading ? "bg-gray-400 cursor-not-allowed" : `${currentRole.bg} hover:opacity-90`
                                        }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Enregistrer les modifications
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md mx-auto">
                                <div className="text-center mb-3">
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${currentRole.light} mb-2`}>
                                        <Key className={`w-5 h-5 ${currentRole.text}`} />
                                    </div>
                                    <h2 className="text-sm font-semibold text-gray-900">Changer le mot de passe</h2>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Utilisez un mot de passe long et difficile à deviner.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Mot de passe actuel
                                    </label>
                                    <input
                                        type="password"
                                        name="current_password"
                                        value={profileData.current_password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password"
                                        value={profileData.new_password}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />

                                    {/* Critères de validation */}
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Sécurité du mot de passe :</p>
                                        <ValidationItem isValid={passwordValidation.minLength} text="8 caractères minimum" />
                                        <ValidationItem isValid={passwordValidation.hasUpperCase} text="Première lettre en majuscule" />
                                        <ValidationItem isValid={passwordValidation.hasNumber} text="Au moins un chiffre" />
                                        <ValidationItem isValid={passwordValidation.hasSpecialChar} text="Au moins un caractère spécial" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        name="new_password_confirmation"
                                        value={profileData.new_password_confirmation}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Boutons en bas */}
                                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={onReturnToDashboard}
                                        className="flex items-center text-gray-600 hover:text-gray-800 font-medium text-sm"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                                        Retour au tableau de bord
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${
                                            isLoading ? "bg-gray-400 cursor-not-allowed" : `${currentRole.bg} hover:opacity-90`
                                        }`}
                                    >
                                        {isLoading ? "Traitement..." : "Mettre à jour le mot de passe"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
