/** Meet vs Academy share one git repo; Docker build sets VITE_APP_NAME. */
export function isXanderMeet(): boolean {
  const name = String(import.meta.env.VITE_APP_NAME || "").toLowerCase();
  return name.includes("meet");
}
