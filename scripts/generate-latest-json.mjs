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

  // Modern Tauri v2 uses full triples. 
  // We'll map simple suffixes to common v2 target triples.
  if (f.endsWith(".msi") || f.endsWith(".exe")) {
    if (f.includes("x64") || f.includes("x86_64")) return "windows-x86_64";
    if (f.includes("arm64") || f.includes("aarch64")) return "windows-aarch64";
    // Fallback default
    return "windows-x86_64";
  }

  if (f.endsWith(".dmg")) {
    if (f.includes("universal")) return "darwin-universal";
    if (f.includes("aarch64") || f.includes("arm64") || f.includes("apple")) return "darwin-aarch64";
    if (f.includes("x86_64") || f.includes("x64") || f.includes("intel")) return "darwin-x86_64";
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
      // Map universal to both apple and intel triples for v2
      platforms["darwin-aarch64"] = { url, signature };
      platforms["darwin-x86_64"] = { url, signature };
      continue;
    }

    // Tauri v2 prefers full triples. 
    // We map our simplified keys to the standard target triples.
    const tripleMap = {
      "windows-x86_64": "x86_64-pc-windows-msvc",
      "windows-aarch64": "aarch64-pc-windows-msvc",
      "darwin-x86_64": "x86_64-apple-darwin",
      "darwin-aarch64": "aarch64-apple-darwin",
      "linux-x86_64": "x86_64-unknown-linux-gnu",
      "linux-aarch64": "aarch64-unknown-linux-gnu"
    };

    const finalKey = tripleMap[platformKey] || platformKey;
    platforms[finalKey] = { url, signature };
  }

  if (!Object.keys(platforms).length) {
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