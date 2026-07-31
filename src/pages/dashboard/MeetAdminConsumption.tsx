import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import api from "@/api/axios";
import { Loader2 } from "lucide-react";

type TenantUsage = {
  subscription_id: number;
  tenant: string;
  tenant_type: string;
  plan: string;
  status: string;
  credits_used: number;
  credits_allocated: number;
  credits_remaining: number;
  storage_used_mb: number;
  is_exhausted: boolean;
  period_end: string;
};

const MeetAdminConsumption = () => {
  const [tenants, setTenants] = useState<TenantUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/meet/admin/consumption")
      .then((res) => setTenants(res.data?.tenants ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usage & Consumption"
        description="Monitor credit usage across all tenants. Users are disconnected when credits are exhausted."
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Tenants</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{tenants.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Exhausted</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{tenants.filter((t) => t.is_exhausted).length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Credits Used</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{tenants.reduce((s, t) => s + t.credits_used, 0).toLocaleString()}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tenant Consumption</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const pct = t.credits_allocated > 0 ? (t.credits_used / t.credits_allocated) * 100 : 0;
                return (
                  <TableRow key={t.subscription_id}>
                    <TableCell>
                      <p className="font-medium">{t.tenant}</p>
                      <p className="text-xs text-muted-foreground capitalize">{t.tenant_type}</p>
                    </TableCell>
                    <TableCell>{t.plan}</TableCell>
                    <TableCell className="min-w-[180px]">
                      <div className="space-y-1">
                        <Progress value={pct} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {t.credits_used.toLocaleString()} / {t.credits_allocated.toLocaleString()} credits
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{Math.round(t.storage_used_mb / 1024 * 10) / 10} GB</TableCell>
                    <TableCell>
                      {t.is_exhausted ? (
                        <Badge variant="destructive">Exhausted</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.period_end ? new Date(t.period_end).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No active subscriptions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetAdminConsumption;
