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
} from "lucide-react";

// Constantes
const tabs = [
  { id: "agents", label: "Agents", icon: <User className="w-4 h-4" /> },
  {
    id: "investigateurs",
    label: "Investigateurs",
    icon: <Search className="w-4 h-4" />,
  },
  {
    id: "administrateurs",
    label: "Administrateurs",
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: "roles",
    label: "Rôles et Permissions",
    icon: <Key className="w-4 h-4" />,
  },
];

const departements = ["DAAQ", "DRSE"];
const departementsInvestigateur = ["CAC", "DAJ"];
const departementsAdmin = ["DAAQ", "DRSE", "CAC", "DAJ"];

const STANDARD_ROLES = [
  { id: 1, name: "Admin", code: "admin" },
  { id: 2, name: "Agent", code: "agent" },
  { id: 3, name: "Investigateur", code: "investigateur" },
];

// Fonction utilitaire pour afficher le nom du rôle
const formatRoleName = (role) => {
  if (!role) return "Non défini";
  const r =
    typeof role === "string" ? role.toLowerCase() : role.code?.toLowerCase();
  const found = STANDARD_ROLES.find((sr) => sr.code === r);
  return found ? found.name : role;
};

// Fonction pour exporter en CSV
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
  ];

  const csvContent = [
    headers.join(","),
    ...users.map((user) =>
      [
        user.id,
        `"${user.first_name || ""}"`,
        `"${user.last_name || ""}"`,
        `"${user.email || ""}"`,
        `"${user.telephone || user.phone || ""}"`,
        `"${user.departement || ""}"`,
        `"${user.username || ""}"`,
        `"${user.role || ""}"`,
        `"${user.statut ? "Actif" : "Inactif"}"`,
        `"${(user.specialisations || []).join(", ") || ""}"`,
        `"${(user.responsabilites || []).join(", ") || ""}"`,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Composant indicateur force mot de passe
function PasswordStrengthIndicator({ password }) {
  const criteria = [
    { label: "8 caractères minimum", met: password.length >= 8 },
    { label: "Première lettre en majuscule", met: /^[A-Z]/.test(password) },
    { label: "Au moins un chiffre", met: /\d/.test(password) },
    {
      label: "Au moins un caractère spécial",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const allMet = criteria.every((criterion) => criterion.met);

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
              <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300"></div>
            )}
            <span
              className={`${
                criterion.met ? "text-green-700 font-medium" : "text-gray-500"
              }`}
            >
              {criterion.label}
            </span>
          </div>
        ))}
      </div>
      {allMet && (
        <div className="text-xs text-green-600 font-bold mt-1 flex items-center">
          <Shield className="w-3 h-3 mr-1" /> Mot de passe sécurisé
        </div>
      )}
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
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    departement: "",
    username: "",
    password: "",
    password_confirmation: "",
    role: "Agent",
    specialisations: [],
    responsabilites: [],
    adresse: "",
    statut: true,
  });

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    password_confirmation: "",
  });

  const [filters, setFilters] = useState({
    search: "",
    departement: "",
    statut: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === "roles") {
        setIsLoading(false);
        return;
      }

      const responseData = await UserService.getAllUsers();

      let usersList = [];
      if (Array.isArray(responseData)) {
        usersList = responseData;
      } else if (responseData?.users) {
        usersList = responseData.users;
      } else if (responseData?.data) {
        usersList = responseData.data;
      }

      setUsers(usersList);
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError("Impossible de charger les utilisateurs.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    let defaultDepartement = "";

    if (newRole === "Agent") {
      defaultDepartement = "DAAQ";
    } else if (newRole === "Investigateur") {
      defaultDepartement = "CAC";
    } else if (newRole === "Admin") {
      defaultDepartement = "DAAQ";
    }

    setFormData((prev) => ({
      ...prev,
      role: newRole,
      departement: defaultDepartement,
    }));
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
        e.target.value = "";
      }
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

    if (activeTab === "investigateurs") {
      defaultRole = "Investigateur";
      defaultDept = "CAC";
    }
    if (activeTab === "administrateurs") {
      defaultRole = "Admin";
      defaultDept = "DAAQ";
    }

    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      telephone: "",
      departement: defaultDept,
      username: "",
      password: "",
      password_confirmation: "",
      role: defaultRole,
      specialisations: [],
      responsabilites: [],
      adresse: "",
      statut: true,
    });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setSelectedUser(user);

    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      telephone: user.telephone || user.phone || "",
      departement: user.departement || "",
      username: user.username || "",
      password: "",
      password_confirmation: "",
      role: user.role || "Agent",
      specialisations: Array.isArray(user.specialisations)
        ? user.specialisations
        : [],
      responsabilites: Array.isArray(user.responsabilites)
        ? user.responsabilites
        : [],
      adresse: user.adresse || "",
      statut: user.statut !== undefined ? user.statut : true,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const openPasswordModal = (user) => {
    setPasswordUser(user);
    setPasswordForm({ password: "", password_confirmation: "" });
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
      alert("Le mot de passe est requis.");
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    if (passwordForm.password.length < 8) {
      alert("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      const payload = {
        new_password: passwordForm.password,
      };
      const result = await UserService.resetPassword(passwordUser.id, payload);
      if (result && result.success) {
        alert("Mot de passe mis à jour");
        closePasswordModal();
      }
    } catch (err) {
      const handled = UserService.handleError(err);
      alert(`Erreur: ${handled.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const action = e.nativeEvent.submitter?.dataset?.action || "info";

    try {
      let result;

      if (!isEditing) {
        if (!formData.password) {
          alert("Le mot de passe est requis pour la création");
          return;
        }
        if (formData.password !== formData.password_confirmation) {
          alert("Les mots de passe ne correspondent pas");
          return;
        }
        if (formData.password.length < 8) {
          alert("Le mot de passe doit contenir au moins 8 caractères");
          return;
        }
        const payload = { ...formData };
        result = await UserService.createUser(payload);

        if (result && (result.success || result.data)) {
          alert("Utilisateur créé avec succès");
          closeModal();
          fetchUsers();
        }
        return;
      }

      if (!selectedUser) {
        alert("Aucun utilisateur sélectionné");
        return;
      }

      if (action === "info") {
        const payload = { ...formData };
        delete payload.password;
        delete payload.password_confirmation;

        result = await UserService.updateUser(selectedUser.id, payload);

        if (result && (result.success || result.data)) {
          alert("Informations mises à jour avec succès");
          closeModal();
          fetchUsers();
        }
      }
    } catch (err) {
      const handled = UserService.handleError(err);
      alert(`Erreur: ${handled.message}`);
      if (handled.data?.errors) {
        console.table(handled.data.errors);
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await UserService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await UserService.toggleStatus(userId);
      fetchUsers();
    } catch (err) {
      alert("Erreur status update");
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchTerm = filters.search.toLowerCase();
    const fullName =
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.name ||
      "";

    let roleTarget = "agent";
    if (activeTab === "investigateurs") roleTarget = "investigateur";
    if (activeTab === "administrateurs") roleTarget = "admin";

    if (activeTab === "roles") return true;

    const rawRole =
      typeof user.role === "string" ? user.role : user.role?.code || "";
    const userRole = rawRole.toLowerCase();

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
      (filters.statut === "actif" && user.statut) ||
      (filters.statut === "inactif" && !user.statut);

    return matchRole && matchSearch && matchDepartement && matchStatut;
  });

  const getAvailableDepartements = () => {
    const role = formData.role;
    if (role === "Investigateur") {
      return departementsInvestigateur;
    } else if (role === "Agent") {
      return departements;
    } else if (role === "Admin") {
      return departementsAdmin;
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion d'Équipe
            </h1>
            <p className="text-gray-500 mt-1">
              Administration des accès et des rôles du personnel
            </p>
          </div>
          {activeTab !== "roles" && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </button>
          )}
        </div>

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
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "roles" ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-gray-400" />
              Définition des Rôles
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {STANDARD_ROLES.map((role) => (
                <div
                  key={role.id}
                  className="border rounded-xl p-5 hover:border-blue-300 transition-colors bg-gray-50/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{role.name}</h3>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {role.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Permissions et accès pour le niveau {role.name}.
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
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
                <div>
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
                    {activeTab === "investigateurs" &&
                      departementsInvestigateur.map((d) => (
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
                </div>
                <div>
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
                  {filteredUsers.length > 1 ? "s" : ""} trouvé
                  {filteredUsers.length > 1 ? "s" : ""}
                </div>
                <button
                  onClick={() =>
                    exportToCSV(filteredUsers, `equipe_${activeTab}`)
                  }
                  className="inline-flex items-center px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter CSV
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-10 text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => {
                          const displayName =
                            `${user.first_name || ""} ${
                              user.last_name || ""
                            }`.trim() ||
                            user.name ||
                            "Sans nom";
                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      @{user.username}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {user.email}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {user.telephone || user.phone || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {user.departement}
                                </div>
                                {user.specialisations &&
                                  user.specialisations.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {user.specialisations
                                        .slice(0, 2)
                                        .map((s, i) => (
                                          <span
                                            key={i}
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
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                ${
                                                                  user.role ===
                                                                  "Admin"
                                                                    ? "bg-purple-100 text-purple-800"
                                                                    : user.role ===
                                                                      "Investigateur"
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-blue-100 text-blue-800"
                                                                }`}
                                >
                                  {formatRoleName(user.role)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleStatus(user.id)}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors
                                                                    ${
                                                                      user.statut
                                                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                                                        : "bg-red-100 text-red-800 hover:bg-red-200"
                                                                    }`}
                                >
                                  {user.statut ? (
                                    <>
                                      <Power className="w-3 h-3 mr-1" /> Actif
                                    </>
                                  ) : (
                                    <>
                                      <PowerOff className="w-3 h-3 mr-1" />{" "}
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
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
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
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={closeModal}
              ></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                      {isEditing ? (
                        <Edit className="w-5 h-5 mr-2 text-orange-500" />
                      ) : (
                        <Plus className="w-5 h-5 mr-2 text-blue-600" />
                      )}
                      {isEditing
                        ? "Modifier l'Utilisateur"
                        : "Nouvel Utilisateur"}
                    </h3>
                    <button
                      onClick={closeModal}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tous les champs autres que mot de passe ici */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prénom *
                        </label>
                        <input
                          type="text"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Ex: Jean"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom *
                        </label>
                        <input
                          type="text"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          placeholder="Ex: Dupont"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="jean.dupont@fosika.mg"
                            required
                          />
                        </div>
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
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+261 3X XX XXX XX"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rôle *
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
                            <option value="Investigateur">Investigateur</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Département *
                        </label>
                        <div className="relative">
                          <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <select
                            name="departement"
                            value={formData.departement}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
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
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.role === "Agent" &&
                            "Départements: DAAQ, DRSE"}
                          {formData.role === "Investigateur" &&
                            "Départements: CAC, DAJ"}
                          {formData.role === "Admin" &&
                            "Départements: DAAQ, DRSE, CAC, DAJ"}
                        </p>
                      </div>
                    </div>

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
                            placeholder="Ajouter + Entrée..."
                            className="w-full outline-none text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Appuyez sur Entrée pour ajouter
                        </p>
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
                            placeholder="Ajouter + Entrée..."
                            className="w-full outline-none text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Ex: Fraude, Corruption...
                        </p>
                      </div>
                    </div>

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

                    {/* Champ mot de passe uniquement en création */}
                    {!isEditing && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Mot de passe *
                            </label>
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              placeholder="Minimum 8 caractères"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Confirmation
                            </label>
                            <input
                              type="password"
                              name="password_confirmation"
                              value={formData.password_confirmation}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border rounded-md text-sm"
                              placeholder="Répéter le mot de passe"
                            />
                          </div>
                        </div>
                        {formData.password && (
                          <PasswordStrengthIndicator
                            password={formData.password}
                          />
                        )}
                      </div>
                    )}

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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
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

        {passwordModalVisible && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={closePasswordModal}
              ></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nouveau mot de passe *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={passwordForm.password}
                        onChange={handlePasswordInputChange}
                        className="w-full mt-1 p-2 border rounded-md"
                        placeholder="Minimum 8 caractères"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Confirmation *
                      </label>
                      <input
                        type="password"
                        name="password_confirmation"
                        value={passwordForm.password_confirmation}
                        onChange={handlePasswordInputChange}
                        className="w-full mt-1 p-2 border rounded-md"
                        placeholder="Répéter le mot de passe"
                        required
                      />
                    </div>
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
                        className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
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
