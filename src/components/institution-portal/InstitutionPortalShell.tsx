import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import type { PlatformInstitutionInfo } from "@/api/axios";
import { resolveInstitutionLogoUrl } from "@/lib/institutionContext";
import { portalThemeStyle, resolvePortalTheme } from "@/lib/institutionPortal";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Globe,
  LogIn,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
} from "lucide-react";

export type PortalNavSection = "home" | "programs" | "about" | "contact" | "join" | "login";

const SECTION_IDS: PortalNavSection[] = ["home", "programs", "about", "contact"];

type Props = {
  institution: PlatformInstitutionInfo;
  activeSection?: PortalNavSection;
  children: React.ReactNode;
  className?: string;
  compactHero?: boolean;
};

function portalHomePath(slug: string): string {
  return `/i/${encodeURIComponent(slug)}`;
}

function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth") {
  if (sectionId === "home") {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  const el = document.getElementById(sectionId);
  if (el) el.scrollIntoView({ behavior, block: "start" });
}

const InstitutionPortalShell = ({
  institution,
  activeSection = "home",
  children,
  className,
  compactHero = false,
}: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hashSection, setHashSection] = useState<PortalNavSection | null>(null);

  const slug = institution.slug?.trim().toLowerCase() || "";
  const logo = resolveInstitutionLogoUrl(institution);
  const theme = resolvePortalTheme(institution);
  const portal = institution.portal;
  const homePath = slug ? portalHomePath(slug) : "/";
  const joinUrl = slug ? `/join/${slug}` : "/signup";
  const loginUrl = slug ? `/login/${slug}` : "/login";
  const onPortalHome = location.pathname.replace(/\/$/, "") === homePath;

  useEffect(() => {
    const id = "institution-portal-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);

  const navItems = useMemo(
    () =>
      [
        { id: "home" as const, label: "Home", hash: "" },
        { id: "programs" as const, label: "Programs", hash: "programs" },
        { id: "about" as const, label: "About", hash: "about" },
        { id: "contact" as const, label: "Contact", hash: "contact" },
      ] as const,
    [],
  );

  const goToSection = useCallback(
    (section: PortalNavSection, hash: string) => {
      setMobileOpen(false);
      setHashSection(section);

      if (!onPortalHome) {
        navigate(hash ? `${homePath}#${hash}` : homePath);
        return;
      }

      if (hash) {
        window.history.replaceState(null, "", `${homePath}#${hash}`);
        scrollToSection(hash, "smooth");
      } else {
        window.history.replaceState(null, "", homePath);
        scrollToSection("home", "smooth");
      }
    },
    [homePath, navigate, onPortalHome],
  );

  useEffect(() => {
    if (!onPortalHome) return;
    const raw = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (!raw || !SECTION_IDS.includes(raw as PortalNavSection)) {
      if (!location.hash) setHashSection("home");
      return;
    }
    setHashSection(raw as PortalNavSection);
    const t = window.setTimeout(() => scrollToSection(raw, "smooth"), 80);
    return () => window.clearTimeout(t);
  }, [onPortalHome, location.hash, location.pathname]);

  useEffect(() => {
    if (!onPortalHome || compactHero) return;
    const observers: IntersectionObserver[] = [];
    const ratios = new Map<string, number>();

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
          let best: PortalNavSection = "home";
          let bestRatio = 0;
          ratios.forEach((ratio, key) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = key as PortalNavSection;
            }
          });
          if (bestRatio > 0.15) setHashSection(best);
        },
        { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.2, 0.4, 0.6] },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [onPortalHome, compactHero, institution.id]);

  const currentSection: PortalNavSection =
    hashSection ??
    (activeSection === "join" || activeSection === "login" ? activeSection : activeSection);

  const linkClass = (section: PortalNavSection) =>
    cn(
      "text-sm font-semibold transition-colors",
      currentSection === section
        ? "text-[var(--institution-primary)]"
        : "text-slate-600 hover:text-[var(--institution-primary)]",
    );

  return (
    <div
      className={cn(
        "institution-portal min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900",
        "font-[Manrope,ui-sans-serif,system-ui,sans-serif]",
        className,
      )}
      style={portalThemeStyle(theme)}
    >
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-3.5">
          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => goToSection("home", "")}
          >
            {logo ? (
              <img
                src={logo}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover sm:h-11 sm:w-11"
              />
            ) : (
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white sm:h-11 sm:w-11"
                style={{ background: "var(--institution-primary)" }}
              >
                {institution.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                {institution.name}
              </p>
              {portal?.tagline && (
                <p className="hidden truncate text-[11px] text-slate-500 sm:block max-w-[240px]">{portal.tagline}</p>
              )}
            </div>
          </button>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Institution website">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={linkClass(item.id)}
                onClick={() => goToSection(item.id, item.hash)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full font-semibold text-slate-700 hover:bg-slate-100"
            >
              <NavLink to={loginUrl}>
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </NavLink>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 font-semibold text-[var(--institution-button-text)] hover:opacity-90"
              style={{ background: "var(--institution-button-bg)" }}
            >
              <NavLink to={joinUrl}>Learn for free</NavLink>
            </Button>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-3" aria-label="Institution website mobile">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(linkClass(item.id), "text-left")}
                  onClick={() => goToSection(item.id, item.hash)}
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <Button asChild variant="outline" className="w-full rounded-full">
                  <NavLink to={loginUrl} onClick={() => setMobileOpen(false)}>
                    Sign in
                  </NavLink>
                </Button>
                <Button
                  asChild
                  className="w-full rounded-full text-[var(--institution-button-text)] hover:opacity-90"
                  style={{ background: "var(--institution-button-bg)" }}
                >
                  <NavLink to={joinUrl} onClick={() => setMobileOpen(false)}>
                    Learn for free
                  </NavLink>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {!compactHero && onPortalHome && portal && (
        <section
          id="home"
          className="relative scroll-mt-24 overflow-hidden border-b border-slate-200/70"
          style={{
            background:
              "radial-gradient(1200px 480px at 50% -10%, color-mix(in srgb, var(--institution-accent) 22%, white), transparent 60%), linear-gradient(180deg, #ffffff 0%, #F7F8FA 100%)",
          }}
        >
          {portal.hero_image_url && (
            <img
              src={portal.hero_image_url}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
            />
          )}
          <div className="container relative mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
            <p
              className="mb-4 text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: "var(--institution-accent)" }}
            >
              {institution.name}
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              {portal.hero_title}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">{portal.hero_subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full px-8 text-base font-bold text-[var(--institution-button-text)] shadow-lg hover:opacity-90"
                style={{
                  background: "var(--institution-button-bg)",
                  boxShadow: "0 12px 30px color-mix(in srgb, var(--institution-primary) 25%, transparent)",
                }}
              >
                <NavLink to={joinUrl}>
                  {portal.cta_label || "Learn for free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </NavLink>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-slate-300 bg-white px-8 text-base font-semibold text-slate-800 hover:bg-slate-50"
              >
                <NavLink to={loginUrl}>Sign in to your account</NavLink>
              </Button>
            </div>
            {portal.tagline && (
              <p className="mt-6 text-sm font-medium text-slate-500">{portal.tagline}</p>
            )}
          </div>
        </section>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{institution.name}</h3>
              {portal?.tagline && <p className="mt-2 text-sm text-slate-600">{portal.tagline}</p>}
              <p className="mt-3 max-w-sm text-sm text-slate-500">
                Programs and enrollment for learners at {institution.name} — built for real progress.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Explore</p>
              <ul className="mt-3 space-y-2 text-sm">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="font-medium text-slate-700 hover:text-[var(--institution-primary)]"
                      onClick={() => goToSection(item.id, item.hash)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact</p>
              {institution.contact_email && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                  <a href={`mailto:${institution.contact_email}`} className="hover:underline">
                    {institution.contact_email}
                  </a>
                </p>
              )}
              {institution.contact_phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                  <a href={`tel:${institution.contact_phone}`} className="hover:underline">
                    {institution.contact_phone}
                  </a>
                </p>
              )}
              {institution.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                  {institution.address}
                </p>
              )}
              {institution.website && (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                  <a
                    href={institution.website.startsWith("http") ? institution.website : `https://${institution.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {institution.website.replace(/^https?:\/\//, "")}
                  </a>
                </p>
              )}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <span>
              © {new Date().getFullYear()} {institution.name}. All rights reserved.
            </span>
            <span>Institution learning portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InstitutionPortalShell;
