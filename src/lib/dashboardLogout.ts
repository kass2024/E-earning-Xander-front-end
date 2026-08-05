import { clearAdminImpersonation } from "@/lib/adminImpersonation";
import {
  clearInstitutionContext,
  clearInstitutionLoginPath,
  getInstitutionLoginRedirect,
  getStoredInstitution,
} from "@/lib/institutionContext";

export {
  clearInstitutionLoginPath,
  getInstitutionLoginRedirect,
  rememberInstitutionLoginPath,
} from "@/lib/institutionContext";

export function performDashboardLogout(
  navigate?: (path: string, opts?: { replace?: boolean }) => void,
): void {
  const redirect = getInstitutionLoginRedirect();

  clearAdminImpersonation();
  clearInstitutionLoginPath();
  clearInstitutionContext();

  localStorage.removeItem("token");
  localStorage.removeItem("xander_user_role");
  localStorage.removeItem("xander_user_name");
  localStorage.removeItem("xander_user_email");
  localStorage.removeItem("xander_student_id");
  localStorage.removeItem("xander_login_success");
  localStorage.removeItem("xander_user_avatar");

  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("xander_branding_refreshed:") || key.startsWith("xander_dash_")) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // ignore
  }

  if (navigate) {
    navigate(redirect, { replace: true });
  } else {
    window.location.href = redirect;
  }
}

export function partnerInstitutionPortalPath(): string | null {
  const slug = getStoredInstitution()?.slug?.trim().toLowerCase();
  return slug ? `/i/${encodeURIComponent(slug)}` : null;
}
