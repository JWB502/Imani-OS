export function isTauri(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI__);
}

export async function saveFile(opts: { content: string; defaultPath: string }) {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    const path = await save({
      defaultPath: opts.defaultPath,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!path) return;
    await writeTextFile(path, opts.content);
    return;
  }

  const blob = new Blob([opts.content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts.defaultPath;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function openFile(): Promise<string | undefined> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");

    const selected = await open({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    if (!selected) return undefined;
    const path = Array.isArray(selected) ? selected[0] : selected;

    const out: any = await readTextFile(path);
    if (out instanceof ArrayBuffer) {
      return new TextDecoder("utf-8").decode(out);
    }
    return String(out);

  }

  return await new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve(undefined);
      reader.readAsText(file);
    };

    input.click();
  });
}
