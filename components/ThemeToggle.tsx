"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const id = setTimeout(() => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function apply(t: "light" | "dark") {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("theme", t);
    } catch {
      // storage unavailable (private mode) — still apply for this session
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute("content", t === "dark" ? "#09090b" : "#f6f6f7");
    const sb = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (sb)
      sb.setAttribute(
        "content",
        t === "dark" ? "black-translucent" : "default"
      );
  }

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel-2 p-1">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          onClick={() => apply(t)}
          className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
            theme === t
              ? "bg-panel text-ink shadow-sm"
              : "text-ink-3 active:text-ink"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}