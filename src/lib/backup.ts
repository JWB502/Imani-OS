import type { AppData, AppSettings } from "@/types/imani";
import { DATA_KEY_V2 } from "@/lib/documentMigration";
import { readJson, writeJson } from "@/lib/storage";

const DATA_KEY = DATA_KEY_V2;
const SETTINGS_KEY = "imani-os:settings:v1";

export type BackupPayloadV2 = {
  version: 2;
  exportedAt: string;
  settings: Omit<AppSettings, "openAiApiKey" | "openRouterApiKey">;
  data: AppData;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isBool(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function validateAppSettings(value: unknown): Omit<AppSettings, "openAiApiKey" | "openRouterApiKey"> {
  if (!isObject(value)) throw new Error("Invalid backup: settings must be an object.");

  const { agencyName, openAiModel, analysts, pdfPageNumbers, redactionStyle, aiProvider } = value;

  if (typeof agencyName !== "string") throw new Error("Invalid backup: settings.agencyName must be a string.");
  if (typeof openAiModel !== "string") throw new Error("Invalid backup: settings.openAiModel must be a string.");
  if (!isStringArray(analysts)) throw new Error("Invalid backup: settings.analysts must be a string array.");
  if (!isBool(pdfPageNumbers)) throw new Error("Invalid backup: settings.pdfPageNumbers must be a boolean.");
  if (redactionStyle !== "iaid" && redactionStyle !== "initial") throw new Error("Invalid backup: settings.redactionStyle must be 'iaid' or 'initial'.");
  if (aiProvider !== "openai" && aiProvider !== "openrouter") throw new Error("Invalid backup: settings.aiProvider must be 'openai' or 'openrouter'.");

  return { agencyName, openAiModel, analysts, pdfPageNumbers, redactionStyle, aiProvider };
}

function validateAppData(value: unknown): AppData {
  if (!isObject(value)) throw new Error("Invalid backup: data must be an object.");

  const arr = (key: keyof AppData) => {
    const candidate = value[key as string];
    if (!Array.isArray(candidate)) throw new Error(`Invalid backup: data.${String(key)} must be an array.`);
    return candidate;
  };

  return {
    schemaVersion: 2,
    clients: arr("clients"),
    wins: arr("wins"),
    campaigns: arr("campaigns"),
    documentTemplates: arr("documentTemplates"),
    reports: arr("reports"),
    metricDefinitions: arr("metricDefinitions"),
    monthlyMetrics: arr("monthlyMetrics"),
    agencyHq: value.agencyHq as AppData["agencyHq"],
    legacy: value.legacy as AppData["legacy"],
  };
}

export function validateBackupPayload(json: unknown): BackupPayloadV2 {
  if (!isObject(json)) throw new Error("Invalid backup: root must be an object.");
  if (json.version !== 2) throw new Error("Invalid backup: unsupported version.");
  if (typeof json.exportedAt !== "string") throw new Error("Invalid backup: exportedAt must be a string.");

  return {
    version: 2,
    exportedAt: json.exportedAt,
    settings: validateAppSettings(json.settings),
    data: validateAppData(json.data),
  };
}

function yyyymmdd(date: Date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function exportBackup(): { filename: string; content: string } {
  const data = readJson<AppData>(DATA_KEY);
  const settings = readJson<AppSettings>(SETTINGS_KEY);
  if (!data || !settings) throw new Error("Nothing to export yet.");

  const { openAiApiKey: _oa, openRouterApiKey: _or, ...settingsNoKey } = settings;

  const payload: BackupPayloadV2 = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: settingsNoKey,
    data,
  };

  return {
    filename: `imani-os-backup-${yyyymmdd(new Date())}.json`,
    content: JSON.stringify(payload, null, 2),
  };
}

export async function importBackup(json: unknown): Promise<void> {
  const payload = validateBackupPayload(json);

  const existing = readJson<AppSettings>(SETTINGS_KEY);
  const nextSettings: AppSettings = {
    ...payload.settings,
    openAiApiKey: existing?.openAiApiKey,
    openRouterApiKey: existing?.openRouterApiKey,
  };

  writeJson(DATA_KEY, payload.data);
  writeJson(SETTINGS_KEY, nextSettings);
}
