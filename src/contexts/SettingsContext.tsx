import * as React from "react";
import type { AppSettings } from "@/types/imani";
import { readJson, writeJson } from "@/lib/storage";

const SETTINGS_KEY = "imani-os:settings:v1";

const defaultSettings: AppSettings = {
  agencyName: "Imani Advantage",
  openAiModel: "gpt-4o-mini",
  aiProvider: "openai",
  redactionStyle: "iaid",
  analysts: ["Imani Analyst"],
  pdfPageNumbers: true,
};

function coerceSettings(raw: Partial<AppSettings> | undefined): AppSettings {
  const base = raw ?? {};
  const redactionStyle: AppSettings["redactionStyle"] =
    base.redactionStyle === "initial" ? "initial" : "iaid";

  const aiProvider: AppSettings["aiProvider"] =
    base.aiProvider === "openrouter" ? "openrouter" : "openai";

  return {
    ...defaultSettings,
    ...base,
    redactionStyle,
    aiProvider,
    analysts: Array.isArray(base.analysts) ? base.analysts : defaultSettings.analysts,
    pdfPageNumbers:
      typeof base.pdfPageNumbers === "boolean"
        ? base.pdfPageNumbers
        : defaultSettings.pdfPageNumbers,
  };
}

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(() => {
    const stored = readJson<Partial<AppSettings>>(SETTINGS_KEY);
    return coerceSettings(stored);
  });

  const updateSettings = React.useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = coerceSettings({ ...prev, ...patch });
      writeJson(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}