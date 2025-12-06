// hooks/useSettings.js
import { useState, useEffect } from "react";

export const useSettings = () => {
  const [settings, setSettings] = useState({
    theme: "system",
    primaryColor: "blue",
  });

  useEffect(() => {
    loadSettings();

    // Écouter les changements de paramètres
    const handleSettingsChange = (event) => {
      setSettings(event.detail);
    };

    window.addEventListener("settingsChanged", handleSettingsChange);

    return () => {
      window.removeEventListener("settingsChanged", handleSettingsChange);
    };
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem("admin_settings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      applySettings(parsedSettings);
    }
  };

  const applySettings = (newSettings) => {
    applyTheme(newSettings.theme);
    applyPrimaryColor(newSettings.primaryColor);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    if (theme === "dark") {
      root.classList.add("dark");
      body.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("light");
      body.classList.add("light");
    } else {
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

    root.style.setProperty("--color-primary", scheme.primary);
    root.style.setProperty("--color-primary-dark", scheme.primaryDark);
    root.style.setProperty("--color-primary-light", scheme.primaryLight);
  };

  return settings;
};
