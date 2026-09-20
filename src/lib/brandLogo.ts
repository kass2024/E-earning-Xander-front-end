import { isXanderMeet } from "./product";

/** Single source of truth for brand logo assets in public/ */
export const LOGO = {
  src: isXanderMeet() ? "/brand/xander-x-gold.png" : "/logo.png",
  alt: isXanderMeet() ? "Xander Meet" : "Xander Learning Hub",
  version: "3",
} as const;

export function logoUrl(path: string = LOGO.src): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${LOGO.version}`;
}

export const FAVICONS = {
  ico: "/favicon.ico",
  png16: "/favicon-16x16.png",
  png32: "/favicon-32x32.png",
  apple: "/apple-touch-icon.png",
} as const;
