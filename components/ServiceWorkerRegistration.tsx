"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Check for updates on every load so a fresh deployment is picked up
        // immediately instead of lingering on the old cached bundle.
        await reg.update();
      } catch {
        // SW registration is best-effort; ignore failures
      }
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
