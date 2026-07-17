import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  getPlatformInstitution,
  getZoomHosts,
  assignInstitutionZoomHost,
  getMeetingProviderStatus,
  resetInstitutionOwnerPassword,
  resendInstitutionCredentials,
  sendInstitutionTestMail,
  updatePlatformInstitution,
  uploadPlatformInstitutionLogo,
} from "@/api/axios";
import { getPublicStorageUrl } from "@/lib/apiConfig";
import { buildInstitutionLearnerLoginUrl } from "@/lib/institutionSignupLink";
import { Loader2, Mail, KeyRound, Video } from "lucide-react";
import InstitutionRegistrationLinkCard from "@/components/dashboard/InstitutionRegistrationLinkCard";

type Props = {
  institutionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const InstitutionAdminEditDialog = ({ institutionId, open, onOpenChange, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [mailUseCustom, setMailUseCustom] = useState(false);
  const [mailHost, setMailHost] = useState("");
  const [mailPort, setMailPort] = useState("587");
  const [mailUsername, setMailUsername] = useState("");
  const [mailPassword, setMailPassword] = useState("");
  const [mailEncryption, setMailEncryption] = useState("tls");
  const [mailFromAddress, setMailFromAddress] = useState("");
  const [mailFromName, setMailFromName] = useState("");
  const [mailEhloDomain, setMailEhloDomain] = useState("");
  const [mailPasswordSet, setMailPasswordSet] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerStatus, setOwnerStatus] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [zoomHostUserId, setZoomHostUserId] = useState("");
  const [assignableZoomHosts, setAssignableZoomHosts] = useState<string[]>([]);
  const [zoomAccountUsers, setZoomAccountUsers] = useState<
    Array<{
      email: string;
      display_name?: string;
      available?: boolean;
      assigned_to?: { institution_id: number; institution_name: string } | null;
    }>
  >([]);
  const [zoomUsersDiscovered, setZoomUsersDiscovered] = useState(0);
  const [assigningZoomHost, setAssigningZoomHost] = useState(false);
  const [meetingProvider, setMeetingProvider] = useState<"zoom" | "daily">("daily");
  const [dailyConfigured, setDailyConfigured] = useState(false);
  const [dailyDomain, setDailyDomain] = useState<string | null>(null);

  const loadZoomHosts = async (forInstitutionId?: number) => {
    try {
      const res = await getZoomHosts(forInstitutionId);
      setAssignableZoomHosts(res.assignable_hosts ?? []);
      setZoomAccountUsers(res.zoom_account_users ?? []);
      setZoomUsersDiscovered(Number(res.zoom_users_discovered ?? 0));
    } catch {
      setAssignableZoomHosts([]);
      setZoomAccountUsers([]);
      setZoomUsersDiscovered(0);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadZoomHosts(institutionId ?? undefined);
    getMeetingProviderStatus()
      .then((res) => {
        setDailyConfigured(Boolean(res.providers?.daily?.configured));
        setDailyDomain(res.providers?.daily?.domain ?? null);
      })
      .catch(() => {
        setDailyConfigured(false);
        setDailyDomain(null);
      });
  }, [open, institutionId]);

  useEffect(() => {
    if (!open || !institutionId) return;
    setLoading(true);
    getPlatformInstitution(institutionId)
      .then((inst) => {
        setName(inst.name ?? "");
        setSlug(inst.slug ?? "");
        setWebsite(inst.website ?? "");
        setAddress(inst.address ?? "");
        setAdminNotes(inst.admin_notes ?? "");
        setLogoUrl(getPublicStorageUrl(inst.logo_url ?? null));
        setMailUseCustom(Boolean(inst.mail_use_custom));
        setMailHost(inst.mail_host ?? "");
        setMailPort(String(inst.mail_port ?? 587));
        setMailUsername(inst.mail_username ?? "");
        setMailPassword("");
        setMailEncryption(inst.mail_encryption ?? "tls");
        setMailFromAddress(inst.mail_from_address ?? "");
        setMailFromName(inst.mail_from_name ?? "");
        setMailEhloDomain(inst.mail_ehlo_domain ?? "");
        setMailPasswordSet(Boolean(inst.mail_password_set));
        setTestTo(inst.contact_email ?? "");
        setOwnerEmail((inst as { owner?: { email?: string; status?: string } }).owner?.email ?? inst.contact_email ?? "");
        setOwnerStatus((inst as { owner?: { status?: string } }).owner?.status ?? "none");
        setOwnerPassword("");
        setGeneratedPassword(null);
        setZoomHostUserId((inst as { zoom_host_user_id?: string }).zoom_host_user_id ?? "");
        setMeetingProvider(((inst as { meeting_provider?: string }).meeting_provider ?? "daily") as "zoom" | "daily");
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load institution" }))
      .finally(() => setLoading(false));
  }, [open, institutionId, toast]);

  const handleAutoAssignZoomHost = async () => {
    if (!institutionId) return;
    setAssigningZoomHost(true);
    try {
      const res = await assignInstitutionZoomHost(institutionId, Boolean(zoomHostUserId.trim()));
      setZoomHostUserId(res.zoom_host_user_id ?? "");
      await loadZoomHosts(institutionId);
      toast({
        title: "Zoom host assigned",
        description: res.zoom_host_user_id || "Host updated for this institution.",
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Auto-assign failed", description: msg });
    } finally {
      setAssigningZoomHost(false);
    }
  };

  const formatZoomHostOption = (email: string) => {
    const user = zoomAccountUsers.find((u) => u.email === email);
    if (!user?.assigned_to) {
      return user?.display_name ? `${user.display_name} (${email})` : email;
    }
    if (user.assigned_to.institution_id === institutionId) {
      return user.display_name ? `${user.display_name} (${email}) - current` : `${email} - current`;
    }
    return user.display_name
      ? `${user.display_name} (${email}) - ${user.assigned_to.institution_name}`
      : `${email} - ${user.assigned_to.institution_name}`;
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!institutionId) return;
    setSaving(true);
    try {
      if (logoFile) {
        const logoRes = await uploadPlatformInstitutionLogo(institutionId, logoFile);
        setLogoUrl(getPublicStorageUrl(logoRes.logo_url));
        setLogoFile(null);
      }

      const payload: Record<string, unknown> = {
        name,
        website,
        address,
        admin_notes: adminNotes,
        mail_use_custom: mailUseCustom,
        mail_host: mailHost,
        mail_port: Number(mailPort) || 587,
        mail_username: mailUsername,
        mail_encryption: mailEncryption,
        mail_from_address: mailFromAddress,
        mail_from_name: mailFromName,
        mail_ehlo_domain: mailEhloDomain,
        zoom_host_user_id: zoomHostUserId.trim() || null,
      };
      if (mailPassword.trim()) payload.mail_password = mailPassword;

      await updatePlatformInstitution(institutionId, payload);
      toast({ title: "Institution settings saved" });
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Save failed", description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleTestMail = async () => {
    if (!institutionId) return;
    setTesting(true);
    try {
      const res = await sendInstitutionTestMail(institutionId, testTo || undefined);
      toast({ title: res.message ?? "Test email sent" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Test failed", description: msg });
    } finally {
      setTesting(false);
    }
  };

  const handleResetOwnerPassword = async (sendEmail: boolean) => {
    if (!institutionId) return;
    setResettingPassword(true);
    setGeneratedPassword(null);
    try {
      const res = await resetInstitutionOwnerPassword(institutionId, {
        password: ownerPassword.trim() || undefined,
        sendEmail,
      });
      if (res.password) {
        setGeneratedPassword(res.password);
        setOwnerPassword(res.password);
      }
      toast({
        title: sendEmail ? "Password reset & emailed" : "Password reset",
        description: res.message,
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Password reset failed", description: msg });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleResendCredentials = async () => {
    if (!institutionId) return;
    setResettingPassword(true);
    setGeneratedPassword(null);
    try {
      const res = await resendInstitutionCredentials(institutionId);
      if (res.password) setGeneratedPassword(res.password);
      toast({ title: "Credentials sent", description: res.message });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ variant: "destructive", title: "Resend failed", description: msg });
    } finally {
      setResettingPassword(false);
    }
  };

  const loginUrl = slug ? buildInstitutionLearnerLoginUrl(slug) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Manage institution</DialogTitle>
          <DialogDescription>
            Update branding, logo, admin notes, and optional per-institution SMTP settings.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : (
          <form onSubmit={handleSave}>
            <Tabs defaultValue="branding" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="login">Login access</TabsTrigger>
                <TabsTrigger value="smtp">SMTP</TabsTrigger>
              </TabsList>

              <TabsContent value="branding" className="space-y-4">
                <InstitutionRegistrationLinkCard slug={slug} institutionName={name} compact className="rounded-xl border bg-[#012F6B]/[0.03] p-4" />
                <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-16 w-16 rounded-xl object-cover border shadow-sm" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#012F6B] text-white font-bold text-xl">
                      {name.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <Label>Institution logo</Label>
                    <Input type="file" accept="image/*" className="mt-1.5" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WebP · max 5 MB</p>
                  </div>
                </div>
                <div>
                  <Label>Institution name</Label>
                  <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Website</Label>
                    <Input className="rounded-xl" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input className="rounded-xl" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Admin notes (internal)</Label>
                  <Input className="rounded-xl" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Visible only to platform admins" />
                </div>
                <div className="rounded-xl border border-[#012F6B]/15 bg-[#012F6B]/[0.03] p-4 space-y-2">
                  <p className="text-sm font-medium text-[#012F6B]">Meeting platform</p>
                  <p className="text-xs text-muted-foreground">
                    Partner institutions inherit the main admin setting from Settings → Live meetings.
                    Current: <span className="font-semibold capitalize">{meetingProvider}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-[#012F6B]/15 bg-[#012F6B]/[0.03] p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-[#012F6B]" />
                    <p className="text-sm font-medium text-[#012F6B]">Zoom live host</p>
                  </div>
                  {meetingProvider === "daily" ? (
                    <p className="text-xs text-muted-foreground">
                      Zoom host assignment applies only when the main platform uses Zoom.
                    </p>
                  ) : null}
                  {zoomUsersDiscovered > 0 ? (
                    <p className="text-xs text-emerald-700">
                      {zoomUsersDiscovered} licensed Zoom user(s) discovered from your account.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">
                      No Zoom users loaded yet. Ensure ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET are set, and add scope user:read:list_users:admin to your Zoom S2S app.
                    </p>
                  )}
                  {assignableZoomHosts.length > 0 ? (
                    <select
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      value={zoomHostUserId}
                      onChange={(e) => setZoomHostUserId(e.target.value)}
                    >
                      <option value="">Auto-assign next available host</option>
                      {assignableZoomHosts.map((host) => (
                        <option key={host} value={host}>
                          {formatZoomHostOption(host)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="rounded-xl font-mono text-sm"
                      value={zoomHostUserId}
                      onChange={(e) => setZoomHostUserId(e.target.value)}
                      placeholder="host@yourzoomaccount.com (optional)"
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!institutionId || assigningZoomHost}
                      onClick={() => void handleAutoAssignZoomHost()}
                    >
                      {assigningZoomHost ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Auto-assign host
                    </Button>
                  </div>
                  {zoomHostUserId ? (
                    <p className="text-xs font-mono text-[#012F6B]">Current: {zoomHostUserId}</p>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="login" className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium">Partner owner account</p>
                  <p className="text-sm text-muted-foreground">
                    Institution partners sign in at their branded login page. If login fails, reset the password here — no previous password required.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Owner email</Label>
                      <Input className="rounded-xl mt-1" value={ownerEmail} readOnly />
                    </div>
                    <div>
                      <Label>Account status</Label>
                      <Input className="rounded-xl mt-1 capitalize" value={ownerStatus || "Not created yet"} readOnly />
                    </div>
                  </div>
                  {loginUrl ? (
                    <div>
                      <Label>Institution login URL</Label>
                      <Input className="rounded-xl mt-1 font-mono text-xs" value={loginUrl} readOnly />
                    </div>
                  ) : null}
                  <div>
                    <Label>New password</Label>
                    <Input
                      type="text"
                      className="rounded-xl mt-1 font-mono"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Leave blank to generate a random password"
                      autoComplete="new-password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters. Blank = auto-generate.</p>
                  </div>
                  {generatedPassword ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      Password set: <span className="font-mono font-semibold">{generatedPassword}</span>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="default"
                      disabled={resettingPassword}
                      onClick={() => void handleResetOwnerPassword(false)}
                    >
                      {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                      Set password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resettingPassword}
                      onClick={() => void handleResetOwnerPassword(true)}
                    >
                      Set &amp; email owner
                    </Button>
                    <Button type="button" variant="outline" disabled={resettingPassword} onClick={() => void handleResendCredentials()}>
                      <Mail className="h-4 w-4 mr-2" />
                      Random &amp; email
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="smtp" className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">Use custom SMTP</p>
                    <p className="text-xs text-muted-foreground">Off = platform .env mail settings</p>
                  </div>
                  <Switch checked={mailUseCustom} onCheckedChange={setMailUseCustom} />
                </div>

                {mailUseCustom && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Host</Label>
                        <Input value={mailHost} onChange={(e) => setMailHost(e.target.value)} placeholder="smtp.example.com" />
                      </div>
                      <div>
                        <Label>Port</Label>
                        <Input value={mailPort} onChange={(e) => setMailPort(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Username</Label>
                      <Input value={mailUsername} onChange={(e) => setMailUsername(e.target.value)} />
                    </div>
                    <div>
                      <Label>Password {mailPasswordSet ? "(leave blank to keep)" : ""}</Label>
                      <Input type="password" value={mailPassword} onChange={(e) => setMailPassword(e.target.value)} autoComplete="new-password" />
                    </div>
                    <div>
                      <Label>Encryption</Label>
                      <Input value={mailEncryption} onChange={(e) => setMailEncryption(e.target.value)} placeholder="tls" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>From address</Label>
                        <Input value={mailFromAddress} onChange={(e) => setMailFromAddress(e.target.value)} />
                      </div>
                      <div>
                        <Label>From name</Label>
                        <Input value={mailFromName} onChange={(e) => setMailFromName(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>EHLO domain (optional)</Label>
                      <Input value={mailEhloDomain} onChange={(e) => setMailEhloDomain(e.target.value)} />
                    </div>
                  </>
                )}

                <div className="flex gap-2 items-end pt-2">
                  <div className="flex-1">
                    <Label>Test recipient</Label>
                    <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="owner@institution.com" />
                  </div>
                  <Button type="button" variant="outline" onClick={handleTestMail} disabled={testing}>
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InstitutionAdminEditDialog;
