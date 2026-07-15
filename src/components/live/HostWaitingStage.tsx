import { Loader2, Users } from "lucide-react";
import { MeetingProfileAvatar } from "@/components/live/MeetingProfileAvatar";
export type HostBranding = {
  name: string;
  avatarUrl?: string | null;
  companyName: string;
  cohortTitle?: string;
  institutionMode?: boolean;
};

type Props = {
  branding: HostBranding;
  waitingCount?: number;
  connecting?: boolean;
};

export function HostWaitingStage({ branding, waitingCount = 0, connecting = false }: Props) {
  return (    <div className="absolute inset-0 z-[15] flex flex-col items-center justify-center bg-[#1a1a1a] px-6 text-center">
      <p className="mb-8 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
        {branding.companyName}
      </p>

      <div className="relative mb-6">
        <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#2d2d2d] bg-[#2d2d2d] shadow-2xl sm:h-40 sm:w-40">
          <MeetingProfileAvatar
            name={branding.name}
            avatarUrl={branding.avatarUrl}
            className="h-full w-full object-cover"
          />
        </div>        {connecting && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-8 w-8 animate-spin text-[#0e72ed]" />
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold text-white sm:text-3xl">{branding.name}</h2>
      {branding.cohortTitle && (
        <p className="mt-2 max-w-md text-sm text-zinc-400">{branding.cohortTitle}</p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-base text-zinc-300">
          {connecting ? "Joining your live session…" : "You are live — waiting for participants to join"}
        </p>
        {!connecting && waitingCount > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0e72ed]/15 px-4 py-2 text-sm text-[#6db3ff]">
            <Users className="h-4 w-4" />
            {waitingCount} {waitingCount === 1 ? "person" : "people"} in the queue
          </div>
        )}
        {!connecting && waitingCount === 0 && (
          <p className="max-w-sm text-sm text-zinc-500">
            Share the join link so learners can enter the queue. Use the Queue panel to admit them when ready.
          </p>
        )}
      </div>
    </div>
  );
}
