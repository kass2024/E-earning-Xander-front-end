import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  createMeetPromoCode,
  getMeetAdminPlans,
  getMeetPromoCodes,
  updateMeetPromoCode,
  type MeetAdminPlan,
  type MeetPromoCode,
} from "@/api/axios";

export default function MeetPromoCodeSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<MeetPromoCode[]>([]);
  const [plans, setPlans] = useState<MeetAdminPlan[]>([]);
  const [label, setLabel] = useState("Complimentary Meet subscription");
  const [maxUses, setMaxUses] = useState(1);
  const [planId, setPlanId] = useState<string>("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [promoRows, planRows] = await Promise.all([getMeetPromoCodes(), getMeetAdminPlans()]);
      setCodes(promoRows);
      setPlans(planRows);
    } catch {
      toast({ variant: "destructive", title: "Could not load promo codes" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const created = await createMeetPromoCode({
        label: label.trim() || undefined,
        max_uses: Math.max(1, Number(maxUses) || 1),
        plan_id: planId ? Number(planId) : null,
      });
      setCodes((prev) => [created, ...prev]);
      try {
        await navigator.clipboard.writeText(created.code);
        setCopiedId(created.id);
      } catch {
        /* ignore clipboard failures */
      }
      toast({
        title: "Promo code generated",
        description: `${created.code} can be used on Pricing instead of paying.`,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Could not generate code",
        description: err?.response?.data?.message ?? "Try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (promo: MeetPromoCode) => {
    await navigator.clipboard.writeText(promo.code);
    setCopiedId(promo.id);
    toast({ title: "Copied", description: promo.code });
  };

  const toggleActive = async (promo: MeetPromoCode) => {
    setUpdatingId(promo.id);
    try {
      const updated = await updateMeetPromoCode(promo.id, { is_active: !promo.is_active });
      setCodes((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      toast({
        title: updated.is_active ? "Code reactivated" : "Code deactivated",
        description: updated.code,
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Could not update code",
        description: err?.response?.data?.message ?? "Update failed.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading promo codes…
      </div>
    );
  }

  return (
    <Card className="border border-[#0070D0]/15 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#0070D0]">
          <Ticket className="h-5 w-5" />
          Meet promo codes
        </CardTitle>
        <CardDescription>
          Generate a code in Settings, then customers enter it on Pricing to activate a plan without
          paying.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="promo-label">Label</Label>
            <Input
              id="promo-label"
              className="h-11"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Complimentary Meet subscription"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-uses">Max uses</Label>
            <Input
              id="promo-uses"
              type="number"
              min={1}
              className="h-11"
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="promo-plan">Plan (optional)</Label>
            <select
              id="promo-plan"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
            >
              <option value="">Any plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          onClick={() => void handleGenerate()}
          disabled={generating}
          className="bg-[#0070D0] hover:bg-[#1A8AD8]"
        >
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
          Generate promo code
        </Button>

        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No promo codes yet. Generate one above.</p>
        ) : (
          <div className="space-y-3">
            {codes.map((promo) => (
              <div
                key={promo.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-lg font-semibold tracking-wide">{promo.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {promo.label || "Meet promo"} · {promo.uses_count}/{promo.max_uses} used
                    {promo.plan_name ? ` · ${promo.plan_name}` : " · any plan"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={promo.redeemable ? "default" : "outline"}>
                    {promo.redeemable ? "Active" : promo.is_active ? "Used / expired" : "Off"}
                  </Badge>
                  <Button type="button" variant="outline" size="sm" onClick={() => void copyCode(promo)}>
                    {copiedId === promo.id ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                    Copy
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={updatingId === promo.id}
                    onClick={() => void toggleActive(promo)}
                  >
                    {updatingId === promo.id ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : null}
                    {promo.is_active ? "Deactivate" : "Reactivate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
