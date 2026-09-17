"use client";

import { usePathname } from "next/navigation";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { QueueHeartbeat } from "@/components/queue/queue-heartbeat";
import { SiteFooter } from "@/components/site-footer";
import { VerifiedUsersProvider } from "@/components/verified-name";

export function AppShell({
  children,
  waitingRoomEnabled,
}: {
  children: React.ReactNode;
  waitingRoomEnabled: boolean;
}) {
  const pathname = usePathname();
  if (pathname === "/waiting") return children;
  const hideFooter = [
    "/login",
    "/verify-email",
    "/onboarding",
    "/mypage",
    "/suspended",
  ].includes(pathname);

  return (
    <AuthProvider>
      <VerifiedUsersProvider>
        {waitingRoomEnabled && <QueueHeartbeat />}
        <OnboardingGuard>
          {children}
          {!hideFooter && <SiteFooter />}
          <AnnouncementPopup />
        </OnboardingGuard>
      </VerifiedUsersProvider>
    </AuthProvider>
  );
}
