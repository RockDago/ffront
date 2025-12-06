import { useState, useEffect } from "react";
import API from "../config/axios";

export const usePermissions = () => {
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    const loadUserPermissions = async () => {
        try {
            // Récupérer le profil utilisateur
            const response = await API.get("/profile");
            if (response.data.success) {
                const userData = response.data.data;
                setUserRole(userData.role);

                // Charger les permissions depuis le modèle
                // Vous pouvez aussi les récupérer depuis une API dédiée
                const rolePermissions = getPermissionsByRole(userData.role);
                setPermissions(rolePermissions);
            }
        } catch (error) {
            console.error("Erreur chargement permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const getPermissionsByRole = (role) => {
        const permissionsByRole = {
            admin: [
                'dashboard.view',
                'users.manage',
                'reports.manage',
                'analytics.view',
                'settings.manage',
                'audit.view',
                'notifications.manage'
            ],
            agent: [
                'dashboard.view',
                'reports.view_assigned',
                'reports.create',
                'files.upload',
                'profile.view',
                'profile.edit',
                'notifications.view'
            ],
            investigateur: [
                'dashboard.view',
                'reports.view_assigned',
                'investigations.manage',
                'files.upload',
                'profile.view',
                'profile.edit',
                'notifications.view'
            ]
        };
        return permissionsByRole[role] || [];
    };

    const hasPermission = (permission) => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (permissionList) => {
        return permissionList.some(permission => permissions.includes(permission));
    };

    const hasAllPermissions = (permissionList) => {
        return permissionList.every(permission => permissions.includes(permission));
    };

    const canAccessRoute = (route) => {
        const routesByRole = {
            admin: [
                '/admin/*',
                '/dashboard',
                '/profile/*',
                '/users/*',
                '/reports/*',
                '/analytics/*',
                '/settings/*',
                '/permissions/*'
            ],
            agent: [
                '/dashboard',
                '/profile/*',
                '/reports/assigned',
                '/reports/create',
                '/files/upload'
            ],
            investigateur: [
                '/dashboard',
                '/profile/*',
                '/investigations/*',
                '/reports/investigate/*'
            ]
        };

        const allowedRoutes = routesByRole[userRole] || [];
        return allowedRoutes.some(pattern => fnmatch(pattern, route));
    };

    // Fonction fnmatch simplifiée
    const fnmatch = (pattern, string) => {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
        return regex.test(string);
    };

    useEffect(() => {
        loadUserPermissions();
    }, []);

    return {
        permissions,
        loading,
        userRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessRoute,
        reloadPermissions: loadUserPermissions
    };
};