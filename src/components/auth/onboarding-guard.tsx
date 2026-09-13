"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const needsOnboarding = Boolean(user && profile && !profile.onboardingCompleted);
  const needsLogin = pathname === "/onboarding" && !loading && !user;
  const leaveOnboarding = pathname === "/onboarding" && Boolean(user && profile?.onboardingCompleted);

  useEffect(() => {
    if (loading) return;
    if (needsLogin) router.replace("/login");
    else if (needsOnboarding && pathname !== "/onboarding") router.replace("/onboarding");
    else if (leaveOnboarding) router.replace("/mypage");
  }, [leaveOnboarding, loading, needsLogin, needsOnboarding, pathname, router]);

  if (needsLogin || leaveOnboarding || (needsOnboarding && pathname !== "/onboarding")) {
    return <div className="grid min-h-dvh place-items-center bg-[#f5f5f7]"><div className="ios-pop flex flex-col items-center gap-4"><BrandLogo/><span className="size-5 animate-spin rounded-full border-2 border-[#007aff]/25 border-t-[#007aff]"/><p className="text-xs text-[var(--muted)]">내 공간을 준비하고 있어요.</p></div></div>;
  }

  return children;
}
