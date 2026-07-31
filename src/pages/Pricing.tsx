import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HUB } from "@/lib/hubConfig";
import { CheckCircle2, CreditCard, Loader2, Smartphone } from "lucide-react";
import api from "@/api/axios";
import { useToast } from "@/components/ui/use-toast";

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

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [momoRef, setMomoRef] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    api.get("/meet/plans").then((res) => {
      const p: Plan[] = res.data?.plans ?? [];
      setPlans(p);
      const slug = searchParams.get("plan");
      if (slug) {
        setSelectedPlan(p.find((x) => x.slug === slug) ?? null);
      }
    }).finally(() => setLoading(false));
  }, [searchParams]);

  const institutionId = localStorage.getItem("parrot_institution_id");
  const userId = localStorage.getItem("parrot_user_id");
  const isLoggedIn = Boolean(localStorage.getItem("parrot_login_success") && (userId || localStorage.getItem("parrot_student_id")));
  const [payments, setPayments] = useState<{ stripe?: { enabled: boolean }; mopay?: { enabled: boolean } } | null>(null);

  useEffect(() => {
    api.get("/meet/payments/config").then((res) => setPayments(res.data)).catch(() => setPayments(null));
  }, []);

  const requireLogin = () => {
    toast({ title: "Sign in required", description: "Log in to subscribe and link billing to your account.", variant: "destructive" });
    navigate("/login?redirect=/pricing");
  };

  const subscribeStripe = async (plan: Plan) => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    setSubscribing(plan.id);
    try {
      const res = await api.post("/meet/subscribe", {
        plan_id: plan.id,
        institution_id: institutionId ? parseInt(institutionId) : null,
        user_id: userId ? parseInt(userId) : null,
        provider: "stripe",
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast({ title: "Error", description: res.data.message ?? "Could not start checkout.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Stripe checkout failed.", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const subscribeMomo = async (plan: Plan) => {
    if (!isLoggedIn) {
      requireLogin();
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Phone required", description: "Enter your MTN/Airtel number.", variant: "destructive" });
      return;
    }
    setSubscribing(plan.id);
    try {
      const subRes = await api.post("/meet/subscribe", {
        plan_id: plan.id,
        institution_id: institutionId ? parseInt(institutionId) : null,
        user_id: userId ? parseInt(userId) : null,
        provider: "mopay",
      });
      const subId = subRes.data.subscription_id;
      const payRes = await api.post("/meet/subscription/momo/request", {
        subscription_id: subId,
        phone: phone.trim(),
        mno: "mtn",
      });
      if (payRes.data.ok) {
        setMomoRef(payRes.data.reference);
        setSelectedPlan(plan);
        pollMomo(payRes.data.reference);
        toast({ title: "Check your phone", description: "Approve the Mobile Money prompt." });
      } else {
        toast({ title: "Payment failed", description: payRes.data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Mobile Money request failed.", variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  const pollMomo = (ref: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/meet/subscription/momo/status/${ref}`);
        if (res.data.status === "paid") {
          clearInterval(interval);
          navigate("/subscription/success");
        } else if (res.data.status === "failed" || attempts >= 12) {
          clearInterval(interval);
          toast({ title: "Payment not confirmed", description: "Try again or contact support.", variant: "destructive" });
        }
      } catch {
        if (attempts >= 12) clearInterval(interval);
      }
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <img src={HUB.logoIcon} alt="" className="h-10 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Choose your plan</h1>
          <p className="text-slate-400">Monthly billing. Credits track your meeting usage.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`bg-white/5 border-white/10 cursor-pointer transition-all hover:border-[#D4AF37]/50 ${selectedPlan?.id === plan.id ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/50" : ""}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader>
                {plan.slug === "professional" && <Badge className="w-fit bg-[#D4AF37] text-black">Popular</Badge>}
                <CardTitle>{plan.name}</CardTitle>
                <p className="text-2xl font-bold text-[#D4AF37]">${plan.price_usd}<span className="text-sm text-slate-400">/mo</span></p>
                <p className="text-xs text-slate-500">{plan.price_rwf.toLocaleString()} RWF</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                <ul className="space-y-2 text-sm">
                  {(plan.features ?? []).slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <Card className="max-w-lg mx-auto bg-white/5 border-[#D4AF37]/30">
            <CardHeader>
              <CardTitle>Subscribe to {selectedPlan.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={payments?.stripe?.enabled ? "stripe" : "momo"}>
                <TabsList className="grid w-full grid-cols-2 bg-white/5">
                  <TabsTrigger value="stripe" disabled={!payments?.stripe?.enabled}>
                    <CreditCard className="h-4 w-4 mr-2" />Card (USD)
                  </TabsTrigger>
                  <TabsTrigger value="momo" disabled={!payments?.mopay?.enabled}>
                    <Smartphone className="h-4 w-4 mr-2" />Mobile Money
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="stripe" className="mt-4">
                  {!payments?.stripe?.enabled ? (
                    <p className="text-sm text-slate-400 mb-4">Card payments are not configured yet.</p>
                  ) : (
                    <>
                  <p className="text-sm text-slate-400 mb-4">${selectedPlan.price_usd}/month via Stripe — real recurring billing</p>
                  <Button
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#c9a030]"
                    disabled={subscribing === selectedPlan.id}
                    onClick={() => subscribeStripe(selectedPlan)}
                  >
                    {subscribing === selectedPlan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with Card"}
                  </Button>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="momo" className="mt-4 space-y-4">
                  {!payments?.mopay?.enabled ? (
                    <p className="text-sm text-slate-400">Mobile Money is not configured yet.</p>
                  ) : (
                    <>
                  <div>
                    <Label htmlFor="phone">MTN / Airtel number</Label>
                    <Input
                      id="phone"
                      placeholder="078xxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-white/5 border-white/10 mt-1"
                    />
                  </div>
                  <p className="text-sm text-slate-400">{selectedPlan.price_rwf.toLocaleString()} RWF/month</p>
                  <Button
                    className="w-full bg-[#D4AF37] text-black hover:bg-[#c9a030]"
                    disabled={subscribing === selectedPlan.id || !!momoRef}
                    onClick={() => subscribeMomo(selectedPlan)}
                  >
                    {momoRef ? "Waiting for approval…" : "Pay with Mobile Money"}
                  </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
