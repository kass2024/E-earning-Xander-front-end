import type { DailyCall } from "@daily-co/daily-js";

/**
 * Use the browser's native screen-share picker (tabs / windows / entire screen)
 * instead of Daily's constrained capture path, which can show a plain list UI.
 */
export async function acquireNativeDisplayStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("Screen sharing is not supported in this browser.");
  }
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error("Screen sharing requires HTTPS.");
  }

  // Minimal constraints → standard Chrome/Edge picker with thumbnails.
  return navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
}

export function bindDisplayStreamEnd(
  stream: MediaStream,
  onEnded: () => void,
): () => void {
  const track = stream.getVideoTracks()[0];
  if (!track) {
    return () => undefined;
  }

  const handler = () => onEnded();
  track.addEventListener("ended", handler);
  return () => track.removeEventListener("ended", handler);
}

export function stopDisplayStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // ignore
    }
  });
}

export async function startDailyNativeScreenShare(
  call: DailyCall,
  stream: MediaStream,
): Promise<void> {
  call.startScreenShare({ mediaStream: stream });
}

export async function stopDailyNativeScreenShare(
  call: DailyCall,
  stream: MediaStream | null | undefined,
): Promise<void> {
  try {
    await call.stopScreenShare();
  } catch {
    // ignore
  }
  stopDisplayStream(stream);
}
