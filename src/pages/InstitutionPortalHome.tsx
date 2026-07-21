import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import InstitutionPortalShell from "@/components/institution-portal/InstitutionPortalShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInstitutionPortal } from "@/hooks/useInstitutionPortal";
import { HUB } from "@/lib/hubConfig";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Globe,
  Headphones,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Quote,
  Search,
  Shield,
  Sparkles,
  Video,
} from "lucide-react";

const CARD_TONES = [
  "from-[#E8F6F1] to-[#F4FCFA]",
  "from-[#EEF2FF] to-[#F8FAFF]",
  "from-[#FFF4E8] to-[#FFFBF5]",
  "from-[#F3E8FF] to-[#FBF7FF]",
  "from-[#E8F4FF] to-[#F5FBFF]",
  "from-[#FFE8F0] to-[#FFF7FA]",
];

const InstitutionPortalHome = () => {
  const { slug: routeSlug = "" } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error, institution } = useInstitutionPortal(routeSlug);
  const portal = institution?.portal;
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!institution) return;
    document.title = institution.name;
    return () => {
      document.title = HUB.name;
    };
  }, [institution]);

  useEffect(() => {
    if (loading || !data) return;
    const hash = (location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (!hash) return;
    const t = window.setTimeout(() => {
      if (hash === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [loading, data, location.hash]);

  const filteredPrograms = useMemo(() => {
    const programs = data?.programs ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((program) => {
      const inName = program.name.toLowerCase().includes(q);
      const inDesc = (program.description || "").toLowerCase().includes(q);
      const inCourses = (program.courses || []).some((c) => c.title.toLowerCase().includes(q));
      return inName || inDesc || inCourses;
    });
  }, [data?.programs, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA]">
        <Loader2 className="h-9 w-9 animate-spin text-[var(--institution-primary,#012F6B)]" />
      </div>
    );
  }

  if (error || !institution || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="text-xl font-bold text-slate-800">Website unavailable</h1>
        <p className="mt-2 max-w-md text-slate-600">{error ?? "This institution link is not valid."}</p>
      </div>
    );
  }

  const slug = institution.slug;
  const joinUrl = `/join/${slug}`;
  const loginUrl = `/login/${slug}`;
  const features = (portal?.features ?? []).filter((f) => f.title.trim() || f.description.trim());
  const websiteHref = institution.website
    ? institution.website.startsWith("http")
      ? institution.website
      : `https://${institution.website}`
    : null;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    document.getElementById("programs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const defaultFeatures = [
    {
      title: "Real progress",
      description: `Structured programs from ${institution.name} for practical skills you can use immediately.`,
      icon: Sparkles,
    },
    {
      title: "Live online classes",
      description: "Join interactive sessions with instructors and classmates from anywhere.",
      icon: Video,
    },
    {
      title: "Supportive learning",
      description: "Track courses, quizzes, and certificates in one learner dashboard.",
      icon: CheckCircle2,
    },
  ];

  const displayFeatures =
    features.length > 0
      ? features.map((f, i) => ({
          title: f.title,
          description: f.description,
          icon: [Sparkles, Video, CheckCircle2][i % 3],
        }))
      : defaultFeatures;

  const testimonials = [
    {
      quote: `${institution.name} made it easy to stay consistent and finally finish the courses I started.`,
      name: "Alex M.",
      context: "Learner",
    },
    {
      quote: "Live classes and clear programs helped me prepare with confidence.",
      name: "Samira K.",
      context: "Exam prep",
    },
    {
      quote: "Enrollment was simple, and everything I needed was in one place.",
      name: "Jordan P.",
      context: "Career skills",
    },
  ];

  return (
    <InstitutionPortalShell institution={institution} activeSection="home">
      {/* Search — Busuu-style "I want to learn" */}
      <section className="border-b border-slate-200/80 bg-white py-10 sm:py-12">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            I want to learn
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Search programs and courses published by {institution.name}
          </p>
          <form onSubmit={handleSearch} className="mx-auto mt-6 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Subject, exam, or course..."
                className="h-12 rounded-full border-slate-200 bg-slate-50 pl-10 text-base shadow-sm focus-visible:ring-[var(--institution-primary)]"
              />
            </div>
            <Button
              type="submit"
              className="h-12 rounded-full px-6 font-bold text-[var(--institution-button-text)] hover:opacity-90"
              style={{ background: "var(--institution-button-bg)" }}
            >
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-slate-200/80 bg-[#F7F8FA] py-5">
        <div className="container mx-auto grid max-w-5xl grid-cols-1 gap-3 px-4 sm:grid-cols-3">
          {[
            { icon: Headphones, label: "24/7 online access" },
            { icon: Shield, label: "Secure enrollment" },
            { icon: Award, label: "Expert-led programs" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100"
            >
              <item.icon className="h-4 w-4 text-[var(--institution-primary)]" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-12 sm:py-14">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: String(data.stats.programs_count), label: "Programs" },
              { value: String(data.stats.courses_count), label: "Courses" },
              { value: "Live", label: "Online classes" },
              { value: "24/7", label: "Learning access" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-3xl font-extrabold tracking-tight sm:text-4xl"
                  style={{ color: "var(--institution-primary)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs — Busuu language-card style */}
      <section id="programs" className="scroll-mt-24 bg-[#F7F8FA] py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
              Our programs
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Choose what to learn at {institution.name}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Only programs and courses published by this institution appear here.
            </p>
          </div>

          {filteredPrograms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-500">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              {searchQuery.trim()
                ? `No programs match “${searchQuery.trim()}”.`
                : `Programs will appear here once published by ${institution.name}.`}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPrograms.map((program, index) => {
                const courseCount = program.courses?.length ?? 0;
                return (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${CARD_TONES[index % CARD_TONES.length]} p-5 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-extrabold text-slate-900">{program.name}</h3>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                        style={{ background: "var(--institution-primary)" }}
                      >
                        {courseCount} {courseCount === 1 ? "course" : "courses"}
                      </span>
                    </div>
                    {program.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{program.description}</p>
                    )}
                    {courseCount > 0 ? (
                      <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
                        {program.courses!.slice(0, 4).map((course) => (
                          <li key={course.id} className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: "var(--institution-primary)" }}
                            />
                            <span>
                              {course.title}
                              {course.duration ? (
                                <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
                                  <Clock3 className="h-3 w-3" />
                                  {course.duration}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                        {courseCount > 4 && (
                          <li className="text-xs text-slate-500">+{courseCount - 4} more courses</li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm text-slate-500">Courses coming soon.</p>
                    )}
                    <Button
                      asChild
                      size="sm"
                      className="mt-5 rounded-full font-semibold text-[var(--institution-button-text)] hover:opacity-90"
                      style={{ background: "var(--institution-button-bg)" }}
                    >
                      <NavLink to={joinUrl}>
                        Enroll
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </NavLink>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 font-bold text-[var(--institution-button-text)] hover:opacity-90"
              style={{ background: "var(--institution-button-bg)" }}
            >
              <NavLink to={joinUrl}>
                {portal?.cta_label ?? "Start enrollment"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </NavLink>
            </Button>
          </div>
        </div>
      </section>

      {/* What makes us different */}
      <section className="bg-white py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
              Why learners choose us
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              What makes {institution.name} different?
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {displayFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={`${feature.title}-${index}`}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-3xl border border-slate-100 bg-[#F7F8FA] p-6"
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                    style={{ background: "var(--institution-primary)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live learning */}
      <section className="border-y border-slate-200 bg-[#F7F8FA] py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-100 sm:p-10 md:grid md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
                Live learning
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Interactive online classes
              </h2>
              <p className="mt-3 max-w-xl text-slate-600">
                Enroll at {institution.name} to access live sessions, course materials, and your learner
                dashboard — all in one place.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                {[
                  "Live classes with instructors",
                  "Progress tracking and certificates",
                  "Secure learner login for this institution only",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--institution-primary)]" />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="rounded-full font-bold text-[var(--institution-button-text)] hover:opacity-90"
                  style={{ background: "var(--institution-button-bg)" }}
                >
                  <NavLink to={joinUrl}>Start learning today</NavLink>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white font-semibold">
                  <NavLink to={loginUrl}>Sign in</NavLink>
                </Button>
              </div>
            </div>
            <div
              className="mt-8 flex min-h-[180px] items-center justify-center rounded-3xl p-6 md:mt-0"
              style={{
                background:
                  "linear-gradient(145deg, color-mix(in srgb, var(--institution-primary) 88%, black), color-mix(in srgb, var(--institution-accent) 70%, white))",
              }}
            >
              <div className="text-center text-white">
                <Video className="mx-auto mb-3 h-10 w-10 opacity-90" />
                <p className="text-lg font-extrabold">Learn for real life</p>
                <p className="mt-1 text-sm text-white/80">Join {institution.name} online</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
              Learner stories
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Why learners love {institution.name}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item, index) => (
              <motion.blockquote
                key={item.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="rounded-3xl border border-slate-100 bg-[#F7F8FA] p-6"
              >
                <Quote className="mb-3 h-5 w-5 text-[var(--institution-primary)]" />
                <p className="text-sm leading-relaxed text-slate-700">“{item.quote}”</p>
                <footer className="mt-4">
                  <p className="text-sm font-extrabold text-slate-900">{item.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.context}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="scroll-mt-24 border-t border-slate-200 bg-[#F7F8FA] py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--institution-accent)]">
                About us
              </p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{institution.name}</h2>
              <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-600">{portal?.about}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-extrabold text-slate-900">At a glance</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                <li>
                  <span className="font-semibold text-slate-900">Institution:</span> {institution.name}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Published programs:</span>{" "}
                  {data.stats.programs_count}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Active courses:</span>{" "}
                  {data.stats.courses_count}
                </li>
                {institution.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                    {institution.address}
                  </li>
                )}
                {websiteHref && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 shrink-0 text-[var(--institution-primary)]" />
                    <a href={websiteHref} target="_blank" rel="noreferrer" className="hover:underline">
                      {institution.website?.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / final CTA */}
      <section
        id="contact"
        className="scroll-mt-24 py-16 text-white sm:py-20"
        style={{
          background:
            "linear-gradient(135deg, var(--institution-hero-bg), color-mix(in srgb, var(--institution-primary) 85%, black))",
        }}
      >
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">Contact</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Ready to learn with {institution.name}?</h2>
              <p className="mt-3 max-w-xl text-white/85">
                Create your learner account or sign in to access programs published by this institution.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white px-8 font-bold text-slate-900 hover:bg-white/90"
                >
                  <NavLink to={joinUrl}>{portal?.cta_label ?? "Learn for free"}</NavLink>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/40 bg-transparent px-8 font-semibold text-white hover:bg-white/10"
                >
                  <NavLink to={loginUrl}>Sign in</NavLink>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm font-bold text-white">Contact details</p>
              <ul className="mt-4 space-y-3 text-sm text-white/90">
                {institution.contact_email && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-white/80" />
                    <a href={`mailto:${institution.contact_email}`} className="hover:underline">
                      {institution.contact_email}
                    </a>
                  </li>
                )}
                {institution.contact_phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-white/80" />
                    <a href={`tel:${institution.contact_phone}`} className="hover:underline">
                      {institution.contact_phone}
                    </a>
                  </li>
                )}
                {institution.address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-white/80" />
                    <span>{institution.address}</span>
                  </li>
                )}
                {websiteHref && (
                  <li className="flex items-center gap-3">
                    <Globe className="h-4 w-4 shrink-0 text-white/80" />
                    <a href={websiteHref} target="_blank" rel="noreferrer" className="hover:underline">
                      {institution.website?.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
                {!institution.contact_email && !institution.contact_phone && !institution.address && !websiteHref && (
                  <li className="text-white/75">
                    Contact information will appear here once {institution.name} publishes it.
                  </li>
                )}
              </ul>
              <Button
                type="button"
                variant="secondary"
                className="mt-6 w-full rounded-full bg-white font-semibold text-slate-900 hover:bg-white/90"
                onClick={() => navigate(joinUrl)}
              >
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </InstitutionPortalShell>
  );
};

export default InstitutionPortalHome;
