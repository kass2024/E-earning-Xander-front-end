import { FormEvent, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { getMyInstitutionSettings, updateMyInstitutionBranding } from "@/api/axios";
import { getPublicStorageUrl } from "@/lib/apiConfig";
import { getStoredInstitution, saveInstitutionContext } from "@/lib/institutionContext";
import { Building2, Loader2, Video } from "lucide-react";
import InstitutionRegistrationLinkCard from "@/components/dashboard/InstitutionRegistrationLinkCard";
import InstitutionPortalContentSettings from "@/components/dashboard/InstitutionPortalContentSettings";

const InstitutionBrandingSettings = () => {
  const { toast } = useToast();
  const email = localStorage.getItem("parrot_user_email") ?? "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [slug, setSlug] = useState("");
  const [meetingProvider, setMeetingProvider] = useState<"zoom" | "daily">("daily");

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    getMyInstitutionSettings(email)
      .then((res) => {
        const inst = res.institution;
        setName(inst.name ?? "");
        setSlug(inst.slug ?? "");
        setWebsite(inst.website ?? "");
        setAddress(inst.address ?? "");
        setLogoUrl(getPublicStorageUrl(inst.logo_url ?? null));
        setMeetingProvider(((inst.meeting_provider === "zoom" ? "zoom" : "daily") as "zoom" | "daily"));
      })
      .catch(() => {
        const stored = getStoredInstitution();
        if (stored) {
          setName(stored.name);
          setLogoUrl(getPublicStorageUrl(stored.logo_url ?? null));
        }
      })
      .finally(() => setLoading(false));
  }, [email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();
      form.append("email", email);
      form.append("name", name);
      form.append("website", website);
      form.append("address", address);
      form.append("meeting_provider", meetingProvider);
      if (logoFile) form.append("logo", logoFile);

      const res = await updateMyInstitutionBranding(form);
      saveInstitutionContext(res.institution, false);
      setLogoUrl(getPublicStorageUrl(res.institution.logo_url ?? null));
      setMeetingProvider(((res.institution.meeting_provider === "zoom" ? "zoom" : "daily") as "zoom" | "daily"));
      setLogoFile(null);
      toast({ title: "Institution settings saved" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Save failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading institution settings...</p>;
  }

  return (
    <div className="space-y-6">
      <InstitutionRegistrationLinkCard slug={slug} institutionName={name} />
      <InstitutionPortalContentSettings />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Video className="h-5 w-5" />
            Live meeting platform
          </CardTitle>
          <CardDescription>
            Choose Daily or Zoom for this institution&apos;s live cohorts, live classes, and webinars. New sessions follow
            this setting when you click Start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 max-w-xl">
            <button
              type="button"
              onClick={() => setMeetingProvider("daily")}
              className={`rounded-xl border p-4 text-left transition ${
                meetingProvider === "daily"
                  ? "border-sky-600 bg-sky-600 text-white shadow-sm"
                  : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              <p className="font-semibold text-sm">Daily</p>
              <p className={`text-[11px] mt-0.5 ${meetingProvider === "daily" ? "text-white/80" : "text-muted-foreground"}`}>
                In-app cloud video (recommended)
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMeetingProvider("zoom")}
              className={`rounded-xl border p-4 text-left transition ${
                meetingProvider === "zoom"
                  ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                  : "border-border bg-background hover:bg-muted/40"
              }`}
            >
              <p className="font-semibold text-sm">Zoom Meeting SDK</p>
              <p className={`text-[11px] mt-0.5 ${meetingProvider === "zoom" ? "text-white/80" : "text-muted-foreground"}`}>
                In-app Zoom embed
              </p>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-3 max-w-xl">
            Save below to apply. Then end any live Zoom session and Start again so the host studio uses the new provider.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Institution branding
          </CardTitle>
          <CardDescription>
            Upload your institution logo and update public branding shown across dashboards and live meetings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {logoUrl && (
              <img src={logoUrl} alt="Institution logo" className="h-16 w-16 rounded-lg object-cover border" />
            )}
            <div>
              <Label>Institution name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Website</Label>
              <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div>
              <Label>Logo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save institution settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionBrandingSettings;
