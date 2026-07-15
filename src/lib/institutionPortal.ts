import type { CSSProperties } from "react";
import type { PlatformInstitutionInfo } from "@/api/axios";

export type InstitutionPortalFeature = {
  title: string;
  description: string;
};

export type InstitutionPortalContent = {
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  about: string;
  primary_color: string | null;
  features: InstitutionPortalFeature[];
  hero_image_url: string | null;
  cta_label: string;
};

export type InstitutionPortalProgram = {
  id: number;
  name: string;
  description?: string | null;
  status?: string;
  courses?: Array<{
    id: number;
    title: string;
    description?: string | null;
    duration?: string | null;
    price?: number | string | null;
  }>;
};

export type InstitutionPortalPayload = {
  institution: PlatformInstitutionInfo & { portal?: InstitutionPortalContent };
  programs: InstitutionPortalProgram[];
  stats: {
    programs_count: number;
    courses_count: number;
  };
};

export const DEFAULT_PORTAL_PRIMARY = "#012F6B";

export function resolvePortalPrimary(institution: PlatformInstitutionInfo | null | undefined): string {
  const color = institution?.portal?.primary_color?.trim();
  if (color && /^#[0-9A-Fa-f]{3,8}$/.test(color)) {
    return color;
  }
  return DEFAULT_PORTAL_PRIMARY;
}

export function portalThemeStyle(primary: string): CSSProperties {
  return {
    ["--institution-primary" as string]: primary,
    ["--institution-primary-dark" as string]: primary,
  };
}
