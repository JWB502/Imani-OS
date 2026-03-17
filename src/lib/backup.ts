import type { AppData, AppSettings } from "@/types/imani";
import { readJson, writeJson } from "@/lib/storage";

const DATA_KEY = "imani-os:data:v1";
const SETTINGS_KEY = "imani-os:settings:v1";

export type BackupPayloadV1 = {
  version: 1;
  exportedAt: string;
  settings: Omit<AppSettings, "openAiApiKey" | "openRouterApiKey">;
  data: AppData;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function validateAppSettings(v: unknown): Omit<AppSettings, "openAiApiKey" | "openRouterApiKey"> {
  if (!isObject(v)) throw new Error("Invalid backup: settings must be an object.");

  const agencyName = v.agencyName;
  const openAiModel = v.openAiModel;
  const analysts = v.analysts;
  const pdfPageNumbers = v.pdfPageNumbers;
  const redactionStyle = v.redactionStyle;
  const aiProvider = v.aiProvider;

  if (typeof agencyName !== "string") {
    throw new Error("Invalid backup: settings.agencyName must be a string.");
  }
  if (typeof openAiModel !== "string") {
    throw new Error("Invalid backup: settings.openAiModel must be a string.");
  }
  if (!isStringArray(analysts)) {
    throw new Error("Invalid backup: settings.analysts must be a string array.");
  }
  if (!isBool(pdfPageNumbers)) {
    throw new Error("Invalid backup: settings.pdfPageNumbers must be a boolean.");
  }
  if (redactionStyle !== "iaid" && redactionStyle !== "initial") {
    throw new Error(
      "Invalid backup: settings.redactionStyle must be 'iaid' or 'initial'.",
    );
  }
  if (aiProvider !== "openai" && aiProvider !== "openrouter") {
    throw new Error("Invalid backup: settings.aiProvider must be 'openai' or 'openrouter'.");
  }

  return {
    agencyName,
    openAiModel,
    analysts,
    pdfPageNumbers,
    redactionStyle,
    aiProvider,
  };
}

function validateAppData(v: unknown): AppData {
  if (!isObject(v)) throw new Error("Invalid backup: data must be an object.");

  const arr = (key: keyof AppData) => {
    const val = v[key as string];
    if (!Array.isArray(val)) throw new Error(`Invalid backup: data.${String(key)} must be an array.`);
    return val;
  };

  // Shape-light validation: ensure the top-level collections exist.
  const data = {
    clients: arr("clients"),
    wins: arr("wins"),
    campaigns: arr("campaigns"),
    sectionTemplates: arr("sectionTemplates"),
    fullTemplates: arr("fullTemplates"),
    reports: arr("reports"),
    metricDefinitions: arr("metricDefinitions"),
    monthlyMetrics: arr("monthlyMetrics"),
  } as AppData;

  return data;
}

export function validateBackupPayload(json: unknown): BackupPayloadV1 {
  if (!isObject(json)) throw new Error("Invalid backup: root must be an object.");
  if (json.version !== 1) throw new Error("Invalid backup: unsupported version.");

  const exportedAt = json.exportedAt;
  if (typeof exportedAt !== "string") {
    throw new Error("Invalid backup: exportedAt must be a string.");
  }

  return {
    version: 1,
    exportedAt,
    settings: validateAppSettings(json.settings),
    data: validateAppData(json.data),
  };
}

function yyyymmdd(d: Date) {
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function exportBackup(): { filename: string; content: string } {
  const data = readJson<AppData>(DATA_KEY);
  const settings = readJson<AppSettings>(SETTINGS_KEY);

  if (!data || !settings) {
    throw new Error("Nothing to export yet.");
  }

  const { openAiApiKey: _oa, openRouterApiKey: _or, ...settingsNoKey } = settings;

  const payload: BackupPayloadV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settingsNoKey,
    data,
  };

  const filename = `imani-os-backup-${yyyymmdd(new Date())}.json`;
  const content = JSON.stringify(payload, null, 2);
  return { filename, content };
}

export async function importBackup(json: unknown): Promise<void> {
  const payload = validateBackupPayload(json);

  const existing = readJson<AppSettings>(SETTINGS_KEY);
  const openAiApiKey = existing?.openAiApiKey;
  const openRouterApiKey = existing?.openRouterApiKey;

  // Always exclude API keys from backups — retain local keys.
  const nextSettings: AppSettings = {
    ...payload.settings,
    openAiApiKey,
    openRouterApiKey,
  };

  writeJson(DATA_KEY, payload.data);
  writeJson(SETTINGS_KEY, nextSettings);
}