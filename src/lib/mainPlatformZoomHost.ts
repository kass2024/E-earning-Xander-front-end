import type { ZoomMeetingBranding } from "@/api/axios";
import { isStoredMainAdmin } from "@/lib/institutionContext";

type ZoomHostAuth = Pick<ZoomMeetingBranding, "is_main_platform_host" | "use_institution_logo"> | null | undefined;

/** Main platform admin/staff — hub branding, unless this session is explicitly an institution room. */
export function isMainPlatformZoomHost(auth?: ZoomHostAuth): boolean {
  // Tenant meetings/webinars/live classes must keep the institution logo even if a
  // main-platform admin is currently logged in on the same browser.
  if (auth?.use_institution_logo === true) return false;
  if (auth?.is_main_platform_host === true) return true;
  if (auth?.use_institution_logo === false && isStoredMainAdmin()) return true;
  return isStoredMainAdmin();
}
