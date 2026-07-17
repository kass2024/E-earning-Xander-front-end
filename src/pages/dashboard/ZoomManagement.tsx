import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { EmailChipInput } from "@/components/ui/EmailChipInput";
import { SmartDateTimePicker } from "@/components/ui/SmartDateTimePicker";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/AdminPageHeader";
import {
  Calendar,
  Users,
  Video,
  Copy,
  Trash,
  PlayCircle,
  ChevronDown,
  Loader2,
  Search,
  Settings2,
  Mail,
  Download,
  Disc3,
} from "lucide-react";
import {
  createZoomMeeting,
  getZoomMeetings,
  deleteZoomMeeting,
  ZoomMeetingPayload,
  getUsers,
  getPlatformMeetingSettings,
} from "@/api/axios";
import { fetchDashboardCached, readDashboardCache } from "@/lib/dashboardCache";
import { openZoomMeetingInNewTab, zoomMeetingEmbedRoom } from "@/lib/zoomEmbedRoutes";
import { ZoomRecordingPlayerDialog } from "@/components/materials/ZoomRecordingPlayerDialog";
import type { ZoomRecordingFile } from "@/api/axios";
import { resolveDefaultTimezone } from "@/lib/commonTimezones";
import { localDatetimeToZoomStart } from "@/lib/scheduledDateTime";
import { cn } from "@/lib/utils";

type ZoomItem = {
  id?: string | number;
  topic?: string;
  start_time?: string;
  duration?: number;
  join_url?: string;
  password?: string;
  agenda?: string;
  session_status?: "live" | "ended" | "upcoming" | "unknown";
  recording_available?: boolean;
  recording_play_url?: string | null;
  recording_download_url?: string | null;
  recording_files?: ZoomRecordingFile[];
};

type StaffUser = {
  id?: number;
  name?: string;
  email: string;
  role?: string;
};

type MeetingType = "meeting" | "webinar";

interface ZoomManagementProps {
  initialMeetingType?: MeetingType;
}

function formatMeetingStartTime(value?: string) {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function meetingStatusBadge(status?: ZoomItem["session_status"]) {
  if (status === "live") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">In progress</Badge>;
  }
  if (status === "ended") {
    return <Badge variant="secondary">Ended</Badge>;
  }
  if (status === "upcoming") {
    return <Badge variant="outline">Scheduled</Badge>;
  }
  return <Badge variant="outline">Unknown</Badge>;
}

