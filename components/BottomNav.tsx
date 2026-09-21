"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/transactions", label: "Txns", icon: ListIcon },
  { href: "/categories", label: "Categories", icon: PieIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/80 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] font-medium transition-colors ${
                active
                  ? "text-accent"
                  : "text-ink-3"
              }`}
            >
              <item.icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
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
      <path
        d="M3 10.5 12 3l9 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 9.5V21h14V9.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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