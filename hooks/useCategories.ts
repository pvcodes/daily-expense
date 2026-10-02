"use client";

import { useCallback, useMemo } from "react";
import { useLocalPref } from "./useLocalPref";
import { useUserPrefs } from "./useUserPrefs";
import {
  CUSTOM_CATEGORIES_KEY,
  DEFAULT_CATEGORIES,
  isDefaultCategory,
  mergeCategories,
  normalizeCategory,
  sameCategory,
} from "@/lib/types";

export type AddCategoryResult =
  | { ok: true; category: string; added: boolean }
  | { ok: false; error: string };

function decode(raw: string): string[] {
  try {
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) {
      return mergeCategories(arr.filter((v): v is string => typeof v === "string"));
    }
  } catch {
    // malformed value — start from nothing rather than crash
  }
  return [];
}

function encode(list: string[]): string {
  return JSON.stringify(list);
}

/**
 * The five defaults plus whatever this user has added. Stored like any other
 * preference: localStorage first (instant, offline) and flushed to the server
 * DB so the list follows the user to their other devices. Existing ledger
 * categories are adopted once, server-side (see seedCustomCategories).
 */
export function useCategories() {
  const [raw, setLocal] = useLocalPref<string[]>(
    CUSTOM_CATEGORIES_KEY,
    [],
    (v): v is string[] => Array.isArray(v),
    encode,
    decode
  );
  const { set: setRemote } = useUserPrefs();

  const custom = useMemo(() => mergeCategories(raw), [raw]);
  const categories = useMemo(
    () => mergeCategories(DEFAULT_CATEGORIES, custom),
    [custom]
  );

  const addCategory = useCallback(
    (input: string): AddCategoryResult => {
      const name = normalizeCategory(input);
      if (!name) return { ok: false, error: "Name can't be empty" };
      const existing = categories.find((c) => sameCategory(c, name));
      if (existing) return { ok: true, category: existing, added: false };
      const next = mergeCategories(custom, [name]);
      setLocal(next);
      setRemote(CUSTOM_CATEGORIES_KEY, encode(next));
      return { ok: true, category: name, added: true };
    },
    [categories, custom, setLocal, setRemote]
  );

  const removeCategory = useCallback(
    (input: string) => {
      const next = custom.filter((c) => !sameCategory(c, input));
      if (next.length === custom.length) return false;
      setLocal(next);
      setRemote(CUSTOM_CATEGORIES_KEY, encode(next));
      return true;
    },
    [custom, setLocal, setRemote]
  );

  return {
    categories,
    custom,
    addCategory,
    removeCategory,
    isDefault: isDefaultCategory,
  };
}
