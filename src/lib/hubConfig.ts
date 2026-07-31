export const HUB = {
  name: "Xander Meet",
  company: "Xander Tech LLC",
  poweredBy: "Powered by Xander Tech",
  slogan: "Meet. Connect. Collaborate.",
  tagline: "Professional video meetings, webinars, and live events — multi-tenant, secure, and powered by Daily.co.",
  supportEmail: "meet@xandertech.llc",
  supportPhone: "+250 788 797 673",
  logoFull: "/brand/xander-meet-logo.png",
  logoIcon: "/brand/xander-x-gold.png",
  domain: "meet.xandertech.llc",
} as const;

export const MEET_FEATURES = [
  "HD video meetings & webinars",
  "Up to 1,000 participants",
  "Cloud recording & storage",
  "Meeting registrations & scheduling",
  "Live cohorts & queue management",
  "Q&A, polls & breakout rooms",
  "Multi-tenant white-label portals",
  "Mobile Money & Stripe billing",
] as const;

export type HubRole =
  | "admin"
  | "staff"
  | "meeting_user"
  | "partner_company"
  | "host"
  | "learner"
  | "instructor";

export function dashboardPathForRole(role: string): string {
  switch (role) {
    case "admin":
    case "staff":
    case "partner_company":
      return "/dashboard/admin";
    case "meeting_user":
    case "host":
      return "/dashboard/appointments";
    default:
      return "/dashboard/admin";
  }
}
