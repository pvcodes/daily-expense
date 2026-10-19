export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "pocket-ledger-theme";
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";
export const THEME_COLORS: Record<ResolvedTheme, string> = { light: "#faf6ef", dark: "#241d29" };
const THEME_COLOR_META_ID = "pocket-ledger-theme-color";

// Runs before first paint so the stored theme is applied without a flash.
// The preference (system/light/dark) is stored separately from the resolved
// light/dark value written to the document.
export const THEME_INIT_SCRIPT =
  "(function(){try{" +
  "var s=localStorage.getItem('" + THEME_STORAGE_KEY + "');" +
  "var p=(s==='light'||s==='dark')?s:'system';" +
  "var m=window.matchMedia&&window.matchMedia('" + THEME_MEDIA_QUERY + "').matches;" +
  "var r=p==='system'?(m?'dark':'light'):p;" +
  "document.documentElement.dataset.theme=r;" +
  "document.documentElement.style.colorScheme=r;" +
  "var c=document.createElement('meta');c.name='theme-color';" +
  "c.id='" + THEME_COLOR_META_ID + "';c.content=r==='dark'?'" + THEME_COLORS.dark + "':'" + THEME_COLORS.light + "';" +
  "document.head.appendChild(c);" +
  "}catch(e){}})();";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  // Override the OS-based theme-color tags so the PWA chrome matches the chosen theme.
  let meta = document.getElementById(THEME_COLOR_META_ID) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.id = THEME_COLOR_META_ID;
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLORS[theme];
}

export function applyThemePreference(preference: ThemePreference) {
  applyResolvedTheme(resolveTheme(preference));
}

export function storeThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* Private mode or storage disabled: the theme still applies for this session. */
  }
}
