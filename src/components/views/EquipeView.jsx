import React, { useState, useEffect } from "react";
import UserService from "../../services/userService";
import {
    Power,
    PowerOff,
    Search,
    Download,
    Plus,
    Edit,
    Trash2,
    User,
    Shield,
    Key,
    Phone,
    Mail,
    Building,
    AlertCircle,
    CheckCircle,
    X,
    Save,
    ArrowLeft,
    Eye,
    EyeOff,
} from "lucide-react";

// Constantes
const tabs = [
    { id: "agents", label: "Agents", icon: User, className: "w-4 h-4" },
    { id: "administrateurs", label: "Administrateurs", icon: Shield, className: "w-4 h-4" },
];

const departements = ["DAAQ", "DRSE"];
const departementsAdmin = ["DAAQ", "DRSE", "CAC", "DAJ", "Ministre"];

const STANDARD_ROLES = [
    { id: 1, name: "Admin", code: "admin" },
    { id: 2, name: "Agent", code: "agent" },
];

// Mapper formData vers format Laravel
const mapFormDataToPayload = (formData, includePassword = false) => ({
    first_name: formData.firstname,
    last_name: formData.lastname,
    email: formData.email,
    telephone: formData.telephone,
    departement: formData.departement,
    username: formData.username,
    ...(includePassword && {
        password: formData.password,
        password_confirmation: formData.passwordconfirmation,
    }),
    role: formData.role,
    specialisations: formData.specialisations,
    responsabilites: formData.responsabilites,
    adresse: formData.adresse,
    statut: formData.statut,
});

// Fonction utilitaire pour afficher le nom du rôle
const formatRoleName = (role) => {
    if (!role) return "Non défini";
    const r = typeof role === "string" ? role.toLowerCase() : role.code?.toLowerCase();
    const found = STANDARD_ROLES.find((sr) => sr.code === r);
    return found ? found.name : role;
};