const ZoomManagement = ({ initialMeetingType = "meeting" }: ZoomManagementProps) => {
  const { toast } = useToast();

  // Locked by sidebar route: Meeting → meeting, Webinars → webinar
  const meetingType: MeetingType = initialMeetingType;
  const [meetingTimezone, setMeetingTimezone] = useState(resolveDefaultTimezone);
  const [requireRegistration, setRequireRegistration] = useState(false);
  const [recurrence, setRecurrence] = useState("none");
  const [reminderTime, setReminderTime] = useState("none");
  const [meetingCategory, setMeetingCategory] = useState("General");

  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [meetingStartTime, setMeetingStartTime] = useState("");
  const [meetingAgenda, setMeetingAgenda] = useState("");
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);

  const [joinBeforeHost, setJoinBeforeHost] = useState(true);
  const [muteOnEntry, setMuteOnEntry] = useState(false);
  const [autoRecording, setAutoRecording] = useState(true);
  const [hostVideo, setHostVideo] = useState(true);
  const [participantVideo, setParticipantVideo] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [meetingAuthentication, setMeetingAuthentication] = useState(false);
  const [registrantsEmailNotification, setRegistrantsEmailNotification] = useState(true);
  const [allowMultipleDevices, setAllowMultipleDevices] = useState(false);
  const [audioType, setAudioType] = useState("both");

  const [creating, setCreating] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [meetings, setMeetings] = useState<ZoomItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [selectedStaffEmails, setSelectedStaffEmails] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [hostDisplayName, setHostDisplayName] = useState<string | null>(null);
  const [hostDisplayEmail, setHostDisplayEmail] = useState<string | null>(null);

  const [platformProvider, setPlatformProvider] = useState<"zoom" | "daily">("daily");

  const mergeMeetingRecordings = (current: ZoomItem[], withRecordings: ZoomItem[]) => {
    const byId = new Map(
      withRecordings
        .filter((m) => m.id != null)
        .map((m) => [String(m.id), m] as const),
    );
    return current.map((meeting) => {
      if (meeting.id == null) return meeting;
      const updated = byId.get(String(meeting.id));
      return updated ?? meeting;
    });
  };

  const loadStaff = async () => {
    try {
      const usersData = await getUsers().catch(() => []);
      const rawUsers = Array.isArray(usersData) ? usersData : [];
      const staffOnly = rawUsers
        .filter((u: StaffUser) => (u.role ?? "").toLowerCase() === "staff")
        .filter((u: StaffUser) => Boolean(u.email?.trim()));
      setStaffUsers(staffOnly);
    } catch {
      // Staff list is optional for the schedule form.
    }
  };

  const loadRecordings = async (currentMeetings: ZoomItem[]) => {
    const hasEnded = currentMeetings.some((m) => m.session_status === "ended");
    if (!hasEnded) return;

    setRecordingsLoading(true);
    try {
      const mData = await getZoomMeetings({ include_recordings: true }).catch(() => null);
      if (mData && Array.isArray(mData.meetings)) {
        setMeetings((prev) => mergeMeetingRecordings(prev, mData.meetings));
      }
    } finally {
      setRecordingsLoading(false);
    }
  };

  const loadData = async (force = false) => {
    const cacheKey = "zoom-meetings-list";
    const cached = !force ? readDashboardCache<{ meetings?: ZoomItem[] }>(cacheKey) : null;
    if (cached?.meetings && Array.isArray(cached.meetings)) {
      setMeetings(cached.meetings);
      setItemsLoading(false);
      void loadRecordings(cached.meetings);
    } else {
      setItemsLoading(true);
    }

    try {
      const { data: mData } = await fetchDashboardCached(
        cacheKey,
        () => getZoomMeetings({ include_recordings: false }),
        { force },
      ).catch(() => ({ data: null as { meetings?: ZoomItem[] } | null }));

      if (mData && Array.isArray(mData.meetings)) {
        setMeetings(mData.meetings);
        void loadRecordings(mData.meetings);
      }
    } finally {
      setItemsLoading(false);
    }
  };

  const loadPlatformMeetingSettings = async () => {
    try {
      const { data } = await fetchDashboardCached(
        "platform-meeting-settings",
        getPlatformMeetingSettings,
      );
      setPlatformProvider(data.main_platform_meeting_provider === "zoom" ? "zoom" : "daily");
    } catch {
      setPlatformProvider("daily");
    }
  };

  useEffect(() => {
    void loadData();
    void loadStaff();
    void loadPlatformMeetingSettings();
    const storedName = localStorage.getItem("parrot_user_name");
    const storedEmail = localStorage.getItem("parrot_user_email");
    if (storedName) setHostDisplayName(storedName);
    if (storedEmail) setHostDisplayEmail(storedEmail);
  }, []);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return staffUsers;
    return staffUsers.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [staffSearch, staffUsers]);

  const invitePreview = useMemo(
    () => Array.from(new Set([...selectedStaffEmails, ...additionalEmails])),
    [selectedStaffEmails, additionalEmails],
  );

  const meetingStats = useMemo(() => {
    const live = meetings.filter((m) => m.session_status === "live").length;
    const upcoming = meetings.filter((m) => m.session_status === "upcoming").length;
    const ended = meetings.filter((m) => m.session_status === "ended").length;
    return { total: meetings.length, live, upcoming, ended };
  }, [meetings]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!meetingTitle.trim()) {
      toast({ variant: "destructive", title: "Title required", description: "Give your session a title." });
      return;
    }

    const zoomStart =
      meetingStartTime && meetingStartTime.includes("T")
        ? localDatetimeToZoomStart(meetingStartTime, meetingTimezone)
        : undefined;

    const payload: ZoomMeetingPayload = {
      topic: meetingTitle.trim(),
      duration: Number(meetingDuration) || undefined,
      start_time: zoomStart || undefined,
      agenda: meetingAgenda || undefined,
      invite_emails: invitePreview.length ? invitePreview.join(", ") : undefined,
      join_before_host: joinBeforeHost,
      mute_upon_entry: muteOnEntry,
      auto_recording: autoRecording,
      host_video: hostVideo,
      participant_video: participantVideo,
      waiting_room: waitingRoom,
      meeting_authentication: meetingAuthentication,
      registrants_email_notification: registrantsEmailNotification,
      allow_multiple_devices: allowMultipleDevices,
      audio: audioType,
      timezone: meetingTimezone,
      type: meetingType,
      require_registration: requireRegistration,
      recurrence,
      category: meetingCategory,
      reminder: reminderTime === "none" ? undefined : reminderTime,
    };

    setCreating(true);
    try {
      await createZoomMeeting(payload);
      toast({
        variant: "success",
        title: "Zoom meeting created",
        description: invitePreview.length
          ? `Invites will be sent to ${invitePreview.length} recipient${invitePreview.length === 1 ? "" : "s"}.`
          : undefined,
      });

      setMeetingTitle("");
      setMeetingDuration("30");
      setMeetingAgenda("");
      setMeetingStartTime("");
      setAdditionalEmails([]);
      setSelectedStaffEmails([]);

      await loadData(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create meeting",
      });
    } finally {
      setCreating(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [replayMeeting, setReplayMeeting] = useState<ZoomItem | null>(null);

  const handleDeleteMeeting = async (id: string | number | undefined) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this Zoom meeting?")) return;

    try {
      setDeletingId(id);
      await deleteZoomMeeting(id);
      toast({ title: "Meeting deleted", description: "The meeting has been removed." });
      setMeetings((prev) => prev.filter((m) => String(m.id) !== String(id)));
      void loadData(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete meeting.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartSession = (meeting: ZoomItem) => {
    if (!meeting.id) return;
    openZoomMeetingInNewTab(zoomMeetingEmbedRoom(meeting.id, 1, meeting.password), {
      beginLaunch: false,
      launchTitle: meeting.topic ?? "Zoom meeting",
      isHost: true,
    });
  };

  const handleCopy = (url: string) => {
    void navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Join link copied to clipboard." });
  };

  const toggleStaffEmail = (email: string) => {
    setSelectedStaffEmails((prev) =>
      prev.includes(email) ? prev.filter((x) => x !== email) : [...prev, email],
    );
  };

  const sortedMeetings = [...meetings].sort((a, b) => {
    const aTime = a.start_time ? Date.parse(a.start_time) : 0;
    const bTime = b.start_time ? Date.parse(b.start_time) : 0;
    if (aTime && bTime && aTime !== bTime) return bTime - aTime;
    return Number(b.id) - Number(a.id);
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={meetingType === "webinar" ? "Webinars" : "Meeting"}
        description={`Schedule sessions and manage recordings. Host: ${hostDisplayName ?? hostDisplayEmail ?? "Admin"}. Provider defaults are managed in Settings → Live meetings.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total meetings" value={meetingStats.total} />
        <AdminStatCard label="Live now" value={meetingStats.live} />
        <AdminStatCard label="Upcoming" value={meetingStats.upcoming} />
        <AdminStatCard label="Ended" value={meetingStats.ended} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* ─── Schedule form ─── */}
        <Card className="xl:col-span-2 border-[#012F6B]/10 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#012F6B]">
              <Video className="h-5 w-5" />
              {meetingType === "webinar" ? "Schedule a webinar" : "Schedule a meeting"}
            </CardTitle>
            <CardDescription>
              {meetingType === "webinar"
                ? "Create a broadcast-style webinar. Audience joins muted with camera off until you invite them to speak."
                : "Create an interactive meeting. Attendees join muted; they raise a hand before speaking."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-6" onSubmit={handleCreateMeeting}>
              <div className="space-y-4">
                <div className="space-y-2 max-w-xs">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoom-title">Title</Label>
                  <Input
                    id="zoom-title"
                    placeholder="e.g. IELTS prep live class"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start date & time</Label>
                  <SmartDateTimePicker
                    idPrefix="zoom-meeting"
                    value={meetingStartTime}
                    timezone={meetingTimezone}
                    onValueChange={setMeetingStartTime}
                    onTimezoneChange={setMeetingTimezone}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zoom-agenda">Agenda</Label>
                  <Textarea
                    id="zoom-agenda"
                    placeholder="What will you cover in this session?"
                    value={meetingAgenda}
                    onChange={(e) => setMeetingAgenda(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Invitations */}
              <div className="rounded-xl border border-[#012F6B]/10 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#012F6B]" />
                  <p className="text-sm font-semibold text-[#012F6B]">Invitations</p>
                  {invitePreview.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {invitePreview.length} total
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Staff members</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-9"
                      placeholder="Search staff by name or email…"
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-lg border bg-white p-2 space-y-1">
                    {staffUsers.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-3 text-center">No staff users found.</p>
                    ) : filteredStaff.length === 0 ? (
                      <p className="text-xs text-muted-foreground px-2 py-3 text-center">No matches for your search.</p>
                    ) : (
                      filteredStaff.map((u) => {
                        const selected = selectedStaffEmails.includes(u.email);
                        return (
                          <button
                            key={u.email}
                            type="button"
                            onClick={() => toggleStaffEmail(u.email)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                              selected ? "bg-[#012F6B]/10 border border-[#012F6B]/20" : "hover:bg-slate-50",
                            )}
                          >
                            <span
                              className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                selected ? "bg-[#012F6B] border-[#012F6B] text-white" : "border-slate-300",
                              )}
                            >
                              {selected ? "✓" : ""}
                            </span>
                            <span className="min-w-0">
                              <span className="font-medium block truncate">{u.name || u.email}</span>
                              <span className="text-xs text-muted-foreground block truncate">{u.email}</span>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <EmailChipInput
                  value={additionalEmails}
                  onChange={setAdditionalEmails}
                  placeholder="name@example.com"
                  label="Additional emails"
                  description="Invite guests who are not in the staff list."
                />
              </div>

              {/* Schedule extras + settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select value={recurrence} onValueChange={setRecurrence}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reminder</Label>
                  <Select value={reminderTime} onValueChange={setReminderTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="10m">10 minutes before</SelectItem>
                      <SelectItem value="1h">1 hour before</SelectItem>
                      <SelectItem value="24h">24 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between border-dashed">
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Meeting settings
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-3">
                  {[
                    { id: "jbh", label: "Allow join before host", checked: joinBeforeHost, onChange: setJoinBeforeHost },
                    { id: "mute", label: "Mute participants on entry", checked: muteOnEntry, onChange: setMuteOnEntry },
                    { id: "rec", label: "Auto-record meeting", checked: autoRecording, onChange: setAutoRecording },
                    { id: "hvid", label: "Host video on", checked: hostVideo, onChange: setHostVideo },
                    { id: "pvid", label: "Participant video on", checked: participantVideo, onChange: setParticipantVideo },
                    { id: "wr", label: "Waiting room", checked: waitingRoom, onChange: setWaitingRoom },
                    { id: "auth", label: "Require authentication", checked: meetingAuthentication, onChange: setMeetingAuthentication },
                    { id: "notify", label: "Registrant email notifications", checked: registrantsEmailNotification, onChange: setRegistrantsEmailNotification },
                    { id: "multi", label: "Allow multiple devices", checked: allowMultipleDevices, onChange: setAllowMultipleDevices },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 bg-white">
                      <Label htmlFor={item.id} className="text-sm font-normal cursor-pointer">
                        {item.label}
                      </Label>
                      <Switch id={item.id} checked={item.checked} onCheckedChange={item.onChange} />
                    </div>
                  ))}
                  <div className="space-y-2 pt-1">
                    <Label>Audio</Label>
                    <Select value={audioType} onValueChange={setAudioType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Computer & telephone</SelectItem>
                        <SelectItem value="voip">Computer audio only</SelectItem>
                        <SelectItem value="telephony">Telephone only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button
                type="submit"
                disabled={creating}
                className="w-full h-11 bg-[#012F6B] hover:bg-[#0a3d7a] font-semibold"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create meeting"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ─── Meetings list ─── */}
        <Card className="xl:col-span-3 border-[#012F6B]/10 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#012F6B]">
              <Calendar className="h-5 w-5" />
              Your meetings
            </CardTitle>
            <CardDescription>Start live sessions, share links, play back recordings, or remove meetings.</CardDescription>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : sortedMeetings.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No Zoom meetings yet</p>
                <p className="text-sm mt-1">Schedule your first session using the form.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-[#012F6B] truncate">
                            {m.topic || "Untitled meeting"}
                          </h3>
                          {meetingStatusBadge(m.session_status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatMeetingStartTime(m.start_time)}
                          {m.duration ? ` · ${m.duration} min` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {m.id && (
                          <>
                            {m.session_status !== "ended" && (
                              <Button size="sm" onClick={() => handleStartSession(m)}>
                                {m.session_status === "live" ? "Join" : "Start"}
                              </Button>
                            )}
                            {m.session_status === "ended" && m.recording_available && (
                              <>
                                <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50">
                                  <Disc3 className="h-3 w-3" />
                                  Recorded
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="gap-1.5"
                                  onClick={() => setReplayMeeting(m)}
                                >
                                  <PlayCircle className="h-4 w-4" />
                                  Playback
                                </Button>
                                {m.recording_download_url && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5"
                                    asChild
                                  >
                                    <a
                                      href={m.recording_download_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </a>
                                  </Button>
                                )}
                              </>
                            )}
                            {m.session_status === "ended" && !m.recording_available && (
                              <span className="text-xs text-muted-foreground px-1">
                                {recordingsLoading ? "Checking recording…" : "No recording"}
                              </span>
                            )}
                            <Button
                              size="icon"
                              variant="outline"
                              title="Copy join link"
                              onClick={() =>
                                handleCopy(
                                  `${window.location.origin}${zoomMeetingEmbedRoom(m.id!, 1, m.password)}`,
                                )
                              }
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          disabled={deletingId === m.id}
                          onClick={() => void handleDeleteMeeting(m.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ZoomRecordingPlayerDialog
        open={!!replayMeeting}
        onOpenChange={(open) => {
          if (!open) setReplayMeeting(null);
        }}
        title={replayMeeting?.topic}
        files={replayMeeting?.recording_files}
        fallbackDownloadUrl={replayMeeting?.recording_download_url}
        fallbackPlayUrl={replayMeeting?.recording_play_url}
      />
    </div>
  );
};

export default ZoomManagement;
