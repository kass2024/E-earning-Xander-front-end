import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfile from "./UserProfile";
import PasswordChange from "./PasswordChange";
import InstitutionBrandingSettings from "@/components/dashboard/InstitutionBrandingSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LockKeyhole, Settings as SettingsIcon, UserRound } from "lucide-react";

const Settings = () => {
  const role = (localStorage.getItem("parrot_user_role") ?? "").toLowerCase();
  const showInstitution = role === "partner_company";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Account Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile details and update your password securely.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Profile</Badge>
          <Badge variant="secondary">Security</Badge>
          {showInstitution && <Badge variant="secondary">Institution</Badge>}
        </div>
      </div>

      <Card className="border-0 bg-white shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white">
          <CardTitle className="text-xl">Settings</CardTitle>
          <CardDescription>
            Use the tabs below to update your information.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className={`grid w-full max-w-2xl ${showInstitution ? "grid-cols-3" : "grid-cols-2"} bg-muted/40`}>
              <TabsTrigger value="profile" className="gap-2">
                <UserRound className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <LockKeyhole className="h-4 w-4" />
                Password
              </TabsTrigger>
              {showInstitution && (
                <TabsTrigger value="institution" className="gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Institution
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <UserProfile />
            </TabsContent>

            <TabsContent value="password" className="mt-0">
              <PasswordChange />
            </TabsContent>

            {showInstitution && (
              <TabsContent value="institution" className="mt-0">
                <InstitutionBrandingSettings />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
