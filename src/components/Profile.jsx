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
        role: "", // On laisse vide pour que ça se remplisse via l'API
        formatted_role: "",
    });

    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [activeTab, setActiveTab] = useState("informations");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // --- LOGIQUE DE DÉTECTION DU RÔLE (Comme dans Header) ---
    // On utilise le rôle venant de l'API (profileData.role), sinon fallback sur 'admin'
    const effectiveRole = (profileData.role || "admin").toLowerCase();

    const roleColors = {
        admin: {
            bg: "bg-blue-600",
            gradient: "from-blue-600 to-blue-700",
            text: "text-blue-600",
            light: "bg-blue-50",
            border: "border-blue-200",
            ring: "focus:ring-blue-500",
        },
        agent: {
            bg: "bg-green-600",
            gradient: "from-green-600 to-green-700",
            text: "text-green-600",
            light: "bg-green-50",
            border: "border-green-200",
            ring: "focus:ring-green-500",
        },
        investigateur: {
            bg: "bg-purple-600",
            gradient: "from-purple-600 to-purple-700",
            text: "text-purple-600",
            light: "bg-purple-50",
            border: "border-purple-200",
            ring: "focus:ring-purple-500",
        },
    };

    // Couleur active dynamique
    const currentRole = roleColors[effectiveRole] || roleColors.admin;

    useEffect(() => {
        fetchUserProfile();
    }, []);

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
                    role: data.role || "", // Stocke le rôle reçu de la BDD
                    formatted_role: data.formatted_role || data.role || "Admin",
                }));

                if (data.avatar) {
                    setAvatarPreview(getAvatarUrl(data.avatar));
                }
            }
        } catch (error) {
            console.error("Erreur profil:", error);
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
                setSuccessMessage("Photo mise à jour !");
                setTimeout(() => setSuccessMessage(""), 3000);
                // Synchronisation avec le Header
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

        try {
            setIsLoading(true);
            const res = await API.put("/profile", {
                name: profileData.name,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email, // Email modifiable envoyé
                phone: profileData.phone,
                adresse: profileData.adresse,
                departement: profileData.departement,
                responsabilites: profileData.responsabilites,
                specialisations: profileData.specialisations,
            });

            if (res.data.success) {
                setSuccessMessage("Modifications enregistrées");
                setTimeout(() => setSuccessMessage(""), 3000);
                // Mise à jour immédiate du header (nom, email...)
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
        if (profileData.new_password !== profileData.new_password_confirmation) {
            setErrors({ submit: "Les mots de passe ne correspondent pas" });
            return;
        }
        if (profileData.new_password.length < 8) {
            setErrors({ submit: "Minimum 8 caractères requis" });
            return;
        }

        try {
            setIsLoading(true);
            await API.put("/profile/password", {
                current_password: profileData.current_password,
                new_password: profileData.new_password,
                new_password_confirmation: profileData.new_password_confirmation,
            });

            setSuccessMessage("Mot de passe modifié avec succès");
            setProfileData((prev) => ({
                ...prev,
                current_password: "",
                new_password: "",
                new_password_confirmation: "",
            }));
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err) {
            setErrors({ submit: "Erreur modification mot de passe" });
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

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                {/* En-tête simple */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={onReturnToDashboard}
                        className="mr-6 p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 text-gray-600 transition-all hover:-translate-x-1"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
                        <p className="text-gray-500 mt-1">Gérez vos informations personnelles et votre sécurité</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Carte Profil (Gauche) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 overflow-hidden border border-gray-100">
                            {/* Bannière colorée dynamique */}
                            <div className={`h-32 bg-gradient-to-r ${currentRole.gradient}`}></div>

                            <div className="px-8 pb-8 relative">
                                <div className="relative -mt-16 mb-6 flex justify-center">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                            {avatarPreview ? (
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${currentRole.bg} text-white text-4xl font-bold`}>
                                                    {getInitials()}
                                                </div>
                                            )}
                                            {avatarLoading && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <Loader className="w-8 h-8 text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className={`absolute bottom-1 right-1 p-2.5 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-transform hover:scale-110 border border-gray-100 group-hover:block`}>
                                            <Camera className={`w-5 h-5 ${currentRole.text}`} />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-1">
                                        {profileData.name || "Utilisateur"}
                                    </h2>
                                    <p className="text-gray-500 mb-4 font-medium">{profileData.email}</p>
                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide ${currentRole.light} ${currentRole.text} border ${currentRole.border}`}>
                    {profileData.formatted_role}
                  </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Latérale */}
                        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden">
                            <nav className="flex flex-col p-2">
                                <button
                                    onClick={() => setActiveTab("informations")}
                                    className={`px-5 py-4 text-left flex items-center space-x-4 rounded-xl transition-all ${
                                        activeTab === "informations"
                                            ? `${currentRole.light} ${currentRole.text} font-bold`
                                            : "text-gray-600 hover:bg-gray-50 font-medium"
                                    }`}
                                >
                                    <User className={`w-5 h-5 ${activeTab === "informations" ? currentRole.text : "text-gray-400"}`} />
                                    <span>Informations personnelles</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("securite")}
                                    className={`px-5 py-4 text-left flex items-center space-x-4 rounded-xl transition-all ${
                                        activeTab === "securite"
                                            ? `${currentRole.light} ${currentRole.text} font-bold`
                                            : "text-gray-600 hover:bg-gray-50 font-medium"
                                    }`}
                                >
                                    <Shield className={`w-5 h-5 ${activeTab === "securite" ? currentRole.text : "text-gray-400"}`} />
                                    <span>Sécurité & Mot de passe</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Formulaires (Droite) */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-lg shadow-gray-100 border border-gray-100 p-8 min-h-[600px]">
                            {successMessage && (
                                <div className="mb-8 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center animate-fade-in font-medium">
                                    <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                                    {successMessage}
                                </div>
                            )}

                            {errors.submit && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center animate-fade-in font-medium">
                                    <AlertCircle className="w-5 h-5 mr-3 text-red-600" />
                                    {errors.submit}
                                </div>
                            )}

                            {activeTab === "informations" ? (
                                <form onSubmit={handleSaveInformations} className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                            <User className={`w-6 h-6 mr-3 ${currentRole.text}`} />
                                            Modifier mes informations
                                        </h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Prénom</label>
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={profileData.first_name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="Votre prénom"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profileData.last_name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="Votre nom"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nom d'affichage complet</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={profileData.name}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="Nom complet public"
                                            />
                                        </div>

                                        {/* Email Modifiable */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email professionnel</label>
                                            <div className="relative">
                                                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${currentRole.text} w-5 h-5`} />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-white shadow-sm`}
                                                    placeholder="votre.email@fosika.mg"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 ml-1">Cet email sera utilisé pour votre connexion.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={profileData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                    placeholder="+261 34..."
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Département / Service</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    name="departement"
                                                    value={profileData.departement}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                    placeholder="DSI, RH, etc."
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Adresse postale</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                                                <textarea
                                                    name="adresse"
                                                    value={profileData.adresse}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                    placeholder="Adresse complète..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`flex items-center px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                                                isLoading ? "bg-gray-400 cursor-not-allowed" : `${currentRole.bg} hover:opacity-90`
                                            }`}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                    Sauvegarde...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5 mr-2" />
                                                    Enregistrer les modifications
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleChangePassword} className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4 mb-6">
                                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                            <Key className={`w-6 h-6 mr-3 ${currentRole.text}`} />
                                            Modifier mon mot de passe
                                        </h3>
                                    </div>

                                    <div className="space-y-6 max-w-lg">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe actuel</label>
                                            <input
                                                type="password"
                                                name="current_password"
                                                value={profileData.current_password}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nouveau mot de passe</label>
                                            <input
                                                type="password"
                                                name="new_password"
                                                value={profileData.new_password}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="••••••••"
                                            />
                                            <p className="text-xs text-gray-400 mt-2">Minimum 8 caractères, chiffres et lettres recommandés.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                                            <input
                                                type="password"
                                                name="new_password_confirmation"
                                                value={profileData.new_password_confirmation}
                                                onChange={handleInputChange}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 ${currentRole.ring} transition-all bg-gray-50 focus:bg-white`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`flex items-center px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 ${
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
        </div>
    );
};

export default Profile;
