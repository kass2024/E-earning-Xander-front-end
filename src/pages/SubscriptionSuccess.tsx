import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { HUB } from "@/lib/hubConfig";
import api from "@/api/axios";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setConfirming(false);
      return;
    }

    api.post("/meet/subscription/confirm-stripe", { session_id: sessionId })
      .then((res) => {
        if (!res.data.ok) setError(res.data.message ?? "Confirmation failed.");
      })
      .catch(() => setError("Could not confirm payment."))
      .finally(() => setConfirming(false));
  }, [searchParams]);

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
              <p className="text-slate-400 mb-6">Your subscription is active. Start hosting meetings now.</p>
              <Button
                className="bg-[#D4AF37] text-black hover:bg-[#c9a030] w-full"
                onClick={() => navigate("/dashboard/admin")}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
