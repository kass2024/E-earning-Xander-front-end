import { isXanderMeet } from "./product";

const ACADEMY_HUB = {
  name: "Xander Learning Hub",
  company: "Xander Global Scholars",
  poweredBy: "Powered by Xander Global Scholars",
  slogan: "Study. Learn. Succeed Globally.",
  tagline: "Consultant for Study, Work, and Travel Abroad",
  supportEmail: "info@xanderglobalacademy.com",
  supportPhone: "+250 788 797 673",
  logoFull: "/logo.png",
  logoIcon: "/logo.png",
  domain: "xanderglobalacademy.com",
} as const;

const MEET_HUB = {
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

export const HUB = isXanderMeet() ? MEET_HUB : ACADEMY_HUB;

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

export const EXAM_CATEGORIES = [
  "IELTS Preparation",
  "TOEFL Preparation",
  "Duolingo English Test (DET)",
  "PTE Academic",
  "Cambridge English",
  "SAT / GRE / GMAT",
] as const;

export const LANGUAGE_CATEGORIES = [
  "English (Academic, Business, General)",
  "French (DELF/DALF)",
  "German (Goethe, TestDaF)",
  "Korean (TOPIK)",
  "Chinese (HSK)",
  "Japanese (JLPT)",
  "Spanish & Arabic",
] as const;

export const PLATFORM_USERS = [
  {
    id: 24,
    name: "JEANDEDIEU Hakizimana",
    email: "info@xanderglobalscholars.com",
    role: "admin",
    description: "Full platform access — users, courses, payments, Zoom, reports.",
  },
  {
    id: 29,
    name: "Emmanuel Niyonzima",
    email: "emmanuel@xanderglobalscholars.com",
    role: "staff",
    description: "Operations access — courses, students, classes, meeting schedules.",
  },
  {
    id: 28,
    name: "NDIKUMANA Eric",
    email: "ndikumanaeric001@gmail.com",
    role: "meeting_user",
    description: "Meeting coordinator — review and approve webinar registrations.",
  },
] as const;

export type HubRole =
  | "learner"
  | "instructor"
  | "admin"
  | "staff"
  | "meeting_user"
  | "partner_company"
  | "host";

export function dashboardPathForRole(role: string): string {
  if (isXanderMeet()) {
    switch (role) {
      case "meeting_user":
      case "host":
        return "/dashboard/appointments";
      default:
        return "/dashboard/admin";
    }
  }

  switch (role) {
    case "admin":
    case "staff":
    case "partner_company":
      return "/dashboard/admin";
    case "instructor":
      return "/dashboard/instructor";
    case "meeting_user":
      return "/dashboard/appointments";
    default:
      return "/dashboard/learner";
  }
}
