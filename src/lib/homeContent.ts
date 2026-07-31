import { HUB, MEET_FEATURES } from "./hubConfig";
import { HOME_UNIQUE_IMAGES } from "./homeImages";

export { HUB, MEET_FEATURES };

export const HOME_IMAGES = {
  heroMain: HOME_UNIQUE_IMAGES.heroMain,
  heroSecondary: HOME_UNIQUE_IMAGES.heroSecondary,
  marketplace: HOME_UNIQUE_IMAGES.mission,
  liveClass: HOME_UNIQUE_IMAGES.liveClass,
  certificate: HOME_UNIQUE_IMAGES.instructor,
  ctaBg: HOME_UNIQUE_IMAGES.ctaBg,
} as const;

export const EXAM_PROGRAMS = [] as const;
export const LANGUAGE_PROGRAMS = [] as const;
export const LANGUAGE_SPEAKING_CLIPS = [] as const;
export const LEARN_PILL_FALLBACK = "Meetings & Webinars";
export const FEATURED_PROGRAM_FALLBACK = { title: "Xander Meet", desc: HUB.tagline, image: HOME_IMAGES.heroMain };

export const HOME_MISSION = {
  vision:
    "A standalone meeting platform where organizations host professional video conferences, webinars, and live events — with transparent usage-based credits and monthly subscriptions.",
  mission:
    "To deliver enterprise-grade meeting infrastructure for African and global teams, powered by Daily.co, with flexible Mobile Money and card payments.",
} as const;

export const LIVE_FEATURES = [
  {
    title: "Video Meetings",
    desc: "Crystal-clear HD meetings with screen sharing, chat, and moderation controls.",
    icon: "video",
  },
  {
    title: "Webinars",
    desc: "Host large-scale webinars with registration, Q&A, polls, and stage management.",
    icon: "radio",
  },
  {
    title: "Live Cohorts",
    desc: "Queue-based 1:1 sessions with host studio and participant management.",
    icon: "users",
  },
  {
    title: "Recordings",
    desc: "Cloud recording with secure storage included in your plan.",
    icon: "recording",
  },
  {
    title: "Scheduling",
    desc: "Public registration pages, appointment booking, and automated reminders.",
    icon: "calendar",
  },
  {
    title: "Multi-Tenant",
    desc: "White-label portals for each organization with custom branding.",
    icon: "building",
  },
] as const;

export const STUDENT_FEATURES = LIVE_FEATURES;

export const STATS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "1,000", label: "Max Participants" },
  { value: "500 GB", label: "Storage Available" },
  { value: "24/7", label: "Support" },
] as const;

export const TESTIMONIALS = [
  {
    name: "Emmanuel N.",
    role: "Operations Director",
    quote: "Xander Meet replaced our scattered Zoom links with one professional platform. Mobile Money billing made it easy for our Rwanda team.",
  },
  {
    name: "Sarah K.",
    role: "Event Coordinator",
    quote: "The webinar registration and Q&A features are exactly what we needed for our monthly town halls.",
  },
  {
    name: "Jean Hakizimana",
    role: "IT Manager",
    quote: "Multi-tenant setup let us give each department their own branded meeting portal. Credits tracking keeps costs predictable.",
  },
] as const;

export const PRICING_HIGHLIGHTS = [
  "Monthly billing — pay per plan, not per minute",
  "Credits track Daily.co usage transparently",
  "Upgrade anytime as your team grows",
  "Stripe (USD) or Mobile Money (RWF)",
] as const;
