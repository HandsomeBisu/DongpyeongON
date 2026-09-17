"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function QueueHeartbeat() {
  const { user, loading } = useAuth();
  const active = !loading && Boolean(user);
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
    if (!active) return;
    void refresh();
    const timer = window.setInterval(() => void refresh(), 45_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [active, refresh]);

  return null;
}
