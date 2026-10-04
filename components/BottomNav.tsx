"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/transactions", label: "Txns", icon: ListIcon },
  { href: "/categories", label: "Categories", icon: PieIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  const keyboardVisible = useKeyboardVisible();
  if (pathname === "/login") return null;
  return (
    <nav
      aria-label="Primary navigation"
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-[opacity,transform] duration-150 ${keyboardVisible ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto flex max-w-xl items-stretch justify-around px-2">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold tracking-wide transition-colors ${
                active ? "text-accent-text" : "text-ink-3"
              }`}
            >
              <item.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 1.7} />
              {item.label}
              <span
                className={`mt-0.5 h-1 w-1 rounded-full transition-colors ${
                  active ? "bg-accent" : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeWidth={3} />
    </svg>
  );
}

function PieIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M21.2 15.9A10 10 0 1 1 8 2.8" strokeLinecap="round" />
      <path d="M22 12A10 10 0 0 0 12 2v10h10Z" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
