import React, { useState, useEffect, useCallback } from "react";
import { adminAPI } from "../api/admin";
import { authUtils } from "../utils/authUtils";

const AdminProfile = ({ onReturnToDashboard, onAvatarUpdate }) => {
  const [adminData, setAdminData] = useState({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
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
  const [avatarLoadable, setAvatarLoadable] = useState(false);

  // ✅ Fonction unique pour gérer les erreurs API
  const handleApiError = useCallback((error, defaultMessage) => {
    let errorMessage = defaultMessage;

    if (error.response?.status === 401) {
      errorMessage = "Session expirée. Veuillez vous reconnecter.";
      authUtils.logout();
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Gestion des erreurs de validation Laravel
      const validationErrors = error.response.data.errors;
      setErrors(validationErrors);
      return;
    } else if (error.message) {
      errorMessage = error.message;
    }

    setErrors({ submit: errorMessage });
  }, []);

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

  const fetchAdminProfile = useCallback(async () => {
    if (!authUtils.isAuthenticated()) {
      setErrors({ submit: "Session expirée. Veuillez vous reconnecter." });
      return;
    }

    try {
      setIsLoading(true);

      const response = await adminAPI.getProfile();

      if (response.success) {
        const { data } = response;

        setAdminData((prev) => ({
          ...prev,
          name: data.name || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
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
  }, [handleApiError]);

  useEffect(() => {
    fetchAdminProfile();
  }, [fetchAdminProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdminData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Effacer l'erreur générale
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

      const response = await adminAPI.updateAvatar(file);

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
          fetchAdminProfile();
        }, 500);
      }
    } catch (error) {
      handleApiError(error, "Erreur lors du téléchargement de l'avatar");
      fetchAdminProfile();
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  };

  const handleSaveInformations = async (e) => {
    e.preventDefault();

    if (!adminData.name.trim() || !adminData.email.trim()) {
      setErrors({ submit: "Le nom et l'email sont obligatoires" });
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        name: adminData.name.trim(),
        first_name: adminData.first_name.trim(),
        last_name: adminData.last_name.trim(),
        email: adminData.email.trim(),
        phone: adminData.phone.trim(),
      };

      const response = await adminAPI.updateProfile(profileData);

      if (response.success) {
        setSuccessMessage("Informations mises à jour avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);
        setErrors({});

        if (response.data) {
          setAdminData((prev) => ({
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

    if (adminData.new_password !== adminData.new_password_confirmation) {
      setErrors({ submit: "Les mots de passe ne correspondent pas" });
      return;
    }

    if (adminData.new_password.length < 8) {
      setErrors({
        submit: "Le mot de passe doit contenir au moins 8 caractères",
      });
      return;
    }

    setIsLoading(true);

    try {
      const passwordData = {
        current_password: adminData.current_password,
        new_password: adminData.new_password,
        new_password_confirmation: adminData.new_password_confirmation,
      };

      const response = await adminAPI.updatePassword(passwordData);

      if (response.success) {
        setSuccessMessage("Mot de passe changé avec succès");
        setTimeout(() => setSuccessMessage(""), 3000);

        setAdminData((prev) => ({
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

  const getInitials = () => {
    if (adminData.first_name && adminData.last_name) {
      return `${adminData.first_name[0]}${adminData.last_name[0]}`.toUpperCase();
    }
    return adminData.name ? adminData.name.substring(0, 2).toUpperCase() : "AD";
  };

  const clearMessages = () => {
    setSuccessMessage("");
    setErrors({});
  };

  useEffect(() => {
    clearMessages();
  }, [activeTab]);

  if (isLoading && !adminData.name) {
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
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white shadow-lg overflow-hidden">
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
                  className={`absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-blue-600 transition-colors ${
                    avatarLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {avatarLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                  {adminData.first_name && adminData.last_name
                    ? `${adminData.first_name} ${adminData.last_name}`
                    : adminData.name || "Administrateur"}
                </h1>
                <p className="text-blue-100">{adminData.email}</p>
                <p className="text-blue-100 text-sm mt-1">Administrateur</p>
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
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Informations personnelles
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "border-blue-600 text-blue-600"
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
                  {["name", "first_name", "last_name", "email", "phone"].map(
                    (field) => (
                      <div
                        key={field}
                        className={field === "phone" ? "md:col-span-2" : ""}
                      >
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field === "name" && "Nom d'affichage *"}
                          {field === "first_name" && "Prénom"}
                          {field === "last_name" && "Nom"}
                          {field === "email" && "Email *"}
                          {field === "phone" && "Téléphone"}
                        </label>
                        <input
                          type={field === "email" ? "email" : "text"}
                          name={field}
                          value={adminData[field]}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[field] ? "border-red-300" : "border-gray-300"
                          } ${field === "email" ? "bg-gray-50" : ""}`}
                     
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
                    )
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      {field === "current_password" && "Mot de passe actuel"}
                      {field === "new_password" && "Nouveau mot de passe"}
                      {field === "new_password_confirmation" &&
                        "Confirmer le nouveau mot de passe"}
                    </label>
                    <input
                      type="password"
                      name={field}
                      value={adminData[field]}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[field] ? "border-red-300" : "border-gray-300"
                      }`}
                      required
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

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

export default AdminProfile;