// Export CSV
const exportToCSV = (users, filename) => {
    if (!users || users.length === 0) {
        alert("Aucune donnée à exporter");
        return;
    }

    const headers = [
        "ID",
        "Prénom",
        "Nom",
        "Email",
        "Téléphone",
        "Département",
        "Nom d'Utilisateur",
        "Rôle",
        "Statut",
        "Spécialisations",
        "Responsabilités",
        "Adresse"
    ];

    const csvContent = [
        headers.join(","),
        ...users.map((user) =>
            [
                user.id,
                user.firstname || user.first_name || "",
                user.lastname || user.last_name || "",
                user.email || "",
                user.telephone || user.phone || "",
                user.departement || "",
                user.username || "",
                formatRoleName(user.role),
                user.statut ? "Actif" : "Inactif",
                Array.isArray(user.specialisations) ? user.specialisations.join(", ") : "",
                Array.isArray(user.responsabilites) ? user.responsabilites.join(", ") : "",
                user.adresse || ""
            ].join(","),
        ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Indicateur de force du mot de passe
function PasswordStrengthIndicator({ password, errors = {} }) {
    const criteria = [
        { label: "8 caractères minimum", met: password.length >= 8 },
        { label: "Première lettre en majuscule", met: /[A-Z]/.test(password) },
        { label: "Au moins un chiffre", met: /\d/.test(password) },
        { label: "Au moins un caractère spécial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    const allMet = criteria.every((c) => c.met);

    return (
        <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sécurité du mot de passe
            </div>
            <div className="grid grid-cols-1 gap-1">
                {criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        {criterion.met ? (
                            <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                                ✓
                            </div>
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300" />
                        )}
                        <span className={criterion.met ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
              {criterion.label}
            </span>
                    </div>
                ))}
            </div>
            {errors.password && (
                <div className="text-xs text-red-600 font-medium mt-1">
                    {errors.password}
                </div>
            )}
            {allMet && (
                <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
                    <Shield className="w-3 h-3 mr-1" />
                    Mot de passe sécurisé
                </div>
            )}
        </div>
    );
}

// Composant Toast pour afficher les messages normaux (en haut à droite)
function ToastNotification({ message, type = "error", show, onClose }) {
    const getTypeStyles = () => {
        switch (type) {
            case "success":
                return "border-green-500";
            case "warning":
                return "border-yellow-500";
            case "info":
                return "border-blue-500";
            case "error":
            default:
                return "border-red-500";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return (
                    <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case "warning":
                return (
                    <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                );
            case "info":
                return (
                    <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case "error":
            default:
                return (
                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    return (
        <div
            className={`fixed top-5 right-5 z-[9999] transition-all duration-500 transform ${
                show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
        >
            <div className={`bg-white border-l-4 ${getTypeStyles()} rounded shadow-2xl p-4 w-80 flex items-start`}>
                <div className="flex-shrink-0">
                    {getIcon()}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-bold text-gray-900 leading-5">
                        {type === "success" ? "Succès" :
                            type === "warning" ? "Avertissement" :
                                type === "info" ? "Information" : "Erreur"}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-gray-600">
                        {message}
                    </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={onClose}
                        className="inline-flex text-gray-400 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 10 5.707 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Composant ConfirmationModal pour les confirmations (au centre)
function ConfirmationModal({ show, title, message, onConfirm, onCancel, confirmText = "Confirmer", cancelText = "Annuler" }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    aria-hidden="true"
                    onClick={onCancel}
                />
                <span
                    className="hidden sm:inline-block sm:align-middle sm:h-screen"
                    aria-hidden="true"
                >
                    &#8203;
                </span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const EquipeView = () => {
    const [activeTab, setActiveTab] = useState("agents");
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [formData, setFormData] = useState({
        lastname: "",
        firstname: "",
        email: "",
        telephone: "",
        departement: "",
        username: "",
        password: "",
        passwordconfirmation: "",
        role: "Agent",
        specialisations: [],
        responsabilites: [],
        adresse: "",
        statut: true,
    });

    const [formErrors, setFormErrors] = useState({});

    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        password: "",
        passwordconfirmation: "",
    });

    const [filters, setFilters] = useState({
        search: "",
        departement: "",
        statut: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPasswordModalPassword, setShowPasswordModalPassword] = useState(false);
    const [showPasswordModalConfirm, setShowPasswordModalConfirm] = useState(false);

    // États pour les toasts normaux
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "error" // error, success, warning, info
    });

    // États pour la confirmation de suppression
    const [confirmationModal, setConfirmationModal] = useState({
        show: false,
        title: "",
        message: "",
        userId: null,
        action: null, // 'delete', 'toggleStatus', etc.
    });

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    // Fonction pour afficher un toast normal (en haut à droite)
    const showToastMessage = (message, type = "error") => {
        setToast({
            show: true,
            message,
            type
        });

        // Masquer automatiquement après 5 secondes
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    // Fonction pour afficher une confirmation (au centre)
    const showConfirmationModal = (title, message, userId, action) => {
        setConfirmationModal({
            show: true,
            title,
            message,
            userId,
            action
        });
    };

    // Fonction pour fermer la confirmation
    const closeConfirmationModal = () => {
        setConfirmationModal({
            show: false,
            title: "",
            message: "",
            userId: null,
            action: null,
        });
    };

    // Fonction pour gérer la confirmation
    const handleConfirmation = async () => {
        const { userId, action } = confirmationModal;

        if (!userId) {
            closeConfirmationModal();
            return;
        }

        try {
            if (action === 'delete') {
                await UserService.deleteUser(userId);
                showToastMessage("Utilisateur supprimé avec succès", "success");
                fetchUsers();
            } else if (action === 'toggleStatus') {
                await UserService.toggleStatus(userId);
                showToastMessage("Statut utilisateur mis à jour", "success");
                fetchUsers();
            }
        } catch (err) {
            const actionMessage = action === 'delete' ? "lors de la suppression" : "lors de la mise à jour du statut";
            showToastMessage(`Erreur ${actionMessage}`, "error");
        }

        closeConfirmationModal();
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const responseData = await UserService.getAllUsers();
            let usersList = [];
            if (Array.isArray(responseData)) usersList = responseData;
            else if (responseData?.users) usersList = responseData.users;
            else if (responseData?.data) usersList = responseData.data;

            // Normaliser les données des utilisateurs
            const normalizedUsers = usersList.map(user => ({
                id: user.id,
                firstname: user.firstname || user.first_name || "",
                lastname: user.lastname || user.last_name || "",
                email: user.email || "",
                telephone: user.telephone || user.phone || "",
                departement: user.departement || "",
                username: user.username || "",
                role: user.role || "Agent",
                specialisations: Array.isArray(user.specialisations) ? user.specialisations :
                    (user.specialisations ? [user.specialisations] : []),
                responsabilites: Array.isArray(user.responsabilites) ? user.responsabilites :
                    (user.responsabilites ? [user.responsabilites] : []),
                adresse: user.adresse || "",
                statut: user.statut !== undefined ? user.statut : true,
            }));

            setUsers(normalizedUsers || []);
        } catch (err) {
            console.error("Erreur chargement", err);
            setError("Impossible de charger les utilisateurs.");
            showToastMessage("Impossible de charger les utilisateurs.", "error");
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const validateField = (name, value) => {
        const errors = {};

        switch (name) {
            case 'lastname':
                if (!value.trim()) errors.lastname = "Le nom est requis";
                break;
            case 'firstname':
                if (!value.trim()) errors.firstname = "Le prénom est requis";
                break;
            case 'email':
                if (!value.trim()) {
                    errors.email = "L'email est requis";
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    errors.email = "Format d'email invalide";
                }
                break;
            case 'telephone':
                if (value && !/^\+?[0-9\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
                    errors.telephone = "Numéro de téléphone invalide (chiffres uniquement)";
                }
                break;
            case 'username':
                if (!value.trim()) errors.username = "Le nom d'utilisateur est requis";
                break;
            case 'departement':
                if (!value) errors.departement = "Le département est requis";
                break;
            case 'password':
                if (!value) {
                    errors.password = "Le mot de passe est requis";
                } else {
                    if (value.length < 8) errors.password = "8 caractères minimum";
                    else if (!/[A-Z]/.test(value)) errors.password = "Première lettre en majuscule";
                    else if (!/\d/.test(value)) errors.password = "Au moins un chiffre";
                    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.password = "Au moins un caractère spécial";
                }
                break;
            case 'passwordconfirmation':
                if (formData.password && value !== formData.password) {
                    errors.passwordconfirmation = "Les mots de passe ne correspondent pas";
                }
                break;
        }

        return errors;
    };

    const validateAllFields = () => {
        const errors = {};

        // Valider chaque champ
        Object.keys(formData).forEach(key => {
            if (key !== 'specialisations' && key !== 'responsabilites' && key !== 'adresse' && key !== 'statut') {
                const fieldErrors = validateField(key, formData[key]);
                if (fieldErrors[key]) {
                    errors[key] = fieldErrors[key];
                }
            }
        });

        // Validation spécifique pour l'édition
        if (isEditing) {
            delete errors.password;
            delete errors.passwordconfirmation;
        }

        return errors;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validation pour le téléphone (chiffres uniquement)
        let processedValue = value;
        if (name === 'telephone') {
            // Autoriser uniquement les chiffres, +, espaces et tirets
            processedValue = value.replace(/[^\d\+\s\-]/g, '');
        }

        setFormData((prev) => ({ ...prev, [name]: processedValue }));

        // Validation en temps réel
        const fieldErrors = validateField(name, processedValue);
        setFormErrors(prev => ({
            ...prev,
            [name]: fieldErrors[name]
        }));
    };

    const handleRoleChange = (e) => {
        const newRole = e.target.value;
        let defaultDepartement = "";
        if (newRole === "Agent") defaultDepartement = "DAAQ";
        else if (newRole === "Admin") defaultDepartement = "DAAQ";

        setFormData((prev) => ({
            ...prev,
            role: newRole,
            departement: defaultDepartement,
        }));

        // Valider le département après le changement
        const errors = validateField('departement', defaultDepartement);
        setFormErrors(prev => ({ ...prev, departement: errors.departement }));
    };

    const handleArrayInputKeyDown = (e, field) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const value = e.target.value.trim();
            if (value && !formData[field].includes(value)) {
                setFormData((prev) => ({
                    ...prev,
                    [field]: [...prev[field], value],
                }));
            }
            e.target.value = "";
        }
    };

    const removeArrayItem = (field, index) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setSelectedUser(null);

        let defaultRole = "Agent";
        let defaultDept = "DAAQ";
        if (activeTab === "administrateurs") {
            defaultRole = "Admin";
            defaultDept = "DAAQ";
        }

        setFormData({
            lastname: "",
            firstname: "",
            email: "",
            telephone: "",
            departement: defaultDept,
            username: "",
            password: "",
            passwordconfirmation: "",
            role: defaultRole,
            specialisations: [],
            responsabilites: [],
            adresse: "",
            statut: true,
        });

        setFormErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setIsEditing(true);
        setSelectedUser(user);
        setFormData({
            lastname: user.lastname || "",
            firstname: user.firstname || "",
            email: user.email || "",
            telephone: user.telephone || "",
            departement: user.departement || "",
            username: user.username || "",
            password: "",
            passwordconfirmation: "",
            role: user.role || "Agent",
            specialisations: Array.isArray(user.specialisations) ? user.specialisations :
                (user.specialisations ? [user.specialisations] : []),
            responsabilites: Array.isArray(user.responsabilites) ? user.responsabilites :
                (user.responsabilites ? [user.responsabilites] : []),
            adresse: user.adresse || "",
            statut: user.statut !== undefined ? user.statut : true,
        });

        setFormErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormErrors({});
    };

    const openPasswordModal = (user) => {
        setPasswordUser(user);
        setPasswordForm({ password: "", passwordconfirmation: "" });
        setShowPasswordModalPassword(false);
        setShowPasswordModalConfirm(false);
        setPasswordModalVisible(true);
    };

    const closePasswordModal = () => {
        setPasswordModalVisible(false);
        setPasswordUser(null);
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!passwordUser) return;

        if (!passwordForm.password) {
            showToastMessage("Le mot de passe est requis.", "error");
            return;
        }
        if (passwordForm.password !== passwordForm.passwordconfirmation) {
            showToastMessage("Les mots de passe ne correspondent pas.", "error");
            return;
        }

        // Validation des critères de mot de passe
        if (passwordForm.password.length < 8) {
            showToastMessage("Le mot de passe doit contenir au moins 8 caractères.", "error");
            return;
        }
        if (!/[A-Z]/.test(passwordForm.password)) {
            showToastMessage("Le mot de passe doit commencer par une majuscule.", "error");
            return;
        }
        if (!/\d/.test(passwordForm.password)) {
            showToastMessage("Le mot de passe doit contenir au moins un chiffre.", "error");
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.password)) {
            showToastMessage("Le mot de passe doit contenir au moins un caractère spécial.", "error");
            return;
        }

        try {
            // CORRECTION : Utiliser le payload correct selon l'erreur
            const payload = {
                new_password: passwordForm.password,
                password_confirmation: passwordForm.passwordconfirmation
            };

            const result = await UserService.resetPassword(passwordUser.id, payload);
            if (result && result.success) {
                showToastMessage("Mot de passe mis à jour avec succès", "success");
                closePasswordModal();
            } else {
                showToastMessage(result?.message || "Erreur lors de la mise à jour du mot de passe", "error");
            }
        } catch (err) {
            const handled = UserService.handleError(err);
            // Message spécifique pour l'erreur de champ requis
            if (handled.message.includes("new password field is required")) {
                showToastMessage("Le champ 'nouveau mot de passe' est requis.", "error");
            } else {
                showToastMessage(`Erreur: ${handled.message}`, "error");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const action = e.nativeEvent.submitter?.dataset?.action;

        // Validation complète avant soumission
        const validationErrors = validateAllFields();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            showToastMessage("Veuillez corriger les erreurs dans le formulaire.", "error");
            return;
        }

        try {
            let result;

            if (!isEditing) {
                const payload = mapFormDataToPayload(formData, true);
                result = await UserService.createUser(payload);
                if (result && result.success) {
                    showToastMessage("Compte utilisateur créé avec succès", "success");
                    closeModal();
                    fetchUsers();
                    return;
                } else {
                    showToastMessage(result?.message || "Erreur lors de la création de l'utilisateur", "error");
                }
            }

            if (!selectedUser) {
                showToastMessage("Aucun utilisateur sélectionné", "error");
                return;
            }

            if (action === "info") {
                const payload = mapFormDataToPayload(formData, false);
                result = await UserService.updateUser(selectedUser.id, payload);
                if (result && result.success) {
                    showToastMessage("Informations mises à jour avec succès", "success");
                    closeModal();
                    fetchUsers();
                } else {
                    showToastMessage(result?.message || "Erreur lors de la mise à jour", "error");
                }
            }
        } catch (err) {
            const handled = UserService.handleError(err);
            const errorMessage = handled.message || "Une erreur est survenue";

            // Messages spécifiques pour les erreurs courantes
            if (errorMessage.includes("email has already been taken") || errorMessage.includes("L'email est déjà utilisé")) {
                showToastMessage("Erreur: L'email est déjà utilisé", "error");
            } else if (errorMessage.includes("password confirmation") || errorMessage.includes("Les mots de passe ne correspondent pas")) {
                showToastMessage("Les mots de passe ne correspondent pas.", "error");
            } else {
                showToastMessage(`Erreur: ${errorMessage}`, "error");
            }

            if (handled.data?.errors) {
                console.table(handled.data.errors);
            }
        }
    };

    const handleDeleteUser = (userId) => {
        showConfirmationModal(
            "Supprimer cet utilisateur ?",
            "Cette action est irréversible. L'utilisateur sera définitivement supprimé.",
            userId,
            'delete'
        );
    };

    const handleToggleStatus = (userId) => {
        const user = users.find(u => u.id === userId);
        const newStatus = user ? !user.statut : false;
        const statusText = newStatus ? "activer" : "désactiver";

        showConfirmationModal(
            "Changer le statut de l'utilisateur",
            `Êtes-vous sûr de vouloir ${statusText} cet utilisateur ?`,
            userId,
            'toggleStatus'
        );
    };

    const filteredUsers = users.filter((user) => {
        const searchTerm = filters.search.toLowerCase();
        const fullName = `${user.lastname || ""} ${user.firstname || ""}`.trim();
        let roleTarget = "agent";
        if (activeTab === "administrateurs") roleTarget = "admin";

        const rawRole = typeof user.role === "string" ? user.role : user.role?.code;
        const userRole = (rawRole || "").toLowerCase();

        const matchRole = userRole === roleTarget;
        const matchSearch =
            !filters.search ||
            fullName.toLowerCase().includes(searchTerm) ||
            (user.email || "").toLowerCase().includes(searchTerm) ||
            (user.username || "").toLowerCase().includes(searchTerm);

        const matchDepartement =
            !filters.departement || user.departement === filters.departement;

        const matchStatut =
            !filters.statut ||
            (filters.statut === "actif" ? user.statut : !user.statut);

        return matchRole && matchSearch && matchDepartement && matchStatut;
    });

    const getAvailableDepartements = () => {
        const role = formData.role;
        if (role === "Agent") return departements;
        if (role === "Admin") return departementsAdmin;
        return [];
    };

    // Vérifier si le formulaire est valide
    const isFormValid = () => {
        const requiredFields = ['lastname', 'firstname', 'email', 'departement', 'username'];
        if (!isEditing) {
            requiredFields.push('password', 'passwordconfirmation');
        }

        // Vérifier si tous les champs requis sont remplis
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].toString().trim() === '') {
                return false;
            }
        }

        // Vérifier les erreurs de validation
        const validationErrors = validateAllFields();
        return Object.keys(validationErrors).length === 0;
    };

    // Indicateur de force du mot de passe pour le modal de changement de mot de passe
    function PasswordModalStrengthIndicator({ password }) {
        const criteria = [
            { label: "8 caractères minimum", met: password.length >= 8 },
            { label: "Première lettre en majuscule", met: /[A-Z]/.test(password) },
            { label: "Au moins un chiffre", met: /\d/.test(password) },
            { label: "Au moins un caractère spécial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
        ];

        const allMet = criteria.every((c) => c.met);

        return (
            <div className="space-y-2 mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sécurité du mot de passe
                </div>
                <div className="grid grid-cols-1 gap-1">
                    {criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            {criterion.met ? (
                                <div className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">
                                    ✓
                                </div>
                            ) : (
                                <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300" />
                            )}
                            <span className={criterion.met ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                                {criterion.label}
                            </span>
                        </div>
                    ))}
                </div>
                {allMet && (
                    <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Mot de passe sécurisé
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6">
            {/* Toast Notification normal (en haut à droite) */}
            <ToastNotification
                message={toast.message}
                type={toast.type}
                show={toast.show}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />

            {/* Confirmation Modal (au centre) */}
            <ConfirmationModal
                show={confirmationModal.show}
                title={confirmationModal.title}
                message={confirmationModal.message}
                onConfirm={handleConfirmation}
                onCancel={closeConfirmationModal}
                confirmText="Confirmer"
                cancelText="Annuler"
            />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestion d'équipe</h1>
                        <p className="text-gray-500 mt-1">
                            Administration des accès et des rôles du personnel
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvel utilisateur
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                    <div className="flex space-x-1 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <tab.icon className={`mr-2 ${tab.className}`} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtres */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher un membre..."
                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={filters.search}
                                        onChange={(e) =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                search: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                            <select
                                value={filters.departement}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        departement: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Tous les départements</option>
                                {activeTab === "agents" &&
                                    departements.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                {activeTab === "administrateurs" &&
                                    departementsAdmin.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                            </select>
                            <select
                                value={filters.statut}
                                onChange={(e) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        statut: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="actif">Actifs uniquement</option>
                                <option value="inactif">Inactifs uniquement</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                            {filteredUsers.length} résultat
                            {filteredUsers.length !== 1 ? "s" : ""} trouvé
                            {filteredUsers.length !== 1 ? "s" : ""}
                        </div>
                        <button
                            onClick={() => exportToCSV(filteredUsers, `equipe-${activeTab}`)}
                            className="inline-flex items-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exporter CSV
                        </button>
                    </div>
                </div>

                {/* Tableau */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-10 text-center text-gray-500">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            <p className="mt-2">Chargement des données...</p>
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Utilisateur
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Poste
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rôle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Statut
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="w-10 h-10 text-gray-300 mb-2" />
                                                <p>Aucun utilisateur trouvé</p>
                                                <p className="text-sm text-gray-400">
                                                    Essayez de modifier vos filtres de recherche.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const displayName = user.lastname || user.firstname
                                            ? `${user.lastname || ""} ${user.firstname || ""}`.trim()
                                            : "Sans nom...";
                                        const initials = displayName !== "Sans nom..."
                                            ? displayName.charAt(0).toUpperCase()
                                            : "?";

                                        return (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {user.id}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                                            {initials}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {displayName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {user.username || "Aucun username"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {user.email || "Aucun email"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {user.telephone || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {user.departement || "Non défini"}
                                                    </div>
                                                    <div className="mt-1 space-y-1">
                                                        {/* Responsabilités */}
                                                        {user.responsabilites && user.responsabilites.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.responsabilites
                                                                    .slice(0, 2)
                                                                    .map((r, i) => (
                                                                        <span
                                                                            key={`resp-${i}`}
                                                                            className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full"
                                                                        >
                                                                            {r}
                                                                        </span>
                                                                    ))}
                                                                {user.responsabilites.length > 2 && (
                                                                    <span className="text-xs text-gray-400">
                                                                        +{user.responsabilites.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* Spécialisations */}
                                                        {user.specialisations && user.specialisations.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.specialisations
                                                                    .slice(0, 2)
                                                                    .map((s, i) => (
                                                                        <span
                                                                            key={`spec-${i}`}
                                                                            className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full"
                                                                        >
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                {user.specialisations.length > 2 && (
                                                                    <span className="text-xs text-gray-400">
                                                                        +{user.specialisations.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === "Admin"
                                            ? "bg-purple-100 text-purple-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {formatRoleName(user.role)}
                                </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleToggleStatus(user.id)}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                                            user.statut
                                                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                                : "bg-red-100 text-red-800 hover:bg-red-200"
                                                        }`}
                                                    >
                                                        {user.statut ? (
                                                            <>
                                                                <Power className="w-3 h-3 mr-1" />
                                                                Actif
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PowerOff className="w-3 h-3 mr-1" />
                                                                Inactif
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(user)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                                                            title="Modifier l'utilisateur"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => openPasswordModal(user)}
                                                            className="text-orange-400 hover:text-orange-600 p-1 hover:bg-orange-50 rounded"
                                                            title="Modifier le mot de passe"
                                                        >
                                                            <Key className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                                            title="Supprimer l'utilisateur"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal création / édition */}
                {showModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                aria-hidden="true"
                                onClick={closeModal}
                            />
                            <span
                                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true"
                            >
                &#8203;
              </span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                                            {isEditing ? (
                                                <>
                                                    <Edit className="w-5 h-5 mr-2 text-orange-500" />
                                                    Modifier l'Utilisateur
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-5 h-5 mr-2 text-blue-600" />
                                                    Nouvel Utilisateur
                                                </>
                                            )}
                                        </h3>
                                        <button
                                            onClick={closeModal}
                                            className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Nom / Prénom */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nom <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="lastname"
                                                    value={formData.lastname}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                        formErrors.lastname ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Ex: Dupont"
                                                    required
                                                />
                                                {formErrors.lastname && (
                                                    <p className="text-xs text-red-600 mt-1">{formErrors.lastname}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Prénom <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="firstname"
                                                    value={formData.firstname}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                                                        formErrors.firstname ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="ex: Jean"
                                                    required
                                                />
                                                {formErrors.firstname && (
                                                    <p className="text-xs text-red-600 mt-1">{formErrors.firstname}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Email / Téléphone */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                                                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                        placeholder="jean.dupont@fosika.mg"
                                                        required
                                                    />
                                                </div>
                                                {formErrors.email && (
                                                    <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Téléphone
                                                </label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        name="telephone"
                                                        value={formData.telephone}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                                                            formErrors.telephone ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                        placeholder="+261 3X XX XXX XX"
                                                    />
                                                </div>
                                                {formErrors.telephone && (
                                                    <p className="text-xs text-red-600 mt-1">{formErrors.telephone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Username */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nom d'utilisateur <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-400 ${
                                                        formErrors.username ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                                    placeholder="Ex: jdupont"
                                                    required={!isEditing}
                                                />
                                            </div>
                                            {formErrors.username && (
                                                <p className="text-xs text-red-600 mt-1">{formErrors.username}</p>
                                            )}
                                        </div>

                                        {/* Rôle / Département */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Rôle <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <select
                                                        name="role"
                                                        value={formData.role}
                                                        onChange={handleRoleChange}
                                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                                                    >
                                                        <option value="Agent">Agent</option>
                                                        <option value="Admin">Admin</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Département <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                                    <select
                                                        name="departement"
                                                        value={formData.departement}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white ${
                                                            formErrors.departement ? 'border-red-500' : 'border-gray-300'
                                                        }`}
                                                        required
                                                    >
                                                        <option value="">Sélectionner...</option>
                                                        {getAvailableDepartements().map((dept) => (
                                                            <option key={dept} value={dept}>
                                                                {dept}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {formErrors.departement && (
                                                    <p className="text-xs text-red-600 mt-1">{formErrors.departement}</p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formData.role === "Agent" && "Départements: DAAQ, DRSE"}
                                                    {formData.role === "Admin" &&
                                                        "Départements: DAAQ, DRSE, CAC, DAJ, Ministre"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Responsabilités / Spécialisations */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Responsabilités
                                                </label>
                                                <div className="border rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {formData.responsabilites.map((item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center"
                                                            >
                                {item}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeArrayItem("responsabilites", idx)
                                                                    }
                                                                    className="ml-1 hover:text-blue-900"
                                                                >
                                  ×
                                </button>
                              </span>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        onKeyDown={(e) =>
                                                            handleArrayInputKeyDown(e, "responsabilites")
                                                        }
                                                        placeholder="Ajouter (Entrée...)"
                                                        className="w-full outline-none text-sm"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Appuyez sur Entrée pour ajouter
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Spécialisations
                                                </label>
                                                <div className="border rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                                                    <div className="flex flex-wrap gap-2 mb-2">
                                                        {formData.specialisations.map((item, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center"
                                                            >
                                {item}
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeArrayItem("specialisations", idx)
                                                                    }
                                                                    className="ml-1 hover:text-purple-900"
                                                                >
                                  ×
                                </button>
                              </span>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        onKeyDown={(e) =>
                                                            handleArrayInputKeyDown(e, "specialisations")
                                                        }
                                                        placeholder="Ajouter (Entrée...)"
                                                        className="w-full outline-none text-sm"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Ex: Fraude, Corruption...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Adresse */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Adresse
                                            </label>
                                            <input
                                                type="text"
                                                name="adresse"
                                                value={formData.adresse}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Adresse physique..."
                                            />
                                        </div>

                                        {/* Mot de passe (création uniquement) */}
                                        {!isEditing && (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="relative">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                                            Mot de passe <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            name="password"
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-3 py-2 border rounded-md text-sm pr-10 placeholder:text-gray-400 ${
                                                                formErrors.password ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                            placeholder="Créer un mot de passe"
                                                            required
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute right-3 top-9 h-4 w-4 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                                            Confirmation <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="passwordconfirmation"
                                                            value={formData.passwordconfirmation}
                                                            onChange={handleInputChange}
                                                            className={`w-full px-3 py-2 border rounded-md text-sm pr-10 placeholder:text-gray-400 ${
                                                                formErrors.passwordconfirmation ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                            placeholder="Répéter le mot de passe"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowConfirmPassword(!showConfirmPassword)
                                                            }
                                                            className="absolute right-3 top-9 h-4 w-4 text-gray-400 hover:text-gray-600"
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff size={16} />
                                                            ) : (
                                                                <Eye size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                {formData.password && (
                                                    <PasswordStrengthIndicator
                                                        password={formData.password}
                                                        errors={formErrors}
                                                    />
                                                )}
                                                {formErrors.passwordconfirmation && (
                                                    <p className="text-xs text-red-600 mt-2">
                                                        {formErrors.passwordconfirmation}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t mt-6">
                                            <button
                                                type="button"
                                                onClick={closeModal}
                                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                data-action={isEditing ? "info" : "create"}
                                                className={`px-6 py-2 rounded-lg transition-colors flex items-center shadow-sm ${
                                                    isFormValid()
                                                        ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                                disabled={!isFormValid()}
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {isEditing ? "Mettre à jour" : "Enregistrer"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal mot de passe seul */}
                {passwordModalVisible && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                aria-hidden="true"
                                onClick={closePasswordModal}
                            />
                            <span
                                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                                aria-hidden="true"
                            >
                &#8203;
              </span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex justify-between items-center mb-4 border-b pb-3">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Modifier le mot de passe
                                        </h3>
                                        <button
                                            onClick={closePasswordModal}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nouveau mot de passe <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type={showPasswordModalPassword ? "text" : "password"}
                                                name="password"
                                                value={passwordForm.password}
                                                onChange={handlePasswordInputChange}
                                                className="w-full mt-1 p-2 border rounded-md pr-10"
                                                placeholder="Minimum 8 caractères, Majuscule, Chiffre, Caractère spécial"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordModalPassword(!showPasswordModalPassword)}
                                                className="absolute right-3 top-10 h-4 w-4 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswordModalPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Confirmation <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type={showPasswordModalConfirm ? "text" : "password"}
                                                name="passwordconfirmation"
                                                value={passwordForm.passwordconfirmation}
                                                onChange={handlePasswordInputChange}
                                                className="w-full mt-1 p-2 border rounded-md pr-10"
                                                placeholder="Répéter le mot de passe"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordModalConfirm(!showPasswordModalConfirm)}
                                                className="absolute right-3 top-10 h-4 w-4 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPasswordModalConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        {/* Indicateur de force du mot de passe */}
                                        {passwordForm.password && (
                                            <PasswordModalStrengthIndicator password={passwordForm.password} />
                                        )}

                                        <div className="flex justify-end gap-3 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={closePasswordModal}
                                                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Enregistrer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EquipeView;