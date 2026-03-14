import { isTauri } from "@/lib/native";

export type UpdateCheckResult =
  | { available: false }
  | {
      available: true;
      version: string;
      notes?: string;
      update: unknown;
    };

function extractNotes(update: any): string | undefined {
  return (
    update?.body ??
    update?.notes ??
    update?.manifest?.body ??
    update?.manifest?.notes ??
    undefined
  );
}

export async function getCurrentAppVersion(): Promise<string | undefined> {
  if (!isTauri()) return undefined;
  const { getVersion } = await import("@tauri-apps/api/app");
  return await getVersion();
}

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  if (!isTauri()) return { available: false };

  const { check } = await import("@tauri-apps/plugin-updater");
  const update: any = await check();

  if (!update) return { available: false };

  return {
    available: true,
    version: String(update?.version ?? ""),
    notes: extractNotes(update),
    update,
  };
}

export async function installAndRelaunch(update: unknown) {
  if (!isTauri()) return;

  const { relaunch } = await import("@tauri-apps/plugin-process");
  const u: any = update as any;

  await u.downloadAndInstall?.();
  await relaunch();
}
