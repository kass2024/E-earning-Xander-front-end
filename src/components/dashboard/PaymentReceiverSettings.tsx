import { useEffect, useState } from "react";
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
 * Independent from F&R / other products — do not reuse another project's number or MoPay keys.
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
  const [meetingFeeRwf, setMeetingFeeRwf] = useState("10000");
  const [meetingPaymentRequired, setMeetingPaymentRequired] = useState(true);

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
        setMeetingFeeRwf(String(data.meeting_fee_rwf ?? 10000));
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
    const rwf = Number(meetingFeeRwf);
    if (Number.isNaN(usd) || usd < 0 || Number.isNaN(rwf) || rwf < 0) {
      toast({ variant: "destructive", title: "Enter valid meeting fees" });
      return;
    }
    setSaving(true);
    try {
      const data = await updatePaymentReceiverSettings({
        momo_receiver_phone: phone.trim(),
        momo_receiver_name: name.trim() || undefined,
        momo_whatsapp_phone: whatsapp.trim() || undefined,
        meeting_fee_usd: usd,
        meeting_fee_rwf: Math.floor(rwf),
        meeting_payment_required: meetingPaymentRequired,
      });
      setPhone(data.momo_receiver_phone || data.display_momo_phone || phone);
      setName(data.momo_receiver_name || name);
      setWhatsapp(data.momo_whatsapp_phone || data.display_whatsapp_phone || whatsapp);
      setMeetingFeeUsd(String(data.meeting_fee_usd ?? usd));
      setMeetingFeeRwf(String(data.meeting_fee_rwf ?? rwf));
      setMeetingPaymentRequired(data.meeting_payment_required !== false);
      toast({
        title: "Saved",
        description: `MoMo receive ${data.display_momo_phone || phone}. Meeting fee $${data.meeting_fee_usd ?? usd} / ${data.meeting_fee_rwf ?? rwf} RWF.`,
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
            Learners must pay with Stripe (USD, Xander Stripe keys) or Mobile Money (RWF) before a meeting booking
            is confirmed.
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
              <Label htmlFor="meeting-fee-rwf">Mobile Money fee (RWF)</Label>
              <Input
                id="meeting-fee-rwf"
                type="number"
                min={0}
                step={1}
                className="h-11"
                value={meetingFeeRwf}
                onChange={(e) => setMeetingFeeRwf(e.target.value)}
              />
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
