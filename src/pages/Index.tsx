import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HUB } from "@/lib/hubConfig";
import { HOME_MISSION, LIVE_FEATURES, STATS, TESTIMONIALS, PRICING_HIGHLIGHTS } from "@/lib/homeContent";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Radio,
  ShieldCheck,
  Users,
  Video,
  Zap,
} from "lucide-react";
import api from "@/api/axios";

type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string;
  max_participants: number;
  storage_gb: number;
  monthly_credits: number;
  estimated_meeting_hours: number;
  price_usd: number;
  price_rwf: number;
  features: string[];
};

const FEATURE_ICONS: Record<string, typeof Video> = {
  video: Video,
  radio: Radio,
  users: Users,
  recording: Video,
  calendar: Calendar,
  building: Building2,
};

const Index = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api.get("/meet/plans").then((res) => {
      setPlans(res.data?.plans ?? []);
    }).catch(() => setPlans([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#1a1200]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#001F3F]/30 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <img
              src={HUB.logoFull}
              alt="Xander Meet"
              className="h-20 mx-auto mb-6 object-contain"
            />
            <Badge className="mb-4 bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/20">
              {HUB.poweredBy}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-[#D4AF37] to-white bg-clip-text text-transparent">
              {HUB.slogan}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
              {HUB.tagline}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#D4AF37] text-black hover:bg-[#c9a030] font-semibold"
                onClick={() => navigate("/pricing")}
              >
                View Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => navigate("/meeting-registration")}
              >
                Book a Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-[#D4AF37]">{s.value}</p>
              <p className="text-sm text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need to host</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">{HOME_MISSION.mission}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIVE_FEATURES.map((f) => {
              const Icon = FEATURE_ICONS[f.icon] ?? Video;
              return (
                <Card key={f.title} className="bg-white/5 border-white/10 hover:border-[#D4AF37]/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="h-10 w-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-slate-400 text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      {plans.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[#D4AF37]/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Simple monthly plans</h2>
            <p className="text-slate-400 text-center mb-8">Pay monthly. Credits track your Daily.co usage.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`bg-white/5 border-white/10 ${plan.slug === "professional" ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/50" : ""}`}
                >
                  <CardHeader>
                    {plan.slug === "professional" && (
                      <Badge className="w-fit bg-[#D4AF37] text-black mb-2">Popular</Badge>
                    )}
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <p className="text-2xl font-bold text-[#D4AF37]">
                      ${plan.price_usd}<span className="text-sm text-slate-400 font-normal">/mo</span>
                    </p>
                    <p className="text-xs text-slate-500">{plan.price_rwf.toLocaleString()} RWF/mo</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D4AF37]" /> {plan.max_participants} participants</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D4AF37]" /> {plan.storage_gb} GB storage</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#D4AF37]" /> ~{plan.estimated_meeting_hours}h meetings/mo</li>
                    </ul>
                    <Button
                      className="w-full mt-4 bg-[#D4AF37] text-black hover:bg-[#c9a030]"
                      onClick={() => navigate(`/pricing?plan=${plan.slug}`)}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {PRICING_HIGHLIGHTS.map((h) => (
                <span key={h} className="flex items-center gap-1 text-sm text-slate-400">
                  <Zap className="h-3 w-3 text-[#D4AF37]" /> {h}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="h-5 w-5 text-[#D4AF37]" /> Secure Daily.co infrastructure
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="h-5 w-5 text-[#D4AF37]" /> Stripe & Mobile Money Rwanda
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <p className="text-slate-300 text-sm italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <img src={HUB.logoIcon} alt="" className="h-12 mx-auto mb-6 opacity-80" />
        <h2 className="text-3xl font-bold mb-4">Ready to host your next meeting?</h2>
        <p className="text-slate-400 mb-8">Start with a plan that fits your team. Upgrade as you grow.</p>
        <Button
          size="lg"
          className="bg-[#D4AF37] text-black hover:bg-[#c9a030] font-semibold"
          onClick={() => navigate("/pricing")}
        >
          Choose Your Plan <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
