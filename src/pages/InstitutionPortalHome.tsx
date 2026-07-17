import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import InstitutionPortalShell from "@/components/institution-portal/InstitutionPortalShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstitutionPortal } from "@/hooks/useInstitutionPortal";
import { HUB } from "@/lib/hubConfig";
import { AlertCircle, ArrowRight, BookOpen, GraduationCap, Loader2, Sparkles } from "lucide-react";

const InstitutionPortalHome = () => {
  const { slug: routeSlug = "" } = useParams<{ slug: string }>();
  const { data, loading, error, institution } = useInstitutionPortal(routeSlug);
  const portal = institution?.portal;

  useEffect(() => {
    if (!institution) return;
    document.title = institution.name;
    return () => {
      document.title = HUB.name;
    };
  }, [institution]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
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
  const features = portal?.features ?? [];

  return (
    <InstitutionPortalShell institution={institution} activeSection="home">
      {/* Stats */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-3xl font-bold text-[var(--institution-primary)]">{data.stats.programs_count}</p>
              <p className="mt-1 text-sm text-slate-600">Programs</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-3xl font-bold text-[var(--institution-primary)]">{data.stats.courses_count}</p>
              <p className="mt-1 text-sm text-slate-600">Courses</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:col-span-1">
              <p className="text-3xl font-bold text-[var(--institution-primary)]">24/7</p>
              <p className="mt-1 text-sm text-slate-600">Online access</p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="scroll-mt-24 py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--institution-primary)]">Our programs</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Learning paths at {institution.name}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-600">
              Browse published programs and courses available for enrollment.
            </p>
          </div>

          {data.programs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-slate-500">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                Programs will appear here once published by {institution.name}.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {data.programs.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg text-[var(--institution-primary)]">
                        <GraduationCap className="h-5 w-5" />
                        {program.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {program.description && (
                        <p className="text-sm text-slate-600 line-clamp-3">{program.description}</p>
                      )}
                      {program.courses && program.courses.length > 0 ? (
                        <ul className="space-y-1.5 text-sm text-slate-700">
                          {program.courses.slice(0, 5).map((course) => (
                            <li key={course.id} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--institution-primary)]" />
                              {course.title}
                            </li>
                          ))}
                          {program.courses.length > 5 && (
                            <li className="text-xs text-slate-500">+{program.courses.length - 5} more courses</li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Courses coming soon.</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Button asChild size="lg" className="rounded-full bg-[var(--institution-button-bg)] text-[var(--institution-button-text)] hover:opacity-90">
              <NavLink to={joinUrl}>
                {portal?.cta_label ?? "Start enrollment"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </NavLink>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--institution-primary)]">Why choose us</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Built for modern learners</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={`${feature.title}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6"
                >
                  <Sparkles className="mb-3 h-6 w-6 text-[var(--institution-primary)]" />
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      <section id="about" className="scroll-mt-24 py-14 sm:py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--institution-primary)]">About us</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{institution.name}</h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 whitespace-pre-line">{portal?.about}</p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="scroll-mt-24 bg-[var(--institution-hero-bg)] py-14 text-white sm:py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Create your learner account or sign in to access programs at {institution.name}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="rounded-full bg-[var(--institution-button-bg)] text-[var(--institution-button-text)] hover:opacity-90">
              <NavLink to={joinUrl}>{portal?.cta_label ?? "Register now"}</NavLink>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <NavLink to={`/login/${slug}`}>Sign in</NavLink>
            </Button>
          </div>
          {institution.contact_email && (
            <p className="mt-6 text-sm text-white/75">
              Questions?{" "}
              <a href={`mailto:${institution.contact_email}`} className="font-semibold underline underline-offset-2">
                {institution.contact_email}
              </a>
            </p>
          )}
        </div>
      </section>
    </InstitutionPortalShell>
  );
};

export default InstitutionPortalHome;
