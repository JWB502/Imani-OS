import * as React from "react";
import type { AppSettings } from "@/types/imani";
import { readJson, writeJson } from "@/lib/storage";

const SETTINGS_KEY = "imani-os:settings:v1";

const defaultSettings: AppSettings = {
  agencyName: "Imani Advantage",
  openAiModel: "gpt-4o-mini",
  analysts: ["Imani Analyst"],
  pdfPageNumbers: true,
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(() => {
    return readJson<AppSettings>(SETTINGS_KEY) ?? defaultSettings;
  });

  const updateSettings = React.useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
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
