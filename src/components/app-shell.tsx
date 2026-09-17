"use client";

import { usePathname } from "next/navigation";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { QueueHeartbeat } from "@/components/queue/queue-heartbeat";
import { SiteFooter } from "@/components/site-footer";

export function AppShell({
  children,
  waitingRoomEnabled,
}: {
  children: React.ReactNode;
  waitingRoomEnabled: boolean;
}) {
  const pathname = usePathname();
  if (pathname === "/waiting") return children;

  return (
    <AuthProvider>
      {waitingRoomEnabled && <QueueHeartbeat />}
      <OnboardingGuard>
        {children}
        {pathname !== "/suspended" && <SiteFooter />}
        <AnnouncementPopup />
      </OnboardingGuard>
    </AuthProvider>
  );
}
