"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";

export function QueueHeartbeat() {
  const pathname = usePathname();
  const refresh = useCallback(async () => {
    const response = await fetch("/api/queue", { method: "POST" });
    if (!response.ok) return;
    const status = (await response.json()) as {
      admitted?: boolean;
      disabled?: boolean;
    };
    if (!status.admitted && !status.disabled) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(
        `/waiting?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }
  }, []);

  useEffect(() => {
    if (pathname === "/waiting") return;
    const timer = window.setInterval(() => void refresh(), 45_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pathname, refresh]);

  return null;
}
