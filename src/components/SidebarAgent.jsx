import React from "react";

const SidebarAgent = ({ currentView, onViewChange, collapsed, onToggle }) => {
  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "📊" },
    { id: "signalements", label: "Gestion de Signalements", icon: "📋" },
    // { id: "notifications", label: "Notifications", icon: "🔔" },
    // { id: "profil", label: "Mon Profil", icon: "👤" },
  ];

  return (
    <aside
      className={`fixed left-0 top-20 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header du sidebar avec toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 h-12">
        {!collapsed && (
          <h2 className="text-base font-semibold text-gray-800 text-center flex-1">
            Menu Agent
          </h2>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          <svg
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                collapsed
                  ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                  : "M11 19l-7-7 7-7m8 14l-7-7 7-7"
              }
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors mb-1 ${
              currentView === item.id
                ? "bg-green-50 text-green-600 border border-green-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
            title={collapsed ? item.label : ""}
          >
            <span className="text-base flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="font-medium text-left text-sm">
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarAgent;
