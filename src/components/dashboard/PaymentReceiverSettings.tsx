import { useEffect, useMemo, useState } from "react";
import { CreditCard, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  getPaymentReceiverSettings,
  updatePaymentReceiverSettings,
} from "@/api/axios";

/**
 * Xander's single MoMo receive number plus meeting booking fees (Settings → Payments).
 * RWF is converted from the USD fee at the live USD/RWF forex rate.
 * Stripe checkout uses Xander STRIPE_* keys from the backend .env.
 */
export default function PaymentReceiverSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [meetingFeeUsd, setMeetingFeeUsd] = useState("10");
  const [usdRwfRate, setUsdRwfRate] = useState(0);
  const [forexLive, setForexLive] = useState(false);
  const [forexAsOf, setForexAsOf] = useState<string | null>(null);
  const [meetingPaymentRequired, setMeetingPaymentRequired] = useState(true);

  const liveRwf = useMemo(() => {
    const usd = Number(meetingFeeUsd);
    if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(usdRwfRate) || usdRwfRate <= 0) {
      return 0;
    }
    return Math.max(1, Math.round(usd * usdRwfRate));
  }, [meetingFeeUsd, usdRwfRate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getPaymentReceiverSettings();
        if (cancelled) return;
        setPhone(data.momo_receiver_phone || data.display_momo_phone || "");
        setName(data.momo_receiver_name || "");
        setWhatsapp(data.momo_whatsapp_phone || data.display_whatsapp_phone || "");
        setMeetingFeeUsd(String(data.meeting_fee_usd ?? 10));
        setUsdRwfRate(Number(data.usd_rwf_rate ?? 0));
        setForexLive(data.forex_live !== false && Number(data.usd_rwf_rate ?? 0) > 0);
        setForexAsOf(data.forex_as_of ?? null);
        setMeetingPaymentRequired(data.meeting_payment_required !== false);
      } catch {
        if (!cancelled) {
          toast({
            variant: "destructive",
            title: "Could not load payment settings",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleSave = async () => {
    if (!phone.trim()) {
      toast({ variant: "destructive", title: "Enter a Mobile Money number" });
      return;
    }
    const usd = Number(meetingFeeUsd);
    if (Number.isNaN(usd) || usd < 0) {
      toast({ variant: "destructive", title: "Enter a valid Stripe fee in USD" });
      return;
    }
    setSaving(true);
    try {
      const data = await updatePaymentReceiverSettings({
        momo_receiver_phone: phone.trim(),
        momo_receiver_name: name.trim() || undefined,
        momo_whatsapp_phone: whatsapp.trim() || undefined,
        meeting_fee_usd: usd,
        meeting_payment_required: meetingPaymentRequired,
      });
      setPhone(data.momo_receiver_phone || data.display_momo_phone || phone);
      setName(data.momo_receiver_name || name);
      setWhatsapp(data.momo_whatsapp_phone || data.display_whatsapp_phone || whatsapp);
      setMeetingFeeUsd(String(data.meeting_fee_usd ?? usd));
      setUsdRwfRate(Number(data.usd_rwf_rate ?? usdRwfRate));
      setForexLive(data.forex_live !== false);
      setForexAsOf(data.forex_as_of ?? null);
      setMeetingPaymentRequired(data.meeting_payment_required !== false);
      const converted = Number(data.meeting_fee_rwf ?? liveRwf);
      toast({
        title: "Saved",
        description: `MoMo receive ${data.display_momo_phone || phone}. Meeting fee $${data.meeting_fee_usd ?? usd} → ${converted.toLocaleString()} RWF at live forex.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Could not save",
        description: err?.response?.data?.message ?? "Failed to update payment settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading payment settings…
      </div>
    );
  }

  const rateLabel = usdRwfRate > 0
    ? `1 USD = ${usdRwfRate.toLocaleString(undefined, { maximumFractionDigits: 2 })} RWF`
    : "Live rate unavailable";

  return (
    <div className="space-y-6">
      <Card className="border border-[#0070D0]/15 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0070D0]">
            <Smartphone className="h-5 w-5" />
            Mobile Money receive number
          </CardTitle>
          <CardDescription>
            Main account owner MTN/Airtel number. Learners paying for main-platform courses and meeting bookings
            send money here. Partner institutions configure their own receive number separately under Institution
            settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="momo-receiver-phone">MoMo number (receive payments)</Label>
              <Input
                id="momo-receiver-phone"
                className="font-mono h-11"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0788 821 579"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="momo-receiver-name">Account name</Label>
              <Input
                id="momo-receiver-name"
                className="h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kalisa Valens"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="momo-whatsapp">WhatsApp confirmation (optional)</Label>
              <Input
                id="momo-whatsapp"
                className="font-mono h-11"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+250 788 821 579"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#0070D0]/15 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0070D0]">
            <CreditCard className="h-5 w-5" />
            Meeting booking fees
          </CardTitle>
          <CardDescription>
            Set the Stripe amount in USD. Mobile Money (RWF) is converted automatically from that USD fee using
            the live USD/RWF forex rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="meeting-fee-usd">Stripe fee (USD)</Label>
              <Input
                id="meeting-fee-usd"
                type="number"
                min={0}
                step="0.01"
                className="h-11"
                value={meetingFeeUsd}
                onChange={(e) => setMeetingFeeUsd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meeting-fee-rwf">Mobile Money fee (RWF, live forex)</Label>
              <Input
                id="meeting-fee-rwf"
                readOnly
                className="h-11 bg-slate-50"
                value={liveRwf > 0 ? liveRwf.toLocaleString() : "—"}
              />
              <p className="text-xs text-muted-foreground">
                {forexLive ? "Live rate" : "Cached/fallback rate"}: {rateLabel}
                {forexAsOf ? ` · updated ${forexAsOf}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="meeting-payment-required"
              checked={meetingPaymentRequired}
              onCheckedChange={(v) => setMeetingPaymentRequired(Boolean(v))}
            />
            <Label htmlFor="meeting-payment-required" className="cursor-pointer">
              Require payment before confirming meeting bookings
            </Label>
          </div>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || !phone.trim()}
            className="bg-[#0070D0] hover:bg-[#1A8AD8]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save payment settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
