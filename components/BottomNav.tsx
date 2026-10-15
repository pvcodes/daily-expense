"use client";

import { BarChart3, CalendarDays, Plus, Receipt, Wallet } from "lucide-react";
import type { DashboardView } from "@/components/dashboard-types";
import { useEffect, useState, type RefObject } from "react";

const items: { value: DashboardView | "add"; label: string; Icon: typeof Wallet }[] = [
  { value: "home", label: "Home", Icon: Wallet },
  { value: "transactions", label: "Activity", Icon: Receipt },
  { value: "add", label: "Add", Icon: Wallet },
  { value: "recurring", label: "Repeats", Icon: CalendarDays },
  { value: "insights", label: "Insights", Icon: BarChart3 }
];

export function BottomNav({ view, onNavigate, onAdd, addRef }: {
  view: DashboardView; onNavigate: (view: DashboardView) => void; onAdd: () => void;
  addRef?: RefObject<HTMLButtonElement | null>;
}) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    let last = false;
    // Guard so page scrolling (visualViewport fires per frame) never churns React state.
    const update = () => {
      const next = Boolean(viewport && window.innerHeight - viewport.height > 140);
      if (next === last) return;
      last = next;
      setKeyboardOpen(next);
    };
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    update();
    return () => { viewport?.removeEventListener("resize", update); viewport?.removeEventListener("scroll", update); };
  }, []);
  return <nav className={"bottom-nav" + (keyboardOpen ? " keyboard-open" : "")} aria-label="Main navigation" aria-hidden={keyboardOpen} inert={keyboardOpen}><div className="nav-inner">
    {items.map(({ value, label, Icon }) => value === "add" ?
      <button ref={addRef} key={value} type="button" className="nav-item nav-add-item" aria-label="Add expense" onClick={onAdd}>
        <span className="nav-add"><Plus size={23} strokeWidth={2.2} /></span><span>{label}</span>
      </button> : <button key={value} type="button" className={"nav-item" + (view === value ? " active" : "")}
        aria-current={view === value ? "page" : undefined} onClick={() => onNavigate(value)}>
        <Icon size={19} strokeWidth={view === value ? 2.2 : 1.8} /><span>{label}</span>
      </button>)}
  </div></nav>;
}
