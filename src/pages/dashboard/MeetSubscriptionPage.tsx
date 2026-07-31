import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import api from "@/api/axios";
import { Loader2, AlertTriangle } from "lucide-react";

const MeetSubscriptionPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const institutionId = localStorage.getItem("parrot_institution_id");
    const userId = localStorage.getItem("parrot_user_id");
    api.get("/meet/subscription", {
      params: {
        institution_id: institutionId || undefined,
        user_id: userId || undefined,
      },
    })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const sub = data?.subscription as Record<string, unknown> | null;
  if (!sub) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Subscription" description="No active subscription." />
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Subscribe to start hosting meetings on Xander Meet.</p>
            <Button onClick={() => navigate("/pricing")}>View Plans</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const credits = sub.credits as Record<string, number> | undefined;
  const plan = sub.plan as Record<string, unknown> | undefined;
  const pct = credits ? (credits.used / credits.allocated) * 100 : 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="My Subscription" description="Monthly plan with usage-based credits." />

      {credits?.is_exhausted && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">Credits exhausted. Meeting access is suspended until your next billing cycle or plan upgrade.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{plan?.name as string}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Badge>{sub.status as string}</Badge>
            <p className="text-sm text-muted-foreground">Max {plan?.max_participants as number} participants</p>
            <p className="text-sm text-muted-foreground">{plan?.storage_gb as number} GB storage</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/pricing")}>Upgrade Plan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Credit Usage</CardTitle></CardHeader>
          <CardContent>
            <Progress value={pct} className="h-3 mb-2" />
            <p className="text-sm">{credits?.used?.toLocaleString()} / {credits?.allocated?.toLocaleString()} credits used</p>
            <p className="text-xs text-muted-foreground mt-1">{credits?.remaining?.toLocaleString()} remaining ({credits?.percent_used}%)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeetSubscriptionPage;
