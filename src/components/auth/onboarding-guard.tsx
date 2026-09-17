"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";
import { isAccountSuspended } from "@/lib/account-suspension";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [now, setNow] = useState(Date.now);
  const suspensionEndsAt = profile?.suspension?.endsAt;
  const suspended = isAccountSuspended(profile?.suspension, now);
  const policyPage = pathname === "/terms" || pathname === "/privacy";
  const needsOnboarding = Boolean(
    user && profile && !profile.onboardingCompleted,
  );
  const needsLogin = pathname === "/onboarding" && !loading && !user;
  const leaveOnboarding =
    pathname === "/onboarding" && Boolean(user && profile?.onboardingCompleted);
  const enterSuspension = Boolean(
    user && profile && suspended && pathname !== "/suspended",
  );
  const leaveSuspension =
    pathname === "/suspended" && !loading && (!user || !suspended);

  useEffect(() => {
    if (!suspensionEndsAt) return;
    const delay = Math.max(0, suspensionEndsAt - Date.now() + 100);
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(delay, 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [now, suspensionEndsAt]);

  useEffect(() => {
    if (loading) return;
    if (enterSuspension) router.replace("/suspended");
    else if (leaveSuspension)
      router.replace(user ? "/" : "/login");
    else if (needsLogin) router.replace("/login");
    else if (needsOnboarding && pathname !== "/onboarding" && !policyPage)
      router.replace("/onboarding");
    else if (leaveOnboarding) router.replace("/mypage");
  }, [
    leaveOnboarding,
    enterSuspension,
    leaveSuspension,
    loading,
    needsLogin,
    needsOnboarding,
    pathname,
    policyPage,
    router,
    user,
  ]);

  if (
    (loading && pathname === "/suspended") ||
    enterSuspension ||
    leaveSuspension ||
    needsLogin ||
    leaveOnboarding ||
    (needsOnboarding && pathname !== "/onboarding" && !policyPage)
  ) {
    return (
      <div className="min-h-dvh bg-[#f5f5f7]">
        <PageSkeleton className="pt-20" />
      </div>
    );
  }

  return children;
}
