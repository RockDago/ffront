import API from '../config/axios';

class UserService {
    // ==================== CSRF PROTECTION ====================

    /**
     * Obtenir le cookie CSRF (CRITIQUE pour Laravel Sanctum)
     * À appeler avant toute requête POST/PUT/DELETE
     */
    static async getCsrfCookie() {
        try {
            await API.get('/sanctum/csrf-cookie');
            console.log('[UserService] Cookie CSRF obtenu');
        } catch (error) {
            console.error('[UserService] Erreur CSRF:', error);
        }
    }

    // ==================== AUTHENTIFICATION ====================

    /**
     * Connexion simple
     */
    static async login(email, password) {
        try {
            console.log('[UserService] Tentative de connexion...');

            // ✅ Obtenir le CSRF avant le login
            await this.getCsrfCookie();

            const response = await API.post('/auth/login', { email, password });
            const user = response.data?.user || response.data?.data?.user;

            console.log('[UserService] Connexion réussie:', user?.email);
            return { success: true, user };
        } catch (error) {
            if (error.response && error.response.status === 401) {
                return {
                    success: false,
                    message: "Email ou mot de passe incorrect"
                };
            }

            console.error('[UserService] Erreur login:', error);
            return this.handleError(error);
        }
    }

    /**
     * Déconnexion
     */
    static async logout() {
        try {
            await API.post('/auth/logout');
            return { success: true };
        } catch (error) {
            console.error('[UserService] Erreur logout:', error);
            return { success: false };
        }
    }

    /**
     * Vérifie si l'utilisateur est connecté
     */
    static async checkAuth() {
        try {
            const response = await API.get('/auth/check-auth');
            return {
                isAuthenticated: true,
                user: response.data?.user || response.data
            };
        } catch (error) {
            return { isAuthenticated: false, user: null };
        }
    }

    // ==================== PROFIL UTILISATEUR ====================

