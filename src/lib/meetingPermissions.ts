export type MeetingRole = "host" | "moderator" | "presenter" | "panelist" | "attendee";
export type MeetingMode = "meeting" | "webinar";
export type SpeakingState = "listening" | "hand_raised" | "approved" | "speaking" | "revoked";

export type DailySendPermission = "audio" | "video" | "screenVideo" | "screenAudio" | "customVideo" | "customAudio";

export type DailySdkPermissions = {
  hasPresence?: boolean;
  canSend?: boolean | DailySendPermission[];
  canAdmin?: boolean | string[];
};

export function canSendMedia(
  permissions: DailySdkPermissions | null | undefined,
  kind: DailySendPermission,
): boolean {
  if (!permissions) return false;
  const canSend = permissions.canSend;
  if (canSend === true) return true;
  if (canSend === false || canSend == null) return false;
  return Array.isArray(canSend) && canSend.includes(kind);
}

export function canAdminParticipants(permissions: DailySdkPermissions | null | undefined): boolean {
  if (!permissions) return false;
  const canAdmin = permissions.canAdmin;
  if (canAdmin === true) return true;
  if (canAdmin === false || canAdmin == null) return false;
  return Array.isArray(canAdmin) && canAdmin.includes("participants");
}

export function resolveMeetingRole(sdk: {
  meeting_role?: string | null;
  role?: number | string | null;
  permissions?: DailySdkPermissions | null;
}): MeetingRole {
  const explicit = String(sdk.meeting_role || "").toLowerCase();
  if (
    explicit === "host" ||
    explicit === "moderator" ||
    explicit === "presenter" ||
    explicit === "panelist" ||
    explicit === "attendee"
  ) {
    return explicit;
  }
  if (Number(sdk.role) === 1 || canAdminParticipants(sdk.permissions)) return "host";
  return "attendee";
}

export function resolveMeetingMode(sdk: { meeting_mode?: string | null }): MeetingMode {
  return String(sdk.meeting_mode || "").toLowerCase() === "webinar" ? "webinar" : "meeting";
}
