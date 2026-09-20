import { useEffect, useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMeetingPaymentCheckout,
  requestMeetingMomoPayment,
  syncMomoPaymentStatus,
  type MeetingPaymentConfig,
} from "@/api/axios";
import { cn } from "@/lib/utils";

type PayTab = "stripe" | "momo";

type MeetingBookingPaymentStepProps = {
  registrationId: number;
  paymentConfig: MeetingPaymentConfig;
  defaultPhone?: string;
  onPaid: (info: { email?: string; scheduleLabel?: string }) => void;
  onBack: () => void;
};

export function MeetingBookingPaymentStep({
  registrationId,
  paymentConfig,
  defaultPhone = "",
  onPaid,
  onBack,
}: MeetingBookingPaymentStepProps) {
  const stripeOk = paymentConfig.stripe_configured;
  const momoOk = paymentConfig.mopay_configured;
  const [tab, setTab] = useState<PayTab>(stripeOk ? "stripe" : "momo");
  const [phone, setPhone] = useState(defaultPhone);
  const [mno, setMno] = useState<"mtn" | "airtel">("mtn");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [momoRef, setMomoRef] = useState<string | null>(null);
  const [momoHint, setMomoHint] = useState<string | null>(null);

  useEffect(() => {
    if (!stripeOk && momoOk) setTab("momo");
  }, [stripeOk, momoOk]);

  useEffect(() => {
    if (!momoRef) return;
    let cancelled = false;
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      if (attempts > 40 || cancelled) {
        window.clearInterval(timer);
        return;
      }
      try {
        const res = await syncMomoPaymentStatus(momoRef);
        const status = String(res.payment?.status ?? "").toLowerCase();
        if (["paid", "succeeded", "completed"].includes(status)) {
          window.clearInterval(timer);
          if (!cancelled) {
            onPaid({
              email: (res as { registration?: { email?: string } }).registration?.email,
              scheduleLabel: (res as { registration?: { schedule_label?: string } }).registration
                ?.schedule_label,
            });
          }
        } else if (status === "failed") {
          window.clearInterval(timer);
          if (!cancelled) {
            setError(res.payment?.error_message || res.message || "Mobile Money payment failed.");
            setBusy(false);
          }
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [momoRef, onPaid]);

  const payStripe = async () => {
    setError(null);
    setBusy(true);
    try {
      const { url } = await createMeetingPaymentCheckout(registrationId);
      if (!url) throw new Error("Stripe checkout URL missing");
      window.location.href = url;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || "Unable to start Stripe checkout.");
      setBusy(false);
    }
  };

  const payMomo = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("Enter the Mobile Money number that will pay.");
      return;
    }
    setBusy(true);
    setMomoHint(null);
    try {
      const res = await requestMeetingMomoPayment(registrationId, phone.trim(), mno);
      if (!res.ok || !res.transaction_id) {
        throw new Error(res.message || "Unable to start Mobile Money payment.");
      }
      setMomoRef(res.transaction_id);
      setMomoHint(res.message || "Approve the prompt on your phone.");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e?.response?.data?.message || e?.message || "Unable to start Mobile Money payment.");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[var(--institution-primary,#012F6B)] via-[#E01C21] to-[var(--institution-primary,#012F6B)]" />
      <div className="px-6 md:px-8 py-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--institution-primary,#012F6B)]">Pay to confirm booking</h2>
          <p className="mt-1 text-sm text-slate-600">
            Payment is required before your meeting is confirmed. Choose Stripe (card) or Mobile Money.
          </p>
          <div className="mt-4 rounded-2xl border border-[var(--institution-primary,#012F6B)]/15 bg-[var(--institution-primary,#012F6B)]/5 px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--institution-primary,#012F6B)]">
              Fee: ${Number(paymentConfig.fee_usd || 0).toFixed(2)} USD
              {paymentConfig.fee_rwf > 0 && (
                <span className="text-slate-600 font-medium">
                  {" "}
                  · or {Number(paymentConfig.fee_rwf).toLocaleString()} RWF (MoMo)
                </span>
              )}
            </p>
            {Number(paymentConfig.usd_rwf_rate || 0) > 0 && (
              <p className="mt-1 text-xs text-slate-600">
                RWF converted from USD at {paymentConfig.forex_live === false ? "cached" : "live"} rate: 1 USD ={" "}
                {Number(paymentConfig.usd_rwf_rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} RWF
              </p>
            )}
            {paymentConfig.receiver?.display_momo_phone && (
              <p className="mt-1 text-xs text-slate-600">
                MoMo receive number: {paymentConfig.receiver.display_momo_phone}
                {paymentConfig.receiver.momo_receiver_name
                  ? ` (${paymentConfig.receiver.momo_receiver_name})`
                  : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!stripeOk}
            onClick={() => setTab("stripe")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border transition",
              tab === "stripe"
                ? "bg-[var(--institution-primary,#012F6B)] text-white border-[var(--institution-primary,#012F6B)]"
                : "bg-white text-slate-600 border-slate-200",
              !stripeOk && "opacity-40 cursor-not-allowed"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Stripe
          </button>
          <button
            type="button"
            disabled={!momoOk}
            onClick={() => setTab("momo")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold border transition",
              tab === "momo"
                ? "bg-[var(--institution-primary,#012F6B)] text-white border-[var(--institution-primary,#012F6B)]"
                : "bg-white text-slate-600 border-slate-200",
              !momoOk && "opacity-40 cursor-not-allowed"
            )}
          >
            <Smartphone className="h-4 w-4" />
            Mobile Money
          </button>
        </div>

        {!stripeOk && !momoOk && (
          <p className="text-sm text-red-600">
            Payments are not configured yet. Please contact the academy, or ask an admin to set Stripe keys and
            the MoMo receive number under Settings → Payments.
          </p>
        )}

        {tab === "stripe" && stripeOk && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              You will be redirected to Stripe Checkout to pay securely by card.
            </p>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void payStripe()}
              className="w-full h-12 rounded-full bg-[var(--institution-primary,#012F6B)] hover:bg-[var(--institution-primary-dark,#0a3d7a)] text-white font-semibold"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </span>
              ) : (
                `Pay $${Number(paymentConfig.fee_usd || 0).toFixed(2)} with Stripe`
              )}
            </Button>
          </div>
        )}

        {tab === "momo" && momoOk && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="momo-phone">Payer Mobile Money number</Label>
              <Input
                id="momo-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0788 000 000"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="flex gap-2">
              {(["mtn", "airtel"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setMno(opt)}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-2 text-sm font-semibold uppercase",
                    mno === opt
                      ? "border-[var(--institution-primary,#012F6B)] bg-[var(--institution-primary,#012F6B)]/10 text-[var(--institution-primary,#012F6B)]"
                      : "border-slate-200 text-slate-600"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            {momoHint && <p className="text-sm text-emerald-700">{momoHint}</p>}
            <Button
              type="button"
              disabled={busy}
              onClick={() => void payMomo()}
              className="w-full h-12 rounded-full bg-[var(--institution-primary,#012F6B)] hover:bg-[var(--institution-primary-dark,#0a3d7a)] text-white font-semibold"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for approval…
                </span>
              ) : (
                `Pay ${Number(paymentConfig.fee_rwf || 0).toLocaleString()} RWF`
              )}
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onBack} className="rounded-full">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