    /**
     * Récupère le profil de l'utilisateur connecté
     */
    static async getProfile() {
        try {
            const response = await API.get('/profile');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== GESTION D'ÉQUIPE ====================

    /**
     * Récupère TOUS les utilisateurs de l'équipe
     * Le frontend gère le filtrage par rôle
     */
    static async getAllUsers() {
        try {
            console.log('[UserService] getAllUsers appelé');
            const response = await API.get('/admin/team/users');
            console.log('[UserService] Réponse getAllUsers:', response.data);
            return response.data;
        } catch (error) {
            console.error('[UserService] Erreur getAllUsers:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Alias - même fonction
     */
    static async getAllTeamUsers(params = {}) {
        return this.getAllUsers();
    }

    /**
     * Filtre par rôle (côté frontend)
     */
    static async getUsersByRole(role = null, params = {}) {
        try {
            if (role) {
                params.role = role;
            }
            return this.getAllTeamUsers(params);
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // --- Méthodes spécifiques par rôle ---

    static async getAgents() {
        try {
            const response = await API.get('/admin/team/agents');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async getInvestigateurs() {
        try {
            const response = await API.get('/admin/team/investigateurs');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async getAdministrateurs() {
        try {
            const response = await API.get('/admin/team/administrateurs');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== CRUD UTILISATEURS (ADMIN) ====================

    /**
     * ✅ CRÉER UN UTILISATEUR (avec CSRF)
     */
    static async createUser(userData) {
        try {
            console.log('[UserService] createUser appelé avec:', userData);

            // ✅ CSRF avant POST
            await this.getCsrfCookie();

            const response = await API.post('/admin/team/users', userData);
            console.log('[UserService] Utilisateur créé:', response.data);
            return response.data;
        } catch (error) {
            console.error('[UserService] Erreur createUser:', error);
            throw this.handleError(error);
        }
    }

    /**
     * ✅ MODIFIER UN UTILISATEUR (avec CSRF)
     */
    static async updateUser(id, userData) {
        try {
            console.log('[UserService] updateUser appelé:', id, userData);

            // ✅ CSRF avant PUT
            await this.getCsrfCookie();

            const response = await API.put(`/admin/team/users/${id}`, userData);
            console.log('[UserService] Utilisateur modifié:', response.data);
            return response.data;
        } catch (error) {
            console.error('[UserService] Erreur updateUser:', error);
            throw this.handleError(error);
        }
    }

    /**
     * ✅ SUPPRIMER UN UTILISATEUR (avec CSRF)
     */
    static async deleteUser(id) {
        try {
            console.log('[UserService] deleteUser appelé:', id);

            // ✅ CSRF avant DELETE
            await this.getCsrfCookie();

            const response = await API.delete(`/admin/team/users/${id}`);
            console.log('[UserService] Utilisateur supprimé');
            return response.data;
        } catch (error) {
            console.error('[UserService] Erreur deleteUser:', error);
            throw this.handleError(error);
        }
    }

    /**
     * ✅ ACTIVER/DÉSACTIVER UN UTILISATEUR (avec CSRF)
     */
    static async toggleStatus(id) {
        try {
            console.log('[UserService] toggleStatus appelé:', id);

            // ✅ CSRF avant PATCH
            await this.getCsrfCookie();

            const response = await API.patch(`/admin/team/users/${id}/toggle-status`);
            console.log('[UserService] Statut modifié:', response.data);
            return response.data;
        } catch (error) {
            console.error('[UserService] Erreur toggleStatus:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Réinitialiser le mot de passe
     */
    static async resetPassword(id, passwordData) {
        try {
            await this.getCsrfCookie();
            const response = await API.put(`/admin/team/users/${id}/reset-password`, passwordData);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    /**
     * Restaurer un utilisateur
     */
    static async restoreUser(id) {
        try {
            await this.getCsrfCookie();
            const response = await API.patch(`/admin/team/users/${id}/restore`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== STATISTIQUES & ROLES ====================

    static async getStats() {
        try {
            const response = await API.get('/admin/team/stats');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async getRoles() {
        try {
            const response = await API.get('/admin/team/roles');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== NOTIFICATIONS ====================

    static async getNotifications() {
        try {
            const response = await API.get('/notifications');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async getRecentNotifications() {
        try {
            const response = await API.get('/notifications/recent');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async getUnreadNotificationCount() {
        try {
            const response = await API.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async markNotificationAsRead(id) {
        try {
            await this.getCsrfCookie();
            const response = await API.post(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async markAllNotificationsAsRead() {
        try {
            await this.getCsrfCookie();
            const response = await API.post('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== JOURNAL D'AUDIT ====================

    static async getAuditJournal(params = {}) {
        try {
            const response = await API.get('/journal-audit', { params });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    static async exportAuditJournal(params = {}) {
        try {
            const response = await API.post('/admin/audit/journal/export', params, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== DIAGNOSTIC ====================

    static async checkApiConnection() {
        try {
            await API.get('/health');
            return true;
        } catch (error) {
            return false;
        }
    }

    static async getSessionInfo() {
        try {
            const response = await API.get('/debug/session');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // ==================== GESTION DES ERREURS ====================

    static handleError(error) {
        console.error('[UserService] Gestion d\'erreur', error);

        if (error.response) {
            const { status, data } = error.response;
            let message = data?.message || data?.error || 'Une erreur est survenue';

            // ✅ Garde le message backend et affiche le debug
            if (status === 401) {
                message = 'Session expirée ou identifiants incorrects';
            } else if (status === 403) {
                // Afficher le debug dans la console pour voir le rôle
                console.warn('[UserService] 403 Forbidden - Debug:', data?.debug);
                // Garde le message du backend
                message = data?.message || 'Accès refusé - Droits insuffisants';
            } else if (status === 422) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    message = Array.isArray(firstError) ? firstError[0] : firstError;
                } else {
                    message = data?.message || 'Données invalides';
                }
            } else if (status === 404) {
                message = 'Ressource introuvable';
            } else if (status === 500) {
                message = 'Erreur serveur interne. Veuillez réessayer.';
            }

            return {
                success: false,
                message,
                status,
                data,
            };
        }

        if (error.request) {
            return {
                success: false,
                message: 'Impossible de contacter le serveur',
                status: 0,
                isNetworkError: true,
            };
        }

        return {
            success: false,
            message: error.message || 'Erreur inconnue',
            status: -1,
        };
    }
}

export default UserService;
