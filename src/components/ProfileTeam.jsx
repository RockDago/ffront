import React, { useState, useEffect } from "react";
import { teamAPI, teamUtils } from "../api/teamAPI";

const ProfileTeam = ({
  onReturnToDashboard,
  onAvatarUpdate,
  userRole,
  userData,
}) => {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    adresse: "",
    departement: "",
    username: "",
    responsabilites: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("informations");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarLoadable, setAvatarLoadable] = useState(false); // ✅ NOUVEL ÉTAT

  // Couleurs par rôle
  const roleColors = {
    admin: {
      bg: "bg-blue-600",
      gradient: "from-blue-600 to-blue-700",
      text: "text-blue-600",
      light: "bg-blue-50",
    },
    agent: {
      bg: "bg-green-600",
      gradient: "from-green-600 to-green-700",
      text: "text-green-600",
      light: "bg-green-50",
    },
    investigateur: {
      bg: "bg-purple-600",
      gradient: "from-purple-600 to-purple-700",
      text: "text-purple-600",
      light: "bg-purple-50",
    },
  };

  const currentRole = roleColors[userRole] || roleColors.admin;

  useEffect(() => {
    fetchUserProfile();
  }, [userRole, userData]);

  // ✅ Fonction SILENCIEUSE pour gérer les erreurs de chargement d'image d'avatar
  const handleAvatarImageError = (e) => {
    // Masquer l'image silencieusement
    e.target.style.display = "none";

    // Afficher les initiales
    const initialsSpan = e.target.nextSibling;
    if (initialsSpan) {
      initialsSpan.style.display = "flex";
      initialsSpan.classList.remove("hidden");
    }
  };

  // ✅ Tester si l'image est accessible
  const testImageLoad = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const fetchUserProfile = async () => {
    // Vérification améliorée de l'authentification
    const token = teamUtils.getAuthToken(userRole);

    if (!token) {
      setErrors({ submit: "Session expirée. Veuillez vous reconnecter." });
      return;
    }

    try {
      setIsLoading(true);

      const response = await teamAPI.getProfile(userRole);

      if (response.success) {
        const { data } = response;

        setProfileData((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          adresse: data.adresse || "",
          departement: data.departement || "",
          username: data.username || "",
          responsabilites: data.responsabilites || "",
        }));

        if (data.avatar) {
          // ✅ CORRECTION : Construire l'URL correcte pour l'avatar
          let avatarUrl = data.avatar;

          // Si c'est un chemin de stockage Laravel, utiliser la route API
          if (avatarUrl.includes("storage/avatars/")) {
            const fileName = avatarUrl.split("/").pop();
            avatarUrl = `/api/file/avatar/${fileName}`;
          }

          // Construire l'URL complète si nécessaire
          if (!avatarUrl.startsWith("http")) {
            const baseURL =
              process.env.REACT_APP_API_URL || "http://localhost:8000";
            avatarUrl = `${baseURL}${
              avatarUrl.startsWith("/") ? "" : "/"
            }${avatarUrl}`;
          }

          // Tester si l'image est accessible avant de l'afficher
          const isLoadable = await testImageLoad(avatarUrl);
          setAvatarLoadable(isLoadable);

          if (isLoadable) {
            // Ajouter un timestamp pour éviter le cache
            setAvatarPreview(`${avatarUrl}?t=${new Date().getTime()}`);
          } else {
            setAvatarPreview("");
          }
        } else {
          setAvatarPreview("");
          setAvatarLoadable(false);
        }

        setErrors({});
      } else {
        setErrors({
          submit: response.message || "Erreur lors du chargement du profil",
        });
      }
    } catch (error) {
      handleApiError(error, "Erreur lors du chargement du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApiError = (error, defaultMessage) => {
    let errorMessage = defaultMessage;

    if (error.response?.status === 401) {
      errorMessage = "Session expirée. Veuillez vous reconnecter.";
      teamUtils.logout(userRole);
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const validationErrors = error.response.data.errors;
      setErrors(validationErrors);
      return;
    } else if (error.message) {
      errorMessage = error.message;
    }

    setErrors({ submit: errorMessage });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: "" }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar:
          "Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar: "La taille du fichier ne doit pas dépasser 5MB.",
      }));
      return;
    }

    try {
      setAvatarLoading(true);

      // Afficher un aperçu immédiat
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
        setAvatarLoadable(true);
      };
      reader.readAsDataURL(file);

      const response = await teamAPI.updateAvatar(userRole, file);

      if (response.success) {
        const newAvatarUrl = response.data?.avatar_url || response.avatar_url;

        if (newAvatarUrl) {
          // Tester la nouvelle URL
          const isLoadable = await testImageLoad(newAvatarUrl);
          setAvatarLoadable(isLoadable);

          if (isLoadable) {
            setAvatarPreview(`${newAvatarUrl}?t=${new Date().getTime()}`);
          }
        }

        setSuccessMessage("Avatar mis à jour avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);
        setErrors({});

        if (onAvatarUpdate) {
          onAvatarUpdate(newAvatarUrl);
        }

        setTimeout(() => {
          fetchUserProfile();
        }, 500);
      }
    } catch (error) {
      handleApiError(error, "Erreur lors du téléchargement de l'avatar");
      fetchUserProfile();
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const handleSaveInformations = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim() || !profileData.email.trim()) {
      setErrors({ submit: "Le nom et l'email sont obligatoires" });
      return;
    }

    setIsLoading(true);

    try {
      const profileInfo = {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        adresse: profileData.adresse.trim(),
      };

      const response = await teamAPI.updateProfile(userRole, profileInfo);

      if (response.success) {
        setSuccessMessage("Informations mises à jour avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);
        setErrors({});

        if (response.data) {
          setProfileData((prev) => ({
            ...prev,
            ...response.data,
          }));
        }
      }
    } catch (error) {
      handleApiError(error, "Erreur lors de la mise à jour des informations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (profileData.new_password !== profileData.new_password_confirmation) {
      setErrors({ submit: "Les mots de passe ne correspondent pas" });
      return;
    }

    if (profileData.new_password.length < 8) {
      setErrors({
        submit: "Le mot de passe doit contenir au moins 8 caractères",
      });
      return;
    }

    setIsLoading(true);

    try {
      const passwordData = {
        current_password: profileData.current_password,
        new_password: profileData.new_password,
        new_password_confirmation: profileData.new_password_confirmation,
      };

      const response = await teamAPI.updatePassword(userRole, passwordData);

      if (response.success) {
        setSuccessMessage("Mot de passe changé avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);

        setProfileData((prev) => ({
          ...prev,
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        }));
        setErrors({});
      }
    } catch (error) {
      handleApiError(error, "Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = () => {
    const labels = {
      admin: "Administrateur",
      agent: "Agent",
      investigateur: "Investigateur",
    };
    return labels[userRole] || "Utilisateur";
  };

  const getInitials = () => {
    return profileData.name
      ? profileData.name.substring(0, 2).toUpperCase()
      : getRoleLabel().substring(0, 2).toUpperCase();
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrors({});
  };

  useEffect(() => {
    clearMessages();
  }, [activeTab]);

  // Si pas de token, afficher un message d'erreur clair
  if (!teamUtils.getAuthToken(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="font-bold text-lg">Session expirée</h2>
            <p>Votre session a expiré ou vous n'êtes pas connecté.</p>
            <p className="text-sm mt-2">Veuillez vous reconnecter.</p>
          </div>
          <button
            onClick={onReturnToDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !profileData.name) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton de retour */}
        <div className="mb-6">
          <button
            onClick={onReturnToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors font-medium"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Retour au tableau de bord
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête du profil */}
          <div className={`bg-gradient-to-r ${currentRole.gradient} px-6 py-8`}>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div
                  className={`w-24 h-24 bg-white rounded-full flex items-center justify-center ${currentRole.text} text-2xl font-bold border-4 border-white shadow-lg overflow-hidden`}
                >
                  {avatarPreview && avatarLoadable ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={handleAvatarImageError}
                    />
                  ) : null}
                  <span
                    className={`flex items-center justify-center w-full h-full ${
                      avatarPreview && avatarLoadable ? "hidden" : ""
                    }`}
                  >
                    {getInitials()}
                  </span>
                </div>

                {/* Bouton de changement d'avatar */}
                <label
                  htmlFor="avatar-upload"
                  className={`absolute bottom-0 right-0 bg-white text-gray-700 p-2 rounded-full cursor-pointer shadow-lg hover:bg-gray-100 transition-colors ${
                    avatarLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {avatarLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
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
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={avatarLoading || isLoading}
                  />
                </label>
              </div>

              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {profileData.name || getRoleLabel()}
                </h1>
                <p className="text-blue-100">{profileData.email}</p>
                <p className="text-blue-100 text-sm mt-1">{getRoleLabel()}</p>
                <p className="text-blue-100 text-sm">@{profileData.username}</p>
              </div>
            </div>
          </div>

          {/* Message d'erreur avatar */}
          {errors.avatar && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-3 text-sm">
              {Array.isArray(errors.avatar) ? errors.avatar[0] : errors.avatar}
            </div>
          )}

          {/* Navigation par onglets */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("informations")}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "informations"
                    ? `${currentRole.text} border-current`
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "password"
                    ? `${currentRole.text} border-current`
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Mot de passe
              </button>
            </nav>
          </div>

          {/* Messages de succès/erreur globaux */}
          {(successMessage || errors.submit) && (
            <div
              className={`px-6 py-3 text-sm ${
                successMessage
                  ? "bg-green-50 border border-green-200 text-green-600"
                  : "bg-red-50 border border-red-200 text-red-600"
              }`}
            >
              {successMessage || errors.submit}
            </div>
          )}

          {/* Contenu des onglets */}
          <div className="p-6">
            {/* Onglet Informations personnelles */}
            {activeTab === "informations" && (
              <form onSubmit={handleSaveInformations} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations de base */}
                  {["name", "email", "phone", "adresse"].map((field) => (
                    <div
                      key={field}
                      className={
                        field === "adresse" || field === "phone"
                          ? "md:col-span-2"
                          : ""
                      }
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field === "name" && "Nom et prénom *"}
                        {field === "email" && "Email *"}
                        {field === "phone" && "Téléphone"}
                        {field === "adresse" && "Adresse"}
                      </label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        name={field}
                        value={profileData[field]}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors[field] ? "border-red-300" : "border-gray-300"
                        }`}
                        disabled={isLoading}
                        required={field === "name" || field === "email"}
                      />
                      {errors[field] && (
                        <p className="mt-1 text-sm text-red-600">
                          {Array.isArray(errors[field])
                            ? errors[field][0]
                            : errors[field]}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Informations système (lecture seule) */}
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                      Informations système
                    </h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Département
                    </label>
                    <input
                      type="text"
                      value={profileData.departement || "Non spécifié"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Cette information ne peut pas être modifiée
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      value={profileData.username || "Non spécifié"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Cette information ne peut pas être modifiée
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle
                    </label>
                    <input
                      type="text"
                      value={getRoleLabel()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Responsabilités
                    </label>
                    <textarea
                      value={
                        profileData.responsabilites ||
                        "Aucune responsabilité spécifiée"
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 resize-none"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Ces informations sont gérées par l'administrateur
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 ${currentRole.bg} text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Onglet Mot de passe */}
            {activeTab === "password" && (
              <form
                onSubmit={handleChangePassword}
                className="space-y-6 max-w-md"
              >
                {[
                  "current_password",
                  "new_password",
                  "new_password_confirmation",
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field === "current_password" && "Mot de passe actuel *"}
                      {field === "new_password" && "Nouveau mot de passe *"}
                      {field === "new_password_confirmation" &&
                        "Confirmer le nouveau mot de passe *"}
                    </label>
                    <input
                      type="password"
                      name={field}
                      value={profileData[field]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[field] ? "border-red-300" : "border-gray-300"
                      }`}
                      disabled={isLoading}
                      required
                    />
                    {errors[field] && (
                      <p className="mt-1 text-sm text-red-600">
                        {Array.isArray(errors[field])
                          ? errors[field][0]
                          : errors[field]}
                      </p>
                    )}
                    {field === "new_password" && (
                      <p className="mt-1 text-xs text-gray-500">
                        Le mot de passe doit contenir au moins 8 caractères.
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 ${currentRole.bg} text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Changement...
                      </>
                    ) : (
                      "Changer le mot de passe"
                    )}
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

export default ProfileTeam;
