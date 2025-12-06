import React, { useState, useEffect } from "react";

const SettingsView = ({ onReturnToDashboard }) => {
  const [settings, setSettings] = useState({
    theme: "system",
    primaryColor: "blue",
    sidebarStyle: "default",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem("admin_settings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        applyTheme(parsedSettings.theme);
        applyPrimaryColor(parsedSettings.primaryColor);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = (newSettings) => {
    setIsLoading(true);

    setTimeout(() => {
      localStorage.setItem("admin_settings", JSON.stringify(newSettings));
      setSettings(newSettings);
      applyTheme(newSettings.theme);
      applyPrimaryColor(newSettings.primaryColor);

      // Émettre un événement pour informer les autres composants
      window.dispatchEvent(
        new CustomEvent("settingsChanged", {
          detail: newSettings,
        })
      );

      setSuccessMessage("Paramètres sauvegardés avec succès");
      setTimeout(() => setSuccessMessage(""), 3000);
      setIsLoading(false);
    }, 500);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;

    // Supprimer toutes les classes de thème
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
      body.classList.add("light");
    } else {
      // System - suivre la préférence du système
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
        body.classList.add("dark");
      } else {
        root.classList.add("light");
        body.classList.add("light");
      }
    }
  };

  const applyPrimaryColor = (color) => {
    const root = document.documentElement;

    // Définir les variables CSS globales pour la couleur primaire
    const colorSchemes = {
      blue: {
        primary: "59, 130, 246",
        primaryDark: "37, 99, 235",
        primaryLight: "239, 246, 255",
      },
      indigo: {
        primary: "99, 102, 241",
        primaryDark: "79, 70, 229",
        primaryLight: "238, 242, 255",
      },
      emerald: {
        primary: "16, 185, 129",
        primaryDark: "5, 150, 105",
        primaryLight: "236, 253, 245",
      },
      violet: {
        primary: "139, 92, 246",
        primaryDark: "124, 58, 237",
        primaryLight: "245, 243, 255",
      },
      rose: {
        primary: "244, 63, 94",
        primaryDark: "225, 29, 72",
        primaryLight: "255, 241, 242",
      },
    };

    const scheme = colorSchemes[color] || colorSchemes.blue;

    // Appliquer les variables CSS globales
    root.style.setProperty("--color-primary", scheme.primary);
    root.style.setProperty("--color-primary-dark", scheme.primaryDark);
    root.style.setProperty("--color-primary-light", scheme.primaryLight);

    // Sauvegarder aussi dans localStorage pour l'initialisation
    localStorage.setItem("primary_color", color);
  };

  const handleThemeChange = (theme) => {
    const newSettings = { ...settings, theme };
    saveSettings(newSettings);
  };

  const handleColorChange = (color) => {
    const newSettings = { ...settings, primaryColor: color };
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: "system",
      primaryColor: "blue",
      sidebarStyle: "default",
    };
    saveSettings(defaultSettings);
  };

  const themeOptions = [
    { value: "light", label: "Clair", icon: "☀️" },
    { value: "dark", label: "Sombre", icon: "🌙" },
    { value: "system", label: "Système", icon: "💻" },
  ];

  const colorOptions = [
    { value: "blue", label: "Bleu", color: "bg-blue-500" },
    { value: "indigo", label: "Indigo", color: "bg-indigo-500" },
    { value: "emerald", label: "Émeraude", color: "bg-emerald-500" },
    { value: "violet", label: "Violet", color: "bg-violet-500" },
    { value: "rose", label: "Rose", color: "bg-rose-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton de retour */}
        <div className="mb-6">
          <button
            onClick={onReturnToDashboard}
            className="flex items-center text-primary hover:text-primary-dark transition-colors font-medium"
            style={{
              color: `rgb(var(--color-primary))`,
            }}
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

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* En-tête */}
          <div
            className="px-6 py-6"
            style={{
              background: `linear-gradient(to right, rgb(var(--color-primary)), rgb(var(--color-primary-dark)))`,
            }}
          >
            <h1 className="text-2xl font-bold text-white">Paramètres</h1>
            <p className="text-blue-100 dark:text-blue-200 mt-2">
              Personnalisez l'apparence de votre tableau de bord
            </p>
          </div>

          {/* Message de succès */}
          {successMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-6 py-3 text-sm">
              {successMessage}
            </div>
          )}

          {/* Contenu des paramètres */}
          <div className="p-6 space-y-8">
            {/* Section Thème */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Apparence
              </h2>

              {/* Sélection du thème */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Thème
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleThemeChange(option.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        settings.theme === option.value
                          ? "border-primary bg-primary-light dark:bg-gray-700"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                      style={{
                        borderColor:
                          settings.theme === option.value
                            ? `rgb(var(--color-primary))`
                            : undefined,
                        backgroundColor:
                          settings.theme === option.value
                            ? `rgb(var(--color-primary-light))`
                            : undefined,
                      }}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection de la couleur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Couleur principale
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleColorChange(option.value)}
                      className={`w-12 h-12 rounded-full border-2 transition-transform ${
                        settings.primaryColor === option.value
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-gray-300 dark:border-gray-600 hover:scale-105"
                      } ${option.color}`}
                      title={option.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetSettings}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Réinitialiser
              </button>

              <button
                onClick={() => saveSettings(settings)}
                disabled={isLoading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{
                  backgroundColor: `rgb(var(--color-primary))`,
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sauvegarde...
                  </>
                ) : (
                  "Sauvegarder les paramètres"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
