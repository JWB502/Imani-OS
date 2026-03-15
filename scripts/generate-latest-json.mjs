import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) continue;
    const key = k.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    out[key] = val;
  }
  return out;
}

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];
  for (const e of entries) {
    const p = path.join(dir, e);
    const s = await stat(p);
    if (s.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

function lower(s) {
  return s.toLowerCase();
}

function detectPlatformKey(filename) {
  const f = lower(filename);

  if (f.endsWith(".msi") || f.endsWith(".exe")) return "windows-x86_64";

  if (f.endsWith(".dmg")) {
    if (f.includes("universal")) return "darwin-universal";
    if (f.includes("aarch64") || f.includes("arm64") || f.includes("apple")) return "darwin-aarch64";
    if (f.includes("x86_64") || f.includes("x64") || f.includes("intel")) return "darwin-x86_64";
    // fallback: assume aarch64 for modern macOS runners
    return "darwin-aarch64";
  }

  return undefined;
}

async function main() {
  const args = parseArgs(process.argv);

  const version = String(args.version || "").trim();
  const tag = String(args.tag || "").trim();
  const repo = String(args.repo || "").trim();
  const bundleDir = String(args.bundleDir || "").trim();
  const outPath = String(args.out || "latest.json").trim();

  if (!version || !tag || !repo || !bundleDir) {
    throw new Error(
      "Missing required args. Usage: --version <v> --tag <tag> --repo <owner/repo> --bundleDir <dir> [--out latest.json]",
    );
  }

  const baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

  const files = await walk(bundleDir);

  const installers = files.filter((p) => {
    const f = lower(p);
    return f.endsWith(".dmg") || f.endsWith(".msi") || f.endsWith(".exe");
  });

  const sigs = new Map();
  for (const f of files) {
    if (lower(f).endsWith(".sig")) sigs.set(path.basename(f), f);
  }

  const platforms = {};

  for (const installerPath of installers) {
    const fileName = path.basename(installerPath);
    const platformKey = detectPlatformKey(fileName);
    if (!platformKey) continue;

    const sigFileName = `${fileName}.sig`;
    const sigPath = sigs.get(sigFileName);
    if (!sigPath) continue;

    const signature = (await readFile(sigPath, "utf8")).trim();
    const url = `${baseUrl}/${encodeURIComponent(fileName)}`;

    if (platformKey === "darwin-universal") {
      // Tauri's official schema doesn't list darwin-universal as a key; map the same artifact to both arch keys.
      platforms["darwin-aarch64"] = { url, signature };
      platforms["darwin-x86_64"] = { url, signature };
      continue;
    }

    platforms[platformKey] = { url, signature };
  }

  if (!platforms["windows-x86_64"] && !platforms["darwin-aarch64"] && !platforms["darwin-x86_64"]) {
    throw new Error(
      `No updater platforms found. Looked for .dmg/.msi/.exe and matching .sig under: ${bundleDir}`,
    );
  }

  const latest = {
    version,
    pub_date: new Date().toISOString(),
    notes: `Imani OS v${version}`,
    platforms,
  };

  await writeFile(outPath, JSON.stringify(latest, null, 2) + "\n", "utf8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
