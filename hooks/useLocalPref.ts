"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Reads/writes a single preference in localStorage as a raw string (all
 * consumer prefs are strings: period, category, search, weekStart, accent,
 * budget...). `encode`/`decode` let consumers store a non-string type.
 */
export function useLocalPref<T>(
  key: string,
  fallback: T,
  validate?: (v: unknown) => v is T,
  encode?: (v: T) => string,
  decode?: (raw: string) => T
): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return;
        const v: unknown = decode ? decode(raw) : raw;
        if (validate ? validate(v) : true) setValue(v as T);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (v: T) => {
      setValue(v);
      try {
        localStorage.setItem(key, encode ? encode(v) : (v as unknown as string));
      } catch {
        /* ignore */
      }
    },
    [key, encode]
  );

  return [value, set];
}
