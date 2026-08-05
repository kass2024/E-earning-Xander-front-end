import { HUB } from "./hubConfig";

const LEGACY_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /parrot\s*global\s*study\s*academy/gi, replacement: HUB.name },
  { pattern: /parrot\s*canada\s*visa\s*consultant/gi, replacement: HUB.company },
  { pattern: /parrotglobalstudyacademy/gi, replacement: HUB.name },
  { pattern: /parrotglobalscholaracademy/gi, replacement: HUB.name },
  { pattern: /xander\s*global\s*study\s*academy/gi, replacement: HUB.name },
  { pattern: /xander\s*canada\s*visa\s*consultant/gi, replacement: HUB.company },
];

const GENERIC_SEEDED_NAMES = /^(staff user|instructor user|admin user)$/i;

/** Replace legacy Parrot/Xander branding in any visible UI string. */
export function sanitizeLegacyBrandText(text: string | null | undefined): string {
  if (!text?.trim()) return "";
  let result = text.trim();
  for (const { pattern, replacement } of LEGACY_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

function titleCaseFromEmailLocal(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._+-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** Person name for navbar/profile — never show legacy org names or seeded placeholders. */
export function formatUserDisplayName(
  name: string | null | undefined,
  email?: string | null
): string {
  const trimmed = (name ?? "").trim();

  if (/parrot/i.test(trimmed) || GENERIC_SEEDED_NAMES.test(trimmed)) {
    const fromEmail = email ? titleCaseFromEmailLocal(email) : "";
    if (fromEmail) return fromEmail;
    return sanitizeLegacyBrandText(trimmed) || HUB.name;
  }

  const sanitized = sanitizeLegacyBrandText(trimmed);
  if (sanitized) return sanitized;

  if (email) {
    const fromEmail = titleCaseFromEmailLocal(email);
    if (fromEmail) return fromEmail;
  }

  return "User";
}

export function normalizeLegacyLoginEmail(email: string | null | undefined): string {
  const trimmed = (email ?? "").trim().toLowerCase();
  if (!trimmed) return "";

  const aliases: Record<string, string> = {
    "infos@parrotglobalstudyacademy.ca": "info@xanderglobalscholars.com",
    "infos@parrotglobalscholaracademy.ca": "info@xanderglobalscholars.com",
    "infos@xanderglobalscholars.ca": "info@xanderglobalscholars.com",
    "admin@parrot.com": "info@xanderglobalscholars.com",
    "admin@xander.com": "info@xanderglobalscholars.com",
  };

  return aliases[trimmed] ?? trimmed;
}

export function getAppDisplayName(): string {
  const fromEnv = import.meta.env.VITE_APP_NAME?.trim();
  if (fromEnv) return sanitizeLegacyBrandText(fromEnv) || HUB.name;
  return HUB.name;
}
