"use client";

import { useLocalPref } from "./useLocalPref";
import { useUserPrefs } from "./useUserPrefs";

/**
 * A preference that (1) drives UI from localStorage synchronously and
 * (2) persists to the server DB so it follows the user across devices.
 */
export function useSyncedPref<T>(key: string, fallback: T) {
  const [value, setLocal] = useLocalPref<T>(key, fallback);
  const { set: setRemote } = useUserPrefs();

  const set = (v: T) => {
    setLocal(v);
    setRemote(key, String(v));
  };

  return [value, set] as const;
}
