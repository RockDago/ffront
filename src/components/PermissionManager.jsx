import React, { useState, useEffect } from "react";
import API from "../config/axios";

const PermissionManager = ({ userRole }) => {
    const [permissions, setPermissions] = useState({
        admin: [],
        agent: [],
        investigateur: [],
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Permissions disponibles
    const allPermissions = [
        // Permissions admin
        { key: 'dashboard.view', label: 'Voir le tableau de bord', category: 'dashboard' },
        { key: 'users.manage', label: 'Gérer les utilisateurs', category: 'users' },
        { key: 'users.view', label: 'Voir les utilisateurs', category: 'users' },
        { key: 'users.create', label: 'Créer des utilisateurs', category: 'users' },
        { key: 'users.edit', label: 'Modifier les utilisateurs', category: 'users' },
        { key: 'users.delete', label: 'Supprimer des utilisateurs', category: 'users' },
        { key: 'reports.manage', label: 'Gérer les signalements', category: 'reports' },
        { key: 'reports.view_all', label: 'Voir tous les signalements', category: 'reports' },
        { key: 'reports.create', label: 'Créer des signalements', category: 'reports' },
        { key: 'reports.edit', label: 'Modifier les signalements', category: 'reports' },
        { key: 'reports.delete', label: 'Supprimer des signalements', category: 'reports' },
        { key: 'reports.assign', label: 'Assigner des signalements', category: 'reports' },
        { key: 'analytics.view', label: 'Voir les analyses', category: 'analytics' },
        { key: 'settings.manage', label: 'Gérer les paramètres', category: 'settings' },
        { key: 'audit.view', label: 'Voir le journal d\'audit', category: 'audit' },
        { key: 'notifications.manage', label: 'Gérer les notifications', category: 'notifications' },

        // Permissions agent
        { key: 'reports.view_assigned', label: 'Voir les signalements assignés', category: 'reports' },
        { key: 'reports.update_assigned', label: 'Mettre à jour les signalements assignés', category: 'reports' },
        { key: 'files.upload', label: 'Uploader des fichiers', category: 'files' },
        { key: 'profile.view', label: 'Voir le profil', category: 'profile' },
        { key: 'profile.edit', label: 'Modifier le profil', category: 'profile' },
        { key: 'notifications.view', label: 'Voir les notifications', category: 'notifications' },

        // Permissions investigateur
        { key: 'investigations.manage', label: 'Gérer les investigations', category: 'investigations' },
        { key: 'investigations.update_status', label: 'Mettre à jour le statut des investigations', category: 'investigations' },
        { key: 'investigations.add_notes', label: 'Ajouter des notes d\'investigation', category: 'investigations' },
    ];

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce((groups, permission) => {
        if (!groups[permission.category]) {
            groups[permission.category] = [];
        }
        groups[permission.category].push(permission);
        return groups;
    }, {});

    // Load current permissions
    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            // Simuler le chargement des permissions
            // En production, vous récupéreriez cela depuis l'API
            const defaultPermissions = {
                admin: [
                    'dashboard.view',
                    'users.manage',
                    'users.view',
                    'users.create',
                    'users.edit',
                    'users.delete',
                    'reports.manage',
                    'reports.view_all',
                    'reports.create',
                    'reports.edit',
                    'reports.delete',
                    'reports.assign',
                    'analytics.view',
                    'settings.manage',
                    'audit.view',
                    'notifications.manage'
                ],
                agent: [
                    'dashboard.view',
                    'reports.view_assigned',
                    'reports.create',
                    'reports.update_assigned',
                    'files.upload',
                    'profile.view',
                    'profile.edit',
                    'notifications.view'
                ],
                investigateur: [
                    'dashboard.view',
                    'reports.view_assigned',
                    'investigations.manage',
                    'investigations.update_status',
                    'investigations.add_notes',
                    'files.upload',
                    'profile.view',
                    'profile.edit',
                    'notifications.view'
                ]
            };
            setPermissions(defaultPermissions);
        } catch (error) {
            console.error('Erreur chargement permissions:', error);
            setMessage({ type: 'error', text: 'Erreur lors du chargement des permissions' });
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (role, permissionKey) => {
        setPermissions(prev => {
            const rolePermissions = [...prev[role]];
            const index = rolePermissions.indexOf(permissionKey);

            if (index > -1) {
                rolePermissions.splice(index, 1);
            } else {
                rolePermissions.push(permissionKey);
            }

            return {
                ...prev,
                [role]: rolePermissions
            };
        });
    };

    const savePermissions = async () => {
        if (!userRole || userRole !== 'admin') {
            setMessage({ type: 'error', text: 'Seuls les administrateurs peuvent modifier les permissions' });
            return;
        }

        setSaving(true);
        try {
            // Simuler sauvegarde
            // En production, vous enverriez à l'API
            await new Promise(resolve => setTimeout(resolve, 1000));

            setMessage({ type: 'success', text: 'Permissions mises à jour avec succès' });

            // Effacer le message après 3 secondes
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Erreur sauvegarde permissions:', error);
            setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des permissions' });
        } finally {
            setSaving(false);
        }
    };

    const getRoleLabel = (role) => {
        const labels = {
            admin: 'Administrateur',
            agent: 'Agent',
            investigateur: 'Investigateur'
        };
        return labels[role] || role;
    };

    const getRoleColor = (role) => {
        switch(role) {
            case 'admin': return 'border-blue-200 bg-blue-50';
            case 'agent': return 'border-green-200 bg-green-50';
            case 'investigateur': return 'border-purple-200 bg-purple-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getRoleTextColor = (role) => {
        switch(role) {
            case 'admin': return 'text-blue-700';
            case 'agent': return 'text-green-700';
            case 'investigateur': return 'text-purple-700';
            default: return 'text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (userRole !== 'admin') {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-red-800 mb-2">Accès non autorisé</h3>
                <p className="text-red-600">
                    Seuls les administrateurs peuvent accéder à la gestion des permissions.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des permissions</h1>
                <p className="text-gray-600">
                    Configurez les permissions pour chaque rôle utilisateur.
                </p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['admin', 'agent', 'investigateur'].map(role => (
                    <div key={role} className={`border rounded-lg ${getRoleColor(role)}`}>
                        <div className={`p-4 border-b ${getRoleColor(role).replace('50', '100')}`}>
                            <h2 className={`text-lg font-semibold ${getRoleTextColor(role)}`}>
                                {getRoleLabel(role)}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {permissions[role]?.length || 0} permissions
                            </p>
                        </div>

                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                const categoryPermissions = perms.filter(p =>
                                    p.key.startsWith(category + '.') ||
                                    ['dashboard.view', 'profile.view', 'profile.edit', 'notifications.view'].includes(p.key)
                                );

                                if (categoryPermissions.length === 0) return null;

                                return (
                                    <div key={category} className="mb-4 last:mb-0">
                                        <h3 className="font-medium text-gray-700 mb-2 capitalize">
                                            {category === 'reports' ? 'Signalements' :
                                                category === 'users' ? 'Utilisateurs' :
                                                    category === 'investigations' ? 'Investigations' :
                                                        category === 'dashboard' ? 'Tableau de bord' :
                                                            category === 'profile' ? 'Profil' :
                                                                category === 'files' ? 'Fichiers' :
                                                                    category === 'analytics' ? 'Analyses' :
                                                                        category === 'settings' ? 'Paramètres' :
                                                                            category === 'audit' ? 'Audit' :
                                                                                category === 'notifications' ? 'Notifications' :
                                                                                    category}
                                        </h3>
                                        <div className="space-y-2">
                                            {categoryPermissions.map(permission => (
                                                <div key={permission.key} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id={`${role}-${permission.key}`}
                                                        checked={permissions[role]?.includes(permission.key)}
                                                        onChange={() => togglePermission(role, permission.key)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        disabled={saving}
                                                    />
                                                    <label
                                                        htmlFor={`${role}-${permission.key}`}
                                                        className="ml-2 block text-sm text-gray-700 cursor-pointer"
                                                    >
                                                        {permission.label}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
                <button
                    onClick={loadPermissions}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={saving}
                >
                    Annuler
                </button>
                <button
                    onClick={savePermissions}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sauvegarde...
                        </>
                    ) : 'Enregistrer les permissions'}
                </button>
            </div>

            <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé des permissions par rôle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['admin', 'agent', 'investigateur'].map(role => (
                        <div key={role} className="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 className={`font-medium mb-2 ${getRoleTextColor(role)}`}>
                                {getRoleLabel(role)}
                            </h4>
                            <ul className="space-y-1">
                                {permissions[role]?.slice(0, 5).map(perm => {
                                    const permission = allPermissions.find(p => p.key === perm);
                                    return permission ? (
                                        <li key={perm} className="text-sm text-gray-600">
                                            • {permission.label}
                                        </li>
                                    ) : null;
                                })}
                                {permissions[role]?.length > 5 && (
                                    <li className="text-sm text-gray-500">
                                        ... et {permissions[role].length - 5} autres
                                    </li>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PermissionManager;