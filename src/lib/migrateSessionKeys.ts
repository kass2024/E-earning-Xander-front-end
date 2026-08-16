/** Copy legacy parrot_* localStorage keys to xander_* once per browser. */
export function migrateParrotSessionKeys(): void {
  if (typeof window === "undefined") return;

  const marker = "xander_session_keys_migrated";
  if (localStorage.getItem(marker) === "1") return;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("parrot_")) continue;

    const nextKey = `xander_${key.slice("parrot_".length)}`;
    if (localStorage.getItem(nextKey) == null) {
      const value = localStorage.getItem(key);
      if (value != null) localStorage.setItem(nextKey, value);
    }
  }

  localStorage.setItem(marker, "1");
}
