"use client";

import { useCallback, useRef, useState } from "react";
import { Check, LogOut, MoreHorizontal } from "lucide-react";
import { themeOptions, useDismissableMenu, useThemePreference } from "@/components/ThemeToggle";

/** Header overflow menu: theme preference plus sign out, behind a single ⋯ control. */
export function HeaderMenu({ onSignOut, signingOut }: { onSignOut: () => void; signingOut: boolean }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { preference, choose } = useThemePreference();
  const close = useCallback(() => setOpen(false), []);
  useDismissableMenu(open, close, containerRef);

  return <div className="theme-control" ref={containerRef}>
    <button className="header-action" type="button" aria-haspopup="true" aria-expanded={open}
      aria-label="More options" aria-controls={open ? "header-menu" : undefined} onClick={() => setOpen((value) => !value)}>
      <MoreHorizontal size={18} aria-hidden="true" />
    </button>
    {open && <div className="theme-menu header-menu" id="header-menu" role="menu" aria-label="Account options">
      <span className="menu-label">Theme</span>
      {themeOptions.map(({ value, label, Icon }) => <button key={value} type="button" role="menuitemradio"
        aria-checked={preference === value} className={"theme-option" + (preference === value ? " selected" : "")}
        onClick={() => choose(value)}>
        <Icon size={15} aria-hidden="true" /><span>{label}</span>
        {preference === value && <Check size={14} aria-hidden="true" className="theme-check" />}
      </button>)}
      <span className="menu-divider" aria-hidden="true" />
      <button className="theme-option menu-item" type="button" role="menuitem" disabled={signingOut}
        onClick={() => { close(); onSignOut(); }}>
        <LogOut size={15} aria-hidden="true" /><span>{signingOut ? "Signing out…" : "Sign out"}</span>
      </button>
    </div>}
  </div>;
}
