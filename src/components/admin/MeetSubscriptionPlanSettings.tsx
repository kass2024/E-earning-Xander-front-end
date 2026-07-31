import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  createMeetAdminPlan,
  deleteMeetAdminPlan,
  getMeetAdminPlans,
  updateMeetAdminPlan,
  type MeetAdminPlan,
  type MeetAdminPlanInput,
} from "@/api/axios";

type PlanDraft = MeetAdminPlanInput & { id?: number; subscription_count?: number };

const emptyPlan = (): PlanDraft => ({
  slug: "",
  name: "",
  description: "",
  max_participants: 25,
  storage_mb: 10240,
  monthly_credits: 5000,
  price_usd: 29,
  price_rwf: 35000,
  is_active: true,
  sort_order: 99,
  features: [],
});

function featuresToText(features: string[] | undefined): string {
  return (features ?? []).join("\n");
}

function textToFeatures(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function MeetSubscriptionPlanSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlanDraft[]>([]);
  const [savingId, setSavingId] = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [featureTexts, setFeatureTexts] = useState<Record<string, string>>({});

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getMeetAdminPlans();
      setPlans(rows);
      setFeatureTexts(
        Object.fromEntries(rows.map((p) => [String(p.id ?? "new"), featuresToText(p.features)])),
      );
    } catch {
      toast({ variant: "destructive", title: "Could not load subscription plans" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const updatePlan = (key: string, patch: Partial<PlanDraft>) => {
    setPlans((prev) =>
      prev.map((p) => (String(p.id ?? "new") === key ? { ...p, ...patch } : p)),
    );
  };

  const handleSave = async (plan: PlanDraft) => {
    const key = String(plan.id ?? "new");
    const payload: MeetAdminPlanInput = {
      slug: plan.slug.trim(),
      name: plan.name.trim(),
      description: plan.description?.trim() || "",
      max_participants: Number(plan.max_participants),
      storage_mb: Number(plan.storage_mb),
      monthly_credits: Number(plan.monthly_credits),
      price_usd: Number(plan.price_usd),
      price_rwf: Number(plan.price_rwf),
      is_active: plan.is_active,
      sort_order: Number(plan.sort_order),
      features: textToFeatures(featureTexts[key] ?? ""),
    };

    if (!payload.slug || !payload.name) {
      toast({ variant: "destructive", title: "Slug and name are required" });
      return;
    }

    setSavingId(plan.id ?? "new");
    try {
      if (plan.id) {
        const saved = await updateMeetAdminPlan(plan.id, payload);
        setPlans((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        toast({ title: "Plan saved", description: `${saved.name} updated.` });
      } else {
        const saved = await createMeetAdminPlan(payload);
        setPlans((prev) => prev.filter((p) => p.id).concat(saved));
        setFeatureTexts((prev) => {
          const next = { ...prev };
          delete next.new;
          next[String(saved.id)] = featuresToText(saved.features);
          return next;
        });
        toast({ title: "Plan created", description: `${saved.name} added.` });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Could not save plan",
        description: err?.response?.data?.message ?? "Save failed.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (plan: PlanDraft) => {
    if (!plan.id) {
      setPlans((prev) => prev.filter((p) => p.id));
      return;
    }
    setDeletingId(plan.id);
    try {
      const result = await deleteMeetAdminPlan(plan.id);
      if (result.soft_deleted) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, is_active: false } : p)),
        );
        toast({
          title: "Plan deactivated",
          description: "Existing subscriptions prevented permanent deletion.",
        });
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
        toast({ title: "Plan deleted" });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Could not remove plan",
        description: err?.response?.data?.message ?? "Delete failed.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const addNewPlan = () => {
    if (plans.some((p) => !p.id)) return;
    setPlans((prev) => [...prev, emptyPlan()]);
    setFeatureTexts((prev) => ({ ...prev, new: "" }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading subscription plans…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-[#0070D0]/15 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0070D0]">
            <Layers className="h-5 w-5" />
            Meet subscription plans
          </CardTitle>
          <CardDescription>
            Configure pricing tiers shown on the public pricing page. Inactive plans are hidden from
            new subscriptions but remain linked to existing customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={addNewPlan}
            className="border-[#0070D0]/30 text-[#0070D0]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add plan
          </Button>
        </CardContent>
      </Card>

      {plans.map((plan) => {
        const key = String(plan.id ?? "new");
        const isSaving = savingId === (plan.id ?? "new");

        return (
          <Card key={key} className="border border-[#0070D0]/15 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">{plan.name || "New plan"}</CardTitle>
                <div className="flex items-center gap-3">
                  {plan.subscription_count != null && plan.subscription_count > 0 && (
                    <Badge variant="secondary">{plan.subscription_count} subscriptions</Badge>
                  )}
                  <Badge variant={plan.is_active ? "default" : "outline"}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${key}`} className="text-sm text-muted-foreground">
                      Active
                    </Label>
                    <Switch
                      id={`active-${key}`}
                      checked={plan.is_active}
                      onCheckedChange={(checked) => updatePlan(key, { is_active: checked })}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`slug-${key}`}>Slug</Label>
                  <Input
                    id={`slug-${key}`}
                    className="font-mono h-11"
                    value={plan.slug}
                    onChange={(e) => updatePlan(key, { slug: e.target.value.toLowerCase() })}
                    placeholder="professional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`name-${key}`}>Display name</Label>
                  <Input
                    id={`name-${key}`}
                    className="h-11"
                    value={plan.name}
                    onChange={(e) => updatePlan(key, { name: e.target.value })}
                    placeholder="Professional"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`desc-${key}`}>Description</Label>
                  <Textarea
                    id={`desc-${key}`}
                    rows={2}
                    value={plan.description ?? ""}
                    onChange={(e) => updatePlan(key, { description: e.target.value })}
                    placeholder="Short summary for the pricing page"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`max-${key}`}>Max participants</Label>
                  <Input
                    id={`max-${key}`}
                    type="number"
                    min={1}
                    className="h-11"
                    value={plan.max_participants}
                    onChange={(e) => updatePlan(key, { max_participants: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`storage-${key}`}>Storage (MB)</Label>
                  <Input
                    id={`storage-${key}`}
                    type="number"
                    min={0}
                    className="h-11"
                    value={plan.storage_mb}
                    onChange={(e) => updatePlan(key, { storage_mb: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`credits-${key}`}>Monthly credits</Label>
                  <Input
                    id={`credits-${key}`}
                    type="number"
                    min={0}
                    className="h-11"
                    value={plan.monthly_credits}
                    onChange={(e) => updatePlan(key, { monthly_credits: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`sort-${key}`}>Sort order</Label>
                  <Input
                    id={`sort-${key}`}
                    type="number"
                    min={0}
                    className="h-11"
                    value={plan.sort_order}
                    onChange={(e) => updatePlan(key, { sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`usd-${key}`}>Price (USD)</Label>
                  <Input
                    id={`usd-${key}`}
                    type="number"
                    min={0}
                    step={0.01}
                    className="h-11"
                    value={plan.price_usd}
                    onChange={(e) => updatePlan(key, { price_usd: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`rwf-${key}`}>Price (RWF)</Label>
                  <Input
                    id={`rwf-${key}`}
                    type="number"
                    min={0}
                    className="h-11 font-mono"
                    value={plan.price_rwf}
                    onChange={(e) => updatePlan(key, { price_rwf: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`features-${key}`}>Features (one per line)</Label>
                  <Textarea
                    id={`features-${key}`}
                    rows={5}
                    value={featureTexts[key] ?? ""}
                    onChange={(e) =>
                      setFeatureTexts((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    placeholder={"Up to 100 participants\n50 GB storage"}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => void handleSave(plan)}
                  disabled={isSaving}
                  className="bg-[#0070D0] hover:bg-[#1A8AD8]"
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save plan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deletingId === plan.id}
                  onClick={() => void handleDelete(plan)}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingId === plan.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {plan.id ? "Delete / deactivate" : "Discard"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
