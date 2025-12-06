import React from "react";
import {
    LayoutDashboard,
    FileText,
    Users,
    BookOpen,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

const Sidebar = ({ currentView, onViewChange, collapsed, onToggle }) => {
    const menuItems = [
        { id: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard size={20} /> },
        { id: "reports", label: "Gestion des signalements", icon: <FileText size={20} /> },
        { id: "equipe", label: "Utilisateurs", icon: <Users size={20} /> },
        { id: "audit", label: "Log / Audit", icon: <BookOpen size={20} /> },
    ];

    return (
        <aside
            className={`
        relative bg-white border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out z-30
        ${collapsed ? "w-20" : "w-64"}
      `}
            style={{ paddingTop: '5rem' }}
        >

            {/* En-tête du Menu avec titre CENTRÉ et bouton à droite */}
            <div className="relative flex items-center justify-end px-4 pt-2 pb-4 h-12">
                {!collapsed && (
                    <h2 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Menu
                    </h2>
                )}

                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors relative z-10"
                    aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Liste des items */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-1">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`
              w-full flex items-center p-3 rounded-lg transition-colors duration-200 group relative
              ${currentView === item.id
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}
            `}
                        title={collapsed ? item.label : ""}
                    >
            <span className={`flex-shrink-0 ${collapsed ? "mx-auto" : ""}`}>
              {item.icon}
            </span>

                        {!collapsed && (
                            <span className="ml-3 truncate text-sm">{item.label}</span>
                        )}

                        {currentView === item.id && !collapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        )}

                        {collapsed && (
                            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {item.label}
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-gray-100 text-xs text-center text-gray-400">
                    &copy; daaq-mesupres 2025
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
