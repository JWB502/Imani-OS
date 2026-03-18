import { isTauri } from "@/lib/native";

export type UpdateCheckResult =
  | { available: false }
  | {
      available: true;
      version: string;
      notes?: string;
      update: any; // v2 Update object
    };

function extractNotes(update: any): string | undefined {
  // In v2, the Update object has a 'body' or 'notes' field depending on the manifest
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
  const update = await check();

  if (!update) return { available: false };

  return {
    available: true,
    version: String(update.version),
    notes: extractNotes(update),
    update,
  };
}

export async function installAndRelaunch(
  update: any,
  onProgress?: (progress: { downloaded: number; contentLength?: number }) => void
) {
  if (!isTauri()) return;

  const { relaunch } = await import("@tauri-apps/plugin-process");
  
  // In v2, we can track progress
  await update.downloadAndInstall((event: any) => {
    switch (event.event) {
      case 'Started':
        if (onProgress) onProgress({ downloaded: 0, contentLength: event.data.contentLength });
        break;
      case 'Progress':
        if (onProgress) onProgress({ downloaded: event.data.chunkLength });
        break;
      case 'Finished':
        // Finished
        break;
    }
  });

  await relaunch();
}
