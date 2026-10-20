"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  applyResolvedTheme, applyThemePreference, readThemePreference,
  storeThemePreference, systemTheme, THEME_MEDIA_QUERY, type ThemePreference, type ResolvedTheme
} from "@/lib/theme";

export const themeOptions: { value: ThemePreference; label: string; Icon: typeof Monitor }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon }
];

/** Shared theme state so the header menu and the login-page toggle stay in sync. */
export function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Read what the pre-paint script already applied so the menu starts in sync.
  useEffect(() => {
    const initial = readThemePreference();
    setPreference(initial);
    setResolved(initial === "system" ? systemTheme() : initial);
  }, []);

  // Follow the OS while the "system" preference is selected.
  useEffect(() => {
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(THEME_MEDIA_QUERY);
    const sync = () => { const next = systemTheme(); setResolved(next); applyResolvedTheme(next); };
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [preference]);

  const choose = useCallback((next: ThemePreference) => {
    setPreference(next);
    setResolved(next === "system" ? systemTheme() : next);
    applyThemePreference(next);
    storeThemePreference(next);
  }, []);

  const TriggerIcon = preference === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  return { preference, resolved, choose, TriggerIcon };
}

/** Closes a popover on outside clicks and Escape, shared by every header menu. */
export function useDismissableMenu(open: boolean, close: () => void, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => { if (!containerRef.current?.contains(event.target as Node)) close(); };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close, containerRef]);
}

/** Theme picker used on the login page; the dashboard folds it into the overflow menu. */
export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { preference, choose, TriggerIcon } = useThemePreference();
  const close = useCallback(() => setOpen(false), []);
  useDismissableMenu(open, close, containerRef);

  return <div className="theme-control" ref={containerRef}>
    <button className="header-action" type="button" aria-haspopup="true" aria-expanded={open}
      aria-label={`Theme: ${preference}. Change theme`} onClick={() => setOpen((value) => !value)}>
      <TriggerIcon size={17} aria-hidden="true" />
    </button>
    {open && <div className="theme-menu" role="menu" aria-label="Choose a theme">
      {themeOptions.map(({ value, label, Icon }) => <button key={value} type="button" role="menuitemradio"
        aria-checked={preference === value} className={"theme-option" + (preference === value ? " selected" : "")}
        onClick={() => { choose(value); close(); }}>
        <Icon size={15} aria-hidden="true" /><span>{label}</span>
        {preference === value && <Check size={14} aria-hidden="true" className="theme-check" />}
      </button>)}
    </div>}
  </div>;
}
