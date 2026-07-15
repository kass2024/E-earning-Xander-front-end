import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import DailyIframe, { type DailyCall, type DailyParticipant } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  ChevronUp,
  Circle,
  Copy,
  Info,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  RefreshCw,
  Square,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ZoomPrejoinLobby } from "@/components/live/ZoomPrejoinLobby";
import { MeetingProfileAvatar } from "@/components/live/MeetingProfileAvatar";
import { SpeakingWaveOverlay } from "@/components/live/SpeakingWaveOverlay";
import { AudioLevelIndicator } from "@/components/live/AudioLevelIndicator";
import type { MediaDevicePreferences } from "@/hooks/useMediaDevices";
import { resolvePublicJoinUrl } from "@/lib/publicJoinUrl";
import { resolveZoomBrandingLogoUrl } from "@/lib/zoomAvatars";
import { LOGO, logoUrl } from "@/lib/brandLogo";
import { HUB } from "@/lib/hubConfig";

export type DailyMeetingSdkAuth = {
  join_url?: string | null;
  room_url?: string | null;
  token?: string | null;
  room_name?: string | null;
  role?: number;
  user_name?: string | null;
};

type ChatMessage = {
  id: string;
  from: string;
  text: string;
  at: number;
  local?: boolean;
};

type Props = {
  sdk: DailyMeetingSdkAuth;
  meetingTitle: string;
  userName?: string;
  avatarUrl?: string | null;
  institutionName?: string | null;
  logoUrl?: string | null;
  shareUrl?: string | null;
  isHost?: boolean;
  recording?: boolean;
  queueWaitingCount?: number;
  onJoined?: () => void;
  onLeft?: () => void;
  onCallEnded?: () => void;
  onJoinError?: (message: string) => void;
  onPrejoinCancel?: () => void;
  onToggleRecording?: (action: "start" | "stop", meta?: { clientHandled?: boolean }) => void;
  onOpenQueue?: () => void;
  leaveDashboardLabel?: string;
};

let dailyLifecycle: Promise<void> = Promise.resolve();

function runDailyLifecycle<T>(task: () => Promise<T>): Promise<T> {
  const next = dailyLifecycle.then(task, task);
  dailyLifecycle = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

function resolveJoinUrl(sdk: DailyMeetingSdkAuth): string {
  return String(sdk.join_url || sdk.room_url || "").trim();
}

function resolveToken(sdk: DailyMeetingSdkAuth): string {
  return String(sdk.token || "").trim();
}

function isAppShareUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || /daily\.co/i.test(trimmed)) return false;
  if (typeof window === "undefined") return trimmed.startsWith("/");
  try {
    const resolved = resolvePublicJoinUrl(trimmed);
    if (!resolved || /daily\.co/i.test(resolved)) return false;
    return new URL(resolved, window.location.origin).origin === window.location.origin;
  } catch {
    return trimmed.startsWith("/");
  }
}

export function buildDailyPrebuiltUrl(joinUrl: string, token: string, userName?: string): string {
  try {
    const url = new URL(joinUrl);
    url.searchParams.set("t", token);
    if (userName) url.searchParams.set("userName", userName);
    return url.toString();
  } catch {
    const sep = joinUrl.includes("?") ? "&" : "?";
    const name = userName ? `&userName=${encodeURIComponent(userName)}` : "";
    return `${joinUrl}${sep}t=${encodeURIComponent(token)}${name}`;
  }
}

async function destroyDailySingleton(): Promise<void> {
  try {
    const existing = typeof DailyIframe.getCallInstance === "function" ? DailyIframe.getCallInstance() : null;
    if (!existing) return;
    try {
      await existing.leave();
    } catch {
      // ignore
    }
    try {
      await existing.destroy();
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

/** Dynamic gallery columns for 1…N participants (Zoom-like). */
function galleryGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 9) return "grid-cols-2 md:grid-cols-3";
  if (count <= 16) return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
  return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5";
}

function BrandTile({
  name,
  logo,
  label,
  compact = false,
}: {
  name: string;
  logo?: string | null;
  label?: string;
  compact?: boolean;
}) {
  const resolved = resolveZoomBrandingLogoUrl(logo) || (logo === null ? null : logoUrl(LOGO.src));
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] px-3 text-center">
      <div
        className={`overflow-hidden rounded-full border-4 border-[#3a3a3a] bg-[#2d2d2d] ${
          compact ? "h-16 w-16 sm:h-20 sm:w-20" : "h-24 w-24 sm:h-32 sm:w-32"
        }`}
      >
        <MeetingProfileAvatar
          name={name}
          avatarUrl={resolved}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className={`truncate font-semibold text-white ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{name}</p>
        {label ? <p className="text-[11px] text-zinc-400">{label}</p> : null}
      </div>
    </div>
  );
}

function MicLevelBars({ level, muted }: { level: number; muted: boolean }) {
  const activeBars = muted ? 0 : Math.ceil(Math.min(1, Math.max(0, level)) * 5);
  return (
    <div className="mt-0.5 flex h-3 items-end gap-[2px]" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-[2px] rounded-sm transition-all duration-75 ${
            !muted && i <= activeBars ? "bg-emerald-400" : "bg-zinc-600"
          }`}
          style={{ height: 3 + i * 1.4 }}
        />
      ))}
    </div>
  );
}

function DailyDeviceMenu({
  kind,
  selectedId,
  devices,
  disabled,
  onSelect,
}: {
  kind: "audio" | "video";
  selectedId: string;
  devices: MediaDeviceInfo[];
  disabled?: boolean;
  onSelect: (deviceId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || devices.length === 0}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200 disabled:opacity-40"
        aria-label={kind === "audio" ? "Choose microphone" : "Choose camera"}
        title={devices.length === 0 ? `No ${kind === "audio" ? "microphone" : "camera"} found` : undefined}
      >
        <ChevronUp className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute bottom-full left-1/2 z-[220] mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-[#2a2a2a] py-1 shadow-xl">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            {kind === "audio" ? "Microphone" : "Camera"}
          </p>
          {devices.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400">No devices found</p>
          ) : (
            devices.map((device, index) => {
              const name =
                device.label?.trim() ||
                `${kind === "audio" ? "Microphone" : "Camera"} ${index + 1}`;
              const selected = device.deviceId === selectedId;
              return (
                <button
                  key={device.deviceId || `${kind}-${index}`}
                  type="button"
                  onClick={() => {
                    onSelect(device.deviceId);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/5"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {selected ? <Check className="h-3 w-3 text-emerald-400" /> : null}
                  </span>
                  <span className="truncate">{name}</span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function ControlButton({
  label,
  active,
  danger,
  onClick,
  children,
  badge,
  disabled,
  deviceMenu,
  meter,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
  badge?: number;
  disabled?: boolean;
  deviceMenu?: ReactNode;
  meter?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-0.5">
        <button
          type="button"
          title={label}
          disabled={disabled}
          onClick={onClick}
          className={`relative flex h-11 min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 text-[10px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            danger
              ? "bg-red-600 text-white hover:bg-red-500"
              : active
                ? "bg-[#0e72ed] text-white hover:bg-[#0b5fc7]"
                : "bg-[#3a3a3a] text-zinc-100 hover:bg-[#4a4a4a]"
          }`}
        >
          {children}
          {meter}
          <span className="leading-none">{label}</span>
          {typeof badge === "number" && badge > 0 ? (
            <span className="absolute -right-1 -top-1 rounded-full bg-[#0e72ed] px-1.5 py-0.5 text-[9px] font-semibold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          ) : null}
        </button>
        {deviceMenu}
      </div>
    </div>
  );
}

/**
 * Zoom-style Daily room: device prejoin, dynamic multi-participant gallery,
 * and full meeting controls (mic/cam/share/participants/chat/info/record).
 */
export function DailyMeetingRoom({
  sdk,
  meetingTitle,
  userName: userNameProp,
  avatarUrl,
  institutionName,
  logoUrl: logoUrlProp,
  shareUrl,
  isHost = false,
  recording = false,
  queueWaitingCount = 0,
  onJoined,
  onLeft,
  onCallEnded,
  onJoinError,
  onPrejoinCancel,
  onToggleRecording,
  onOpenQueue,
  leaveDashboardLabel = "Back to dashboard",
}: Props) {
  const { toast } = useToast();
  const callRef = useRef<DailyCall | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const remoteAudioEls = useRef<Record<string, HTMLAudioElement>>({});
  const joinedRef = useRef(false);
  const intentionalLeaveRef = useRef(false);
  const joinArgsRef = useRef({ joinUrl: "", token: "", displayName: "", devicePreferences: null as MediaDevicePreferences | null });
  const onJoinedRef = useRef(onJoined);
  const onLeftRef = useRef(onLeft);
  const onCallEndedRef = useRef(onCallEnded);
  const onJoinErrorRef = useRef(onJoinError);
  onJoinedRef.current = onJoined;
  onLeftRef.current = onLeft;
  onCallEndedRef.current = onCallEnded;
  onJoinErrorRef.current = onJoinError;

  const joinUrl = resolveJoinUrl(sdk);
  const token = resolveToken(sdk);
  const displayName =
    String(userNameProp || sdk.user_name || "").trim() ||
    (isHost ? String(institutionName || HUB.name).trim() || "Host" : "Participant");
  const brandLogo = resolveZoomBrandingLogoUrl(logoUrlProp || avatarUrl) || logoUrl(LOGO.src);
  const roomName = String(sdk.room_name || "").trim();

  const copyTarget = useMemo(() => {
    const preferred = resolvePublicJoinUrl(shareUrl);
    return isAppShareUrl(preferred) ? preferred : "";
  }, [shareUrl]);

  const [phase, setPhase] = useState<"prejoin" | "meeting" | "left">("prejoin");
  const [devicePreferences, setDevicePreferences] = useState<MediaDevicePreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [camOn, setCamOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remoteScreen, setRemoteScreen] = useState<{ sessionId: string; name: string } | null>(null);
  const [recordingOn, setRecordingOn] = useState(recording);
  const [remotes, setRemotes] = useState<DailyParticipant[]>([]);
  const [panel, setPanel] = useState<"none" | "people" | "chat" | "info">("none");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [audioTrackEpoch, setAudioTrackEpoch] = useState(0);
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const desiredMicRef = useRef(true);
  const desiredCamRef = useRef(false);

  const hasMicrophone = audioInputs.length > 0;
  const hasCamera = videoInputs.length > 0;
  const localSpeaking = micOn && localAudioLevel > 0.06;
  const screenActive = sharing || Boolean(remoteScreen);

  joinArgsRef.current = { joinUrl, token, displayName, devicePreferences };

  useEffect(() => {
    setRecordingOn(recording);
  }, [recording]);

  const refreshDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = list.filter((d) => d.kind === "audioinput");
      const cams = list.filter((d) => d.kind === "videoinput");
      setAudioInputs(mics);
      setVideoInputs(cams);
      setSelectedAudioId((prev) => prev || mics[0]?.deviceId || "");
      setSelectedVideoId((prev) => prev || cams[0]?.deviceId || "");
      return { mics, cams };
    } catch {
      setAudioInputs([]);
      setVideoInputs([]);
      return { mics: [] as MediaDeviceInfo[], cams: [] as MediaDeviceInfo[] };
    }
  };

  useEffect(() => {
    if (phase !== "meeting") return;
    void refreshDevices();
    const onChange = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", onChange);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", onChange);
  }, [phase]);

  // Local mic level — Zoom-style live RMS metering from the Daily audio track.
  useEffect(() => {
    if (phase !== "meeting" || !micOn) {
      setLocalAudioLevel(0);
      return;
    }

    let raf = 0;
    let ctx: AudioContext | null = null;
    let stopped = false;

    const start = () => {
      const call = callRef.current;
      const track = call?.participants()?.local?.tracks?.audio?.persistentTrack;
      if (!track || track.readyState === "ended") {
        setLocalAudioLevel(0);
        return;
      }

      try {
        ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(new MediaStream([track]));
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.35;
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);

        const tick = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          // Amplify so quiet speech still moves bars like Zoom.
          const level = Math.min(1, rms * 4.2);
          setLocalAudioLevel(level);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setLocalAudioLevel(0);
      }
    };

    start();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      if (ctx) void ctx.close();
    };
  }, [phase, micOn, audioTrackEpoch, selectedAudioId]);

  // Re-bind video / screen tracks after gallery tiles mount / remotes change.
  useEffect(() => {
    if (phase !== "meeting") return;
    const call = callRef.current;
    if (!call) return;
    const all = call.participants();
    const local = all.local;
    if (local?.video && local.tracks?.video?.persistentTrack && localVideoRef.current) {
      localVideoRef.current.srcObject = new MediaStream([local.tracks.video.persistentTrack]);
      void localVideoRef.current.play().catch(() => undefined);
    }

    const attachScreen = (p: DailyParticipant | undefined) => {
      const track = p?.tracks?.screenVideo?.persistentTrack;
      if (!track || !screenVideoRef.current) return;
      screenVideoRef.current.srcObject = new MediaStream([track]);
      void screenVideoRef.current.play().catch(() => undefined);
    };

    if (sharing && local?.screen) attachScreen(local);
    if (remoteScreen) {
      const remote = all[remoteScreen.sessionId] as DailyParticipant | undefined;
      attachScreen(remote);
    }

    remotes.forEach((p) => {
      const el = remoteVideoRefs.current[p.session_id];
      const track = p.tracks?.video?.persistentTrack;
      if (el && track && p.video) {
        el.srcObject = new MediaStream([track]);
        void el.play().catch(() => undefined);
      }
    });
  }, [phase, remotes, camOn, sharing, remoteScreen]);

  const participantCount = remotes.length + 1;
  const compactTiles = participantCount > 4;

  const copyJoinLink = async () => {
    if (!copyTarget) return;
    try {
      await navigator.clipboard.writeText(copyTarget);
      toast({ title: "Copied", description: "Meeting join link copied." });
    } catch {
      toast({ variant: "destructive", title: "Copy failed", description: "Could not copy the join link." });
    }
  };

  const goToLeftScreen = () => {
    setPhase("left");
    setLoading(false);
    setRemotes([]);
    setPanel("none");
    setSharing(false);
    setRemoteScreen(null);
    setLocalAudioLevel(0);
    Object.values(remoteAudioEls.current).forEach((el) => {
      try {
        el.pause();
        el.srcObject = null;
      } catch {
        // ignore
      }
    });
    remoteAudioEls.current = {};
    onCallEndedRef.current?.();
  };

  const leaveMeeting = async () => {
    intentionalLeaveRef.current = true;
    const call = callRef.current;
    callRef.current = null;
    if (call) {
      try {
        await call.leave();
      } catch {
        // ignore
      }
      try {
        await call.destroy();
      } catch {
        // ignore
      }
    }
    goToLeftScreen();
  };

  useEffect(() => {
    if (phase !== "meeting" || !devicePreferences) return;

    let cancelled = false;
    intentionalLeaveRef.current = false;

    const fail = (message: string) => {
      if (cancelled) return;
      setError(message);
      setLoading(false);
      onJoinErrorRef.current?.(message);
    };

    const args = joinArgsRef.current;
    const joinUrlNow = args.joinUrl;
    const tokenNow = args.token;
    const nameNow = args.displayName;
    const prefs = args.devicePreferences;
    if (!joinUrlNow || !tokenNow || !prefs) {
      fail("Daily join details incomplete.");
      return () => {
        cancelled = true;
      };
    }

    setError(null);
    setLoading(true);
    joinedRef.current = false;
    desiredCamRef.current = Boolean(prefs.startWithVideo);
    desiredMicRef.current = Boolean(prefs.startWithAudio);
    setCamOn(desiredCamRef.current);
    setMicOn(desiredMicRef.current);
    if (prefs.audioInputId) setSelectedAudioId(prefs.audioInputId);
    if (prefs.videoInputId) setSelectedVideoId(prefs.videoInputId);

    const syncParticipants = (call: DailyCall) => {
      const all = call.participants();
      const list = Object.values(all).filter((p) => p && !p.local) as DailyParticipant[];
      setRemotes(list);

      const local = all.local;
      if (local) {
        setSharing(Boolean(local.screen));
      }

      const sharer = list.find((p) => p.screen);
      if (sharer) {
        setRemoteScreen({
          sessionId: sharer.session_id,
          name: String(sharer.user_name || "Participant"),
        });
      } else if (!local?.screen) {
        setRemoteScreen(null);
      }
    };

    const playRemoteAudio = (participant: DailyParticipant) => {
      const track = participant.tracks?.audio?.persistentTrack;
      if (!track || participant.local) return;
      const id = participant.session_id;
      let audio = remoteAudioEls.current[id];
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        remoteAudioEls.current[id] = audio;
      }
      audio.srcObject = new MediaStream([track]);
      void audio.play().catch(() => undefined);
    };

    const attachTrack = (
      participant: DailyParticipant,
      kind: "video" | "audio" | "screenVideo",
    ) => {
      if (kind === "audio") {
        playRemoteAudio(participant);
        if (participant.local) setAudioTrackEpoch((n) => n + 1);
        return;
      }

      const track =
        kind === "screenVideo"
          ? participant.tracks?.screenVideo?.persistentTrack
          : participant.tracks?.video?.persistentTrack;
      if (!track) return;

      if (kind === "screenVideo") {
        if (participant.local) {
          setSharing(true);
          setRemoteScreen(null);
        } else {
          setRemoteScreen({
            sessionId: participant.session_id,
            name: String(participant.user_name || "Participant"),
          });
        }
        // Defer attach until the screen <video> mounts.
        requestAnimationFrame(() => {
          const el = screenVideoRef.current;
          if (!el) return;
          el.srcObject = new MediaStream([track]);
          void el.play().catch(() => undefined);
        });
        return;
      }

      const el = participant.local
        ? localVideoRef.current
        : remoteVideoRefs.current[participant.session_id];
      if (!el) return;
      el.srcObject = new MediaStream([track]);
      void el.play().catch(() => undefined);
    };

    const start = async () => {
      try {
        await runDailyLifecycle(async () => {
          if (cancelled) return;
          await destroyDailySingleton();

          const call = DailyIframe.createCallObject({
            dailyConfig: { useDevicePreferenceCookies: true },
          });
          if (cancelled) {
            await call.destroy();
            return;
          }
          callRef.current = call;

          call.on("joined-meeting", () => {
            if (cancelled || joinedRef.current) return;
            joinedRef.current = true;
            setLoading(false);
            setError(null);
            syncParticipants(call);
            setAudioTrackEpoch((n) => n + 1);
            onJoinedRef.current?.();
          });

          call.on("left-meeting", () => {
            // Ignore teardown from React Strict Mode / rejoin / intentional leave.
            if (cancelled || intentionalLeaveRef.current) return;
            goToLeftScreen();
          });

          call.on("error", (ev) => {
            const message =
              (ev as { errorMsg?: string })?.errorMsg ||
              (ev as { error?: { msg?: string } })?.error?.msg ||
              "Daily meeting error.";
            if (/camera|video|NotFoundError/i.test(message) && !prefs.startWithVideo) return;
            // Screen-share permission cancel is not a meeting failure.
            if (/screen|share|Permission denied|NotAllowedError/i.test(message)) {
              setSharing(false);
              return;
            }
            fail(message);
          });

          call.on("participant-updated", () => syncParticipants(call));
          call.on("participant-joined", () => syncParticipants(call));
          call.on("participant-left", (ev) => {
            const id = (ev as { participant?: { session_id?: string } })?.participant?.session_id;
            if (id && remoteAudioEls.current[id]) {
              try {
                remoteAudioEls.current[id].pause();
                remoteAudioEls.current[id].srcObject = null;
              } catch {
                // ignore
              }
              delete remoteAudioEls.current[id];
            }
            syncParticipants(call);
          });

          call.on("track-started", (ev) => {
            const p = ev?.participant;
            if (!p) return;
            const trackType = String((ev as { type?: string }).type || "");
            if (ev.track?.kind === "video") {
              if (trackType === "screenVideo" || p.screen) {
                attachTrack(p, "screenVideo");
              } else {
                attachTrack(p, "video");
              }
            }
            if (ev.track?.kind === "audio") {
              if (trackType === "screenAudio") {
                // optional: play system audio from share
                if (!p.local) {
                  const track = p.tracks?.screenAudio?.persistentTrack;
                  if (track) {
                    const audio = new Audio();
                    audio.autoplay = true;
                    audio.srcObject = new MediaStream([track]);
                    void audio.play().catch(() => undefined);
                    remoteAudioEls.current[`screen-${p.session_id}`] = audio;
                  }
                }
              } else {
                attachTrack(p, "audio");
              }
            }
            syncParticipants(call);
          });

          call.on("track-stopped", (ev) => {
            const trackType = String((ev as { type?: string }).type || "");
            const p = ev?.participant;
            if (trackType === "screenVideo") {
              if (p?.local) setSharing(false);
              else if (p?.session_id) {
                setRemoteScreen((prev) => (prev?.sessionId === p.session_id ? null : prev));
              }
              if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
            }
          });

          call.on("app-message", (ev) => {
            const data = (ev as { data?: { type?: string; text?: string; from?: string } })?.data;
            if (!data || data.type !== "chat" || !data.text) return;
            setMessages((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                from: String(data.from || "Participant"),
                text: String(data.text),
                at: Date.now(),
              },
            ]);
          });

          call.on("recording-started", () => setRecordingOn(true));
          call.on("recording-stopped", () => setRecordingOn(false));
          call.on("active-speaker-change", (ev) => {
            const id = (ev as { activeSpeaker?: { peerId?: string } })?.activeSpeaker?.peerId;
            setActiveSpeakerId(id ? String(id) : null);
          });

          await call.join({
            url: joinUrlNow,
            token: tokenNow,
            userName: nameNow,
            startVideoOff: !prefs.startWithVideo,
            startAudioOff: !prefs.startWithAudio,
          });

          if (cancelled) return;

          await refreshDevices();

          try {
            const devices: { audioDeviceId?: string; videoDeviceId?: string } = {};
            if (prefs.audioInputId) devices.audioDeviceId = prefs.audioInputId;
            if (prefs.videoInputId && prefs.startWithVideo) {
              devices.videoDeviceId = prefs.videoInputId;
            }
            if (Object.keys(devices).length && typeof call.setInputDevicesAsync === "function") {
              await call.setInputDevicesAsync(devices);
            }
          } catch {
            // best-effort
          }

          try {
            const { mics, cams } = await refreshDevices();
            if (!mics.length) {
              desiredMicRef.current = false;
              setMicOn(false);
              await call.setLocalAudio(false);
            } else {
              await call.setLocalAudio(desiredMicRef.current);
              setMicOn(desiredMicRef.current);
              setAudioTrackEpoch((n) => n + 1);
            }
            if (!cams.length || !desiredCamRef.current) {
              desiredCamRef.current = false;
              setCamOn(false);
              await call.setLocalVideo(false);
            } else {
              await call.setLocalVideo(true);
              setCamOn(true);
            }
          } catch {
            // ignore
          }

          syncParticipants(call);
          setLoading(false);
          if (!joinedRef.current) {
            joinedRef.current = true;
            onJoinedRef.current?.();
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to join Daily meeting.";
        if (/camera|NotFoundError|Permission/i.test(message) && !prefs.startWithVideo) {
          setLoading(false);
          return;
        }
        fail(message);
      }
    };

    void start();

    return () => {
      cancelled = true;
      intentionalLeaveRef.current = true;
      const call = callRef.current;
      callRef.current = null;
      void runDailyLifecycle(async () => {
        if (call) {
          try {
            await call.leave();
          } catch {
            // ignore
          }
          try {
            await call.destroy();
          } catch {
            // ignore
          }
        } else {
          await destroyDailySingleton();
        }
      });
    };
    // Join once per meeting entry — do not rejoin when parent refreshes token/name.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reloadKey]);

  const toggleCam = async () => {
    const call = callRef.current;
    if (!call) return;
    if (!hasCamera && !camOn) {
      const { cams } = await refreshDevices();
      if (cams.length === 0) {
        toast({
          variant: "destructive",
          title: "No camera found",
          description: "Connect a camera to start video. Logo branding stays on.",
        });
        return;
      }
    }
    const next = !camOn;
    desiredCamRef.current = next;
    try {
      await call.setLocalVideo(next);
      setCamOn(next);
    } catch {
      desiredCamRef.current = false;
      toast({
        variant: "destructive",
        title: "Camera unavailable",
        description: "Continue with logo branding — camera stays off.",
      });
      setCamOn(false);
    }
  };

  const toggleMic = async () => {
    const call = callRef.current;
    if (!call) return;
    if (!hasMicrophone && !micOn) {
      const { mics } = await refreshDevices();
      if (mics.length === 0) {
        toast({
          variant: "destructive",
          title: "No microphone found",
          description: "Connect a microphone to unmute.",
        });
        return;
      }
    }
    const next = !micOn;
    desiredMicRef.current = next;
    try {
      await call.setLocalAudio(next);
      setMicOn(next);
      if (!next) setLocalAudioLevel(0);
      else setAudioTrackEpoch((n) => n + 1);
    } catch {
      desiredMicRef.current = false;
      setMicOn(false);
      setLocalAudioLevel(0);
    }
  };

  const switchAudioDevice = async (deviceId: string) => {
    const call = callRef.current;
    if (!call || !deviceId) return;
    setSelectedAudioId(deviceId);
    try {
      await call.setInputDevicesAsync({ audioDeviceId: deviceId });
      // Keep current mute state — never touch video when switching mic.
      await call.setLocalAudio(desiredMicRef.current);
      setMicOn(desiredMicRef.current);
    } catch {
      toast({
        variant: "destructive",
        title: "Microphone switch failed",
        description: "Could not switch to that microphone.",
      });
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    const call = callRef.current;
    if (!call || !deviceId) return;
    setSelectedVideoId(deviceId);
    try {
      await call.setInputDevicesAsync({ videoDeviceId: deviceId });
      if (desiredCamRef.current) {
        await call.setLocalVideo(true);
        setCamOn(true);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Camera switch failed",
        description: "Could not switch to that camera.",
      });
    }
  };

  const toggleShare = async () => {
    const call = callRef.current;
    if (!call) return;
    try {
      if (sharing) {
        await call.stopScreenShare();
        setSharing(false);
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
      } else {
        await call.startScreenShare();
        setSharing(true);
        setRemoteScreen(null);
      }
    } catch (err) {
      setSharing(false);
      const message = err instanceof Error ? err.message : "Could not share screen.";
      if (/Permission|NotAllowed|AbortError|cancel/i.test(message)) {
        toast({ title: "Screen share cancelled", description: "No screen was shared." });
        return;
      }
      toast({
        variant: "destructive",
        title: "Screen share failed",
        description: message,
      });
    }
  };

  const toggleRecording = async () => {
    const next = !recordingOn;
    const call = callRef.current;
    let clientHandled = false;

    // Prefer in-call Daily recording (host token). Do not also REST-start —
    // Daily returns 400 "room has an active stream" if both run.
    if (call) {
      try {
        if (next) {
          await call.startRecording({ type: "cloud" });
        } else {
          await call.stopRecording();
        }
        clientHandled = true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // UI may be out of sync with an already-active cloud recording.
        if (next && /active stream|already.*(record|stream)/i.test(message)) {
          clientHandled = true;
        } else if (!next && /no active|not recording|not.*stream/i.test(message)) {
          clientHandled = true;
        }
        // Otherwise fall through to REST/backend.
      }
    }

    if (clientHandled) {
      setRecordingOn(next);
      toast({ title: next ? "Recording started" : "Recording stopped" });
      onToggleRecording?.(next ? "start" : "stop", { clientHandled: true });
      return;
    }

    if (onToggleRecording) {
      onToggleRecording(next ? "start" : "stop");
      setRecordingOn(next);
      return;
    }

    if (!call) return;
    try {
      if (next) {
        await call.startRecording({ type: "cloud" });
        setRecordingOn(true);
        toast({ title: "Recording started" });
      } else {
        await call.stopRecording();
        setRecordingOn(false);
        toast({ title: "Recording stopped" });
      }
    } catch (err) {
      setRecordingOn(false);
      toast({
        variant: "destructive",
        title: "Recording unavailable",
        description: err instanceof Error ? err.message : "Enable cloud recording on your Daily plan/domain.",
      });
    }
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text || !callRef.current) return;
    callRef.current.sendAppMessage({ type: "chat", text, from: displayName }, "*");
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-local`, from: displayName, text, at: Date.now(), local: true },
    ]);
    setChatInput("");
  };

  if (phase === "prejoin") {
    return (
      <ZoomPrejoinLobby
        meetingTitle={meetingTitle}
        userName={displayName}
        avatarUrl={brandLogo}
        institutionName={institutionName || (isHost ? displayName : undefined)}
        logoUrl={brandLogo}
        isHost={isHost}
        onJoin={(preferences) => {
          setDevicePreferences(preferences);
          setPhase("meeting");
          if (isHost) onJoinedRef.current?.();
        }}
        onCancel={onPrejoinCancel}
      />
    );
  }

  if (phase === "left") {
    return (
      <div className="flex h-full min-h-[100dvh] w-full flex-col items-center justify-center bg-[#1a1a1a] px-6 text-center">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-[#232323] p-8 shadow-xl">
          <p className="text-4xl" aria-hidden>
            👋
          </p>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">You&apos;ve left the call</h2>
            <p className="text-sm text-zinc-400">Return to the system dashboard to continue.</p>
          </div>
          <Button className="h-11 w-full bg-[#0e72ed] hover:bg-[#0b5fc7]" onClick={() => onLeftRef.current?.()}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {leaveDashboardLabel}
          </Button>
        </div>
      </div>
    );
  }

  const sideOpen = panel !== "none";

  return (
    <div className="relative flex h-full min-h-[100dvh] w-full flex-col bg-[#1a1a1a]">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#232323] px-3 sm:px-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-white">{meetingTitle}</p>
            {recordingOn ? (
              <span className="inline-flex items-center gap-1 rounded bg-red-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                <Circle className="h-2 w-2 fill-white" /> REC
              </span>
            ) : null}
          </div>
          <p className="truncate text-[11px] text-zinc-500">
            Daily{roomName ? ` · ${roomName}` : ""}
            {isHost ? " · Host" : ""}
            {` · ${participantCount} in call`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {copyTarget ? (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 bg-[#2d2d2d] text-xs text-zinc-100 hover:bg-[#3a3a3a]"
              onClick={() => void copyJoinLink()}
            >
              <Copy className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Copy join link</span>
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-lg text-sm text-red-300">{error}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              className="bg-[#0e72ed] hover:bg-[#0b5fc7]"
              onClick={() => {
                setError(null);
                setReloadKey((v) => v + 1);
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="secondary"
              className="bg-[#2d2d2d] text-zinc-100"
              onClick={() => {
                setError(null);
                setPhase("prejoin");
                setDevicePreferences(null);
              }}
            >
              Back to devices
            </Button>
            <Button variant="outline" className="border-zinc-600 text-zinc-200" onClick={() => void leaveMeeting()}>
              Leave
            </Button>
          </div>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0e72ed]" />
              <p className="text-sm text-zinc-200">Entering meeting…</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1">
              <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                {screenActive ? (
                  <div className="relative m-2 min-h-[42%] flex-[1.4] overflow-hidden rounded-xl border border-[#0e72ed]/50 bg-black">
                    <video ref={screenVideoRef} className="h-full w-full object-contain" playsInline autoPlay muted />
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-white">
                      {sharing ? "You are sharing screen" : `${remoteScreen?.name || "Participant"} is sharing`}
                    </span>
                    {sharing ? (
                      <Button
                        size="sm"
                        className="absolute right-2 top-2 h-7 bg-red-600 text-xs hover:bg-red-500"
                        onClick={() => void toggleShare()}
                      >
                        Stop share
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                <div
                  className={`grid min-h-0 flex-1 gap-2 p-2 auto-rows-fr ${galleryGridClass(participantCount)}`}
                >
                  <div
                    className={`relative min-h-[140px] overflow-hidden rounded-xl border bg-[#232323] sm:min-h-[180px] ${
                      localSpeaking ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-white/10"
                    }`}
                  >
                    {camOn ? (
                      <video ref={localVideoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
                    ) : (
                      <BrandTile
                        name={displayName}
                        logo={brandLogo}
                        label={isHost ? "Host" : "You"}
                        compact={compactTiles}
                      />
                    )}
                    <SpeakingWaveOverlay
                      active={localSpeaking}
                      level={micOn ? localAudioLevel : 0}
                      label={displayName}
                      className="absolute left-1/2 top-3 z-10 -translate-x-1/2"
                    />
                    <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                      {displayName} (You)
                      {!micOn ? " · muted" : ""}
                    </span>
                  </div>

                  {remotes.map((p) => {
                    const name = String(p.user_name || "Participant");
                    const videoOn = Boolean(p.video);
                    const speaking = Boolean(p.audio) && activeSpeakerId === p.session_id;
                    return (
                      <div
                        key={p.session_id}
                        className={`relative min-h-[140px] overflow-hidden rounded-xl border bg-[#232323] sm:min-h-[180px] ${
                          speaking ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-white/10"
                        }`}
                      >
                        {videoOn ? (
                          <video
                            ref={(el) => {
                              remoteVideoRefs.current[p.session_id] = el;
                            }}
                            className="h-full w-full object-cover"
                            playsInline
                            autoPlay
                          />
                        ) : (
                          <BrandTile name={name} logo={null} compact={compactTiles} />
                        )}
                        <SpeakingWaveOverlay
                          active={speaking}
                          level={speaking ? 0.7 : 0}
                          label={name}
                          className="absolute left-1/2 top-3 z-10 -translate-x-1/2"
                        />
                        <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
                          {name}
                          {!p.audio ? " · muted" : ""}
                          {p.screen ? " · sharing" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <AudioLevelIndicator level={localAudioLevel} muted={!micOn} />
              </div>

              {sideOpen ? (
                <aside className="flex w-[min(100vw,320px)] shrink-0 flex-col border-l border-white/10 bg-[#232323]">
                  <div className="flex h-11 items-center justify-between border-b border-white/10 px-3">
                    <p className="text-sm font-medium text-white">
                      {panel === "people" ? "Participants" : panel === "chat" ? "Chat" : "Meeting info"}
                    </p>
                    <button type="button" className="rounded p-1 text-zinc-400 hover:bg-white/10" onClick={() => setPanel("none")}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {panel === "people" ? (
                    <div className="flex-1 space-y-2 overflow-y-auto p-3">
                      <div className="flex items-center gap-2 rounded-lg bg-black/30 px-2 py-2">
                        <div className="h-8 w-8 overflow-hidden rounded-full">
                          <MeetingProfileAvatar name={displayName} avatarUrl={brandLogo} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{displayName} (You)</p>
                          <p className="text-[11px] text-zinc-500">{isHost ? "Host" : "Participant"}</p>
                        </div>
                      </div>
                      {remotes.map((p) => (
                        <div key={p.session_id} className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-2">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#3a3a3a]">
                            <MeetingProfileAvatar
                              name={String(p.user_name || "P")}
                              avatarUrl={null}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-white">{p.user_name || "Participant"}</p>
                            <p className="text-[11px] text-zinc-500">
                              {p.video ? "Camera on" : "Camera off"}
                              {p.audio ? "" : " · muted"}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isHost && onOpenQueue ? (
                        <Button
                          className="mt-2 w-full bg-[#0e72ed] hover:bg-[#0b5fc7]"
                          onClick={() => onOpenQueue()}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Open admit queue{queueWaitingCount > 0 ? ` (${queueWaitingCount})` : ""}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}

                  {panel === "chat" ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="flex-1 space-y-2 overflow-y-auto p-3">
                        {messages.length === 0 ? (
                          <p className="text-center text-xs text-zinc-500">No messages yet.</p>
                        ) : (
                          messages.map((m) => (
                            <div
                              key={m.id}
                              className={`rounded-lg px-2.5 py-1.5 text-sm ${
                                m.local ? "ml-6 bg-[#0e72ed]/30 text-white" : "mr-6 bg-black/30 text-zinc-100"
                              }`}
                            >
                              <p className="text-[10px] text-zinc-400">{m.from}</p>
                              <p>{m.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="flex gap-2 border-t border-white/10 p-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type a message…"
                          className="h-9 border-white/10 bg-black/30 text-white"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") sendChat();
                          }}
                        />
                        <Button className="h-9 bg-[#0e72ed] hover:bg-[#0b5fc7]" onClick={sendChat}>
                          Send
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {panel === "info" ? (
                    <div className="space-y-3 overflow-y-auto p-3 text-sm text-zinc-200">
                      <div>
                        <p className="text-[11px] uppercase text-zinc-500">Topic</p>
                        <p>{meetingTitle}</p>
                      </div>
                      {roomName ? (
                        <div>
                          <p className="text-[11px] uppercase text-zinc-500">Room</p>
                          <p className="break-all">{roomName}</p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[11px] uppercase text-zinc-500">Host display</p>
                        <p>{displayName}</p>
                      </div>
                      {copyTarget ? (
                        <div>
                          <p className="mb-1 text-[11px] uppercase text-zinc-500">Invite link</p>
                          <p className="mb-2 break-all text-xs text-zinc-400">{copyTarget}</p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-[#2d2d2d] text-zinc-100"
                            onClick={() => void copyJoinLink()}
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copy invite link
                          </Button>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[11px] uppercase text-zinc-500">In call</p>
                        <p>{participantCount} people</p>
                      </div>
                    </div>
                  ) : null}
                </aside>
              ) : null}
            </div>
          )}

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#1f1f1f] px-3 py-2.5">
            <ControlButton
              label={!hasMicrophone ? "No mic" : micOn ? "Mute" : "Unmute"}
              danger={!micOn || !hasMicrophone}
              disabled={!hasMicrophone && !micOn}
              onClick={() => void toggleMic()}
              meter={<MicLevelBars level={localAudioLevel} muted={!micOn} />}
              deviceMenu={
                <DailyDeviceMenu
                  kind="audio"
                  selectedId={selectedAudioId}
                  devices={audioInputs}
                  onSelect={(id) => void switchAudioDevice(id)}
                />
              }
            >
              {micOn && hasMicrophone ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </ControlButton>
            <ControlButton
              label={!hasCamera ? "No camera" : camOn ? "Stop video" : "Start video"}
              danger={!camOn || !hasCamera}
              disabled={!hasCamera && !camOn}
              onClick={() => void toggleCam()}
              deviceMenu={
                <DailyDeviceMenu
                  kind="video"
                  selectedId={selectedVideoId}
                  devices={videoInputs}
                  onSelect={(id) => void switchVideoDevice(id)}
                />
              }
            >
              {camOn && hasCamera ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </ControlButton>
            <ControlButton
              label={sharing ? "Stop share" : remoteScreen ? "Viewing" : "Share"}
              active={screenActive}
              disabled={Boolean(remoteScreen) && !sharing}
              onClick={() => void toggleShare()}
            >
              <MonitorUp className="h-4 w-4" />
            </ControlButton>
            <ControlButton
              label="Participants"
              active={panel === "people"}
              badge={participantCount}
              onClick={() => setPanel((p) => (p === "people" ? "none" : "people"))}
            >
              <Users className="h-4 w-4" />
            </ControlButton>
            <ControlButton
              label="Chat"
              active={panel === "chat"}
              badge={messages.length}
              onClick={() => setPanel((p) => (p === "chat" ? "none" : "chat"))}
            >
              <MessageSquare className="h-4 w-4" />
            </ControlButton>
            <ControlButton
              label="Info"
              active={panel === "info"}
              onClick={() => setPanel((p) => (p === "info" ? "none" : "info"))}
            >
              <Info className="h-4 w-4" />
            </ControlButton>
            {isHost ? (
              <ControlButton
                label={recordingOn ? "Stop rec" : "Record"}
                danger={recordingOn}
                onClick={() => void toggleRecording()}
              >
                {recordingOn ? <Square className="h-4 w-4" /> : <Circle className="h-4 w-4 fill-current" />}
              </ControlButton>
            ) : null}
            {isHost && onOpenQueue ? (
              <ControlButton label="Queue" badge={queueWaitingCount} onClick={() => onOpenQueue()}>
                <Users className="h-4 w-4" />
              </ControlButton>
            ) : null}
            <ControlButton label="Leave" danger onClick={() => void leaveMeeting()}>
              <X className="h-4 w-4" />
            </ControlButton>
          </div>
        </>
      )}
    </div>
  );
}

/** @deprecated kept for DailyReturn page imports */
export function rememberDailyReturnPath(path = window.location.pathname + window.location.search): void {
  try {
    sessionStorage.setItem("daily_return_path", path);
  } catch {
    // ignore
  }
}

export function consumeDailyReturnPath(fallback = "/dashboard"): string {
  try {
    const path = sessionStorage.getItem("daily_return_path");
    sessionStorage.removeItem("daily_return_path");
    if (path && path.startsWith("/")) return path;
  } catch {
    // ignore
  }
  return fallback;
}
