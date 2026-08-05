import axios from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
};

/** Best-effort message from axios / fetch API failures. */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorPayload | string | undefined;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
      if (data.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat()[0];
        if (typeof first === "string" && first.trim()) {
          return first.trim();
        }
      }
    }
    if (err.message && err.message !== "Network Error") {
      return err.message;
    }
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }

  return fallback;
}
