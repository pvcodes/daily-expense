"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  applyResolvedTheme, applyThemePreference, readThemePreference,
  storeThemePreference, systemTheme, THEME_MEDIA_QUERY, type ThemePreference, type ResolvedTheme
} from "@/lib/theme";

const options: { value: ThemePreference; label: string; Icon: typeof Monitor }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon }
];

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: ThemePreference) {
    setPreference(next);
    setResolved(next === "system" ? systemTheme() : next);
    applyThemePreference(next);
    storeThemePreference(next);
    setOpen(false);
  }

  const TriggerIcon = preference === "system" ? Monitor : resolved === "dark" ? Moon : Sun;
  return <div className="theme-control" ref={containerRef}>
    <button className="header-action" type="button" aria-haspopup="true" aria-expanded={open}
      aria-label={`Theme: ${preference}. Change theme`} onClick={() => setOpen((value) => !value)}>
      <TriggerIcon size={17} aria-hidden="true" />
    </button>
    {open && <div className="theme-menu" role="menu" aria-label="Choose a theme">
      {options.map(({ value, label, Icon }) => <button key={value} type="button" role="menuitemradio"
        aria-checked={preference === value} className={"theme-option" + (preference === value ? " selected" : "")}
        onClick={() => choose(value)}>
        <Icon size={15} aria-hidden="true" /><span>{label}</span>
        {preference === value && <Check size={14} aria-hidden="true" className="theme-check" />}
      </button>)}
    </div>}
  </div>;
}
