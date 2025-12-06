import React from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

const ProtectedRoute = ({ children, requiredPermissions = [], requiredRole = null, redirectTo = "/unauthorized" }) => {
    const { loading, userRole, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Vérifier le rôle si spécifié
    if (requiredRole && userRole !== requiredRole) {
        return <Navigate to={redirectTo} replace />;
    }

    // Vérifier les permissions si spécifiées
    if (requiredPermissions.length > 0) {
        const hasRequiredPermissions = requiredPermissions.every(permission =>
            hasPermission(permission)
        );

        if (!hasRequiredPermissions) {
            return <Navigate to={redirectTo} replace />;
        }
    }

    return children;
};

// Composant pour vérifier une permission spécifique
export const WithPermission = ({ children, permission, fallback = null }) => {
    const { hasPermission, loading } = usePermissions();

    if (loading) {
        return null;
    }

    return hasPermission(permission) ? children : (fallback || null);
};

// Composant pour vérifier un rôle spécifique
export const WithRole = ({ children, role, fallback = null }) => {
    const { userRole, loading } = usePermissions();

    if (loading) {
        return null;
    }

    return userRole === role ? children : (fallback || null);
};

export default ProtectedRoute;