import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Radio,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type { LiveZoomCohortQueueEntry } from "@/api/axios";

function formatJoinedAt(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  current: LiveZoomCohortQueueEntry | null;
  waiting: LiveZoomCohortQueueEntry[];
  admittedReady: LiveZoomCohortQueueEntry[];
  recording: boolean;
  actionLoading: boolean;
  sdkReady: boolean;
  onAdmitNext: () => void;
  onAdmitAll: () => void;
  onRelease: () => void;
  onAdmitEntry: (entryId: number) => void;
  onToggleRecording: (action: "start" | "stop", meta?: { clientHandled?: boolean }) => void;
};

export function HostQueuePanel({
  open,
  onClose,
  current,
  waiting,
  admittedReady,
  recording,
  actionLoading,
  sdkReady,
  onAdmitNext,
  onAdmitAll,
  onRelease,
  onAdmitEntry,
  onToggleRecording,
}: Props) {
  const hasCurrent = Boolean(current);
  const totalWaiting = waiting.length;

  return (
    <>
      {open && (
        <button
          type="button"
          className="absolute inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Close queue panel"
          onClick={onClose}
        />
      )}

      <aside
        className={`zoom-host-queue-panel fixed right-0 top-0 bottom-0 z-40 flex w-[min(100vw,360px)] flex-col border-l border-white/10 bg-[#232323] shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Join queue</h2>
            {totalWaiting > 0 && (
              <Badge className="h-5 bg-[#0e72ed] px-1.5 text-[10px] hover:bg-[#0e72ed]">
                {totalWaiting}
              </Badge>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 space-y-3 border-b border-white/10 p-4">
          <div
            className={`rounded-lg border p-3 ${
              hasCurrent ? "border-emerald-500/30 bg-emerald-950/20" : "border-white/10 bg-[#2d2d2d]"
            }`}
          >
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              <UserCheck className="h-3 w-3" />
              In session
            </p>
            {current ? (
              <div>
                <p className="truncate font-medium text-white">{current.display_name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge className="h-5 bg-emerald-600 capitalize text-[10px] hover:bg-emerald-600">
                    {current.status}
                  </Badge>
                  {current.is_guest && (
                    <Badge variant="outline" className="h-5 border-white/20 text-[10px] text-zinc-300">
                      Guest
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No active participant</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {!hasCurrent && totalWaiting > 0 && (
              <>
                <Button
                  size="sm"
                  className="h-9 bg-[#0e72ed] text-xs hover:bg-[#0b5fc7]"
                  disabled={actionLoading}
                  onClick={onAdmitNext}
                >
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Admit next in line
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9 bg-[#2d2d2d] text-xs text-zinc-200 hover:bg-[#3a3a3a]"
                  disabled={actionLoading}
                  onClick={onAdmitAll}
                >
                  Admit all waiting ({totalWaiting})
                </Button>
              </>
            )}
            {hasCurrent && (
              <Button
                size="sm"
                className="h-9 bg-[#0e72ed] text-xs hover:bg-[#0b5fc7]"
                disabled={actionLoading}
                onClick={onRelease}
              >
                Release → admit next
              </Button>
            )}
            <Button
              size="sm"
              variant={recording ? "destructive" : "secondary"}
              className={recording ? "h-9 text-xs" : "h-9 bg-[#2d2d2d] text-xs text-zinc-200 hover:bg-[#3a3a3a]"}
              disabled={actionLoading || !sdkReady}
              onClick={() => onToggleRecording(recording ? "stop" : "start")}
            >
              {actionLoading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Radio className="mr-1.5 h-3.5 w-3.5" />
              )}
              {recording ? "Stop recording" : "Start recording"}
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Waiting — first come, first served
          </p>
          <p className="mb-3 text-[11px] text-zinc-500">
            You can admit joiners manually at any time, even before the scheduled start.
          </p>
          {waiting.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 py-10 text-center text-xs text-zinc-500">
              No join requests yet
            </p>
          ) : (
            <div className="space-y-2">
              {waiting.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-white/10 bg-[#2d2d2d] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-zinc-500">#{entry.queue_position}</span>
                      <p className="truncate text-sm font-medium text-white">{entry.display_name}</p>
                    </div>
                    {entry.is_guest && (entry.guest_email || entry.guest_phone) && (
                      <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                        {[entry.guest_email, entry.guest_phone].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {entry.joined_at && (
                      <p className="mt-0.5 text-[10px] text-zinc-600">
                        Requested {formatJoinedAt(entry.joined_at)}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 shrink-0 border-[#0e72ed]/50 text-[10px] text-[#6db3ff] hover:bg-[#0e72ed]/10"
                    disabled={actionLoading || hasCurrent}
                    onClick={() => onAdmitEntry(entry.id)}
                    title={hasCurrent ? "Release current participant first" : "Admit this person"}
                  >
                    Admit
                  </Button>
                </div>
              ))}
            </div>
          )}

          {admittedReady.length > 0 && (
            <>
              <p className="mb-2 mt-4 px-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Ready to join
              </p>
              <div className="space-y-2">
                {admittedReady.map((entry) => (
                  <div
                    key={`ready-${entry.id}`}
                    className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm"
                  >
                    <p className="truncate font-medium text-white">{entry.display_name}</p>
                    <p className="mt-0.5 text-[10px] text-emerald-400/80">Can enter the meeting now</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
