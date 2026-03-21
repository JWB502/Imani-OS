import { flattenDocumentPages } from "@/lib/documentTree";
import type { AppData, AppSettings, Client, Report } from "@/types/imani";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function randomInt(maxExclusive: number) {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0]! % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

export function createPrivacyId(data: AppData): string {
  const used = new Set(
    data.clients
      .map((c) => c.privacyId)
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0),
  );

  for (let i = 0; i < 50_000; i++) {
    const digits = String(randomInt(10_000_000)).padStart(7, "0");
    const id = `IA${digits}`;
    if (!used.has(id)) return id;
  }

  // Extremely unlikely fallback
  return `IA${Date.now() % 10_000_000}`.padEnd(9, "0");
}

export function toInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-zA-Z]/g, ""))
    .filter(Boolean);

  if (parts.length === 0) return "";
  if (parts.length === 1) return `${parts[0]![0]!.toUpperCase()}.`;

  const first = parts[0]![0]!.toUpperCase();
  const last = parts[parts.length - 1]![0]!.toUpperCase();
  return `${first}.${last}.`;
}

export function maskEmail(text: string): string {
  return text.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "[redacted]",
  );
}

export function maskPhone(text: string): string {
  return text.replace(/\+?\d[\d\s().-]{7,}\d/g, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 7) return match;
    return "[redacted]";
  });
}

export function redactText(
  text: string,
  opts: {
    style: AppSettings["redactionStyle"];
    iaId?: string;
    knownNames: string[];
  },
): string {
  let out = text;
  out = maskEmail(out);
  out = maskPhone(out);

  const iaReplacement = opts.iaId ?? "IA0000000";

  for (const rawName of opts.knownNames) {
    const name = rawName.trim();
    if (!name) continue;

    const replacement = opts.style === "initial" ? toInitials(name) : iaReplacement;
    if (!replacement) continue;

    const pattern = name
      .split(/\s+/)
      .map(escapeRegExp)
      .join("\\s+");

    const re = new RegExp(`\\b${pattern}\\b`, "gi");
    out = out.replace(re, replacement);
  }

  return out;
}

export function sanitizeForAI(params: {
  report: Report;
  client: Client;
  settings: AppSettings;
  prompt: string;
}): string {
  const knownNames = [params.client.contactName, params.report.analyst]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);

  // Also scrub any phone/email that may have been pasted into dynamic fields.
  const base = redactText(params.prompt, {
    style: params.settings.redactionStyle,
    iaId: params.client.privacyId,
    knownNames,
  });

  // Ensure media URLs and other non-rich blocks don't leak emails/phones.
  const imageUrls = flattenDocumentPages(params.report.pages)
    .flatMap((page) => page.blocks)
    .filter((block) => block.type === "media")
    .map((block) => block.props.url)
    .filter(Boolean)
    .join("\n");

  return imageUrls ? `${base}\n\n(Attachment URLs redacted as needed)\n${maskEmail(maskPhone(imageUrls))}` : base;
}
