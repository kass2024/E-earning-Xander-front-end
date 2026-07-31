import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";
import { HUB, dashboardPathForRole } from "@/lib/hubConfig";
import api, { loginUnified } from "@/api/axios";
import { useToast } from "@/components/ui/use-toast";

type AccountInfo = {
  email: string;
  name?: string;
  password?: string | null;
  created?: boolean;
};

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const ref = searchParams.get("ref");

    const stored = sessionStorage.getItem("meet_new_account");
    if (stored) {
      try {
        setAccount(JSON.parse(stored) as AccountInfo);
        sessionStorage.removeItem("meet_new_account");
      } catch {
        /* ignore */
      }
    }

    if (sessionId) {
      api.post("/meet/subscription/confirm-stripe", { session_id: sessionId })
        .then((res) => {
          if (!res.data.ok) {
            setError(res.data.message ?? "Confirmation failed.");
            return;
          }
          if (res.data.account) {
            setAccount(res.data.account as AccountInfo);
          }
        })
        .catch(() => setError("Could not confirm payment."))
        .finally(() => setConfirming(false));
      return;
    }

    if (ref) {
      api.get(`/meet/subscription/momo/status/${encodeURIComponent(ref)}`)
        .then((res) => {
          if (res.data.status !== "paid") {
            setError(res.data.message ?? "Payment not confirmed yet.");
            return;
          }
          if (res.data.account) {
            setAccount(res.data.account as AccountInfo);
          }
        })
        .catch(() => setError("Could not confirm Mobile Money payment."))
        .finally(() => setConfirming(false));
      return;
    }

    setConfirming(false);
  }, [searchParams]);

  const copyCredentials = () => {
    if (!account?.email || !account.password) return;
    const text = `Xander Meet login\nEmail: ${account.email}\nPassword: ${account.password}\nURL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied", description: "Login credentials copied to clipboard." });
    });
  };

  const goToDashboard = async () => {
    if (account?.password && account.email) {
      setLoggingIn(true);
      try {
        const data = await loginUnified(account.email, account.password);
        const role = String(data?.role ?? "meeting_user");
        localStorage.setItem("parrot_user_role", role);
        localStorage.setItem("parrot_login_success", "1");
        localStorage.setItem("parrot_user_email", account.email);
        if (account.name) localStorage.setItem("parrot_user_name", account.name);
        const user = data?.user as { id?: number } | undefined;
        if (user?.id) localStorage.setItem("parrot_user_id", String(user.id));
        navigate(dashboardPathForRole(role));
        return;
      } catch {
        toast({ title: "Auto sign-in failed", description: "Use the credentials below to log in manually.", variant: "destructive" });
      } finally {
        setLoggingIn(false);
      }
    }
    navigate("/login");
  };

  if (confirming) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mb-4" />
        <p>Activating your subscription…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 text-white">
      <Card className="max-w-md w-full bg-white/5 border-[#D4AF37]/30">
        <CardContent className="pt-8 text-center">
          {error ? (
            <>
              <p className="text-red-400 mb-4">{error}</p>
              <Button onClick={() => navigate("/pricing")}>Try Again</Button>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-16 w-16 text-[#D4AF37] mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Welcome to {HUB.name}!</h1>
              <p className="text-slate-400 mb-6">Your subscription is active.</p>

              {account && (
                <div className="text-left bg-black/30 border border-white/10 rounded-lg p-4 mb-6 space-y-2">
                  <p className="text-sm font-medium text-[#D4AF37]">Your login credentials</p>
                  <p className="text-sm"><span className="text-slate-400">Email:</span> {account.email}</p>
                  {account.password ? (
                    <>
                      <p className="text-sm break-all"><span className="text-slate-400">Password:</span> {account.password}</p>
                      <p className="text-xs text-slate-500">Save these — you can change your password after signing in.</p>
                      <Button variant="outline" size="sm" className="mt-2 border-white/20" onClick={copyCredentials}>
                        <Copy className="h-4 w-4 mr-2" /> Copy credentials
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">Use your existing password for this email.</p>
                  )}
                </div>
              )}

              <Button
                className="bg-[#D4AF37] text-black hover:bg-[#c9a030] w-full"
                disabled={loggingIn}
                onClick={goToDashboard}
              >
                {loggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : account?.password ? "Sign in & go to dashboard" : "Go to login"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
