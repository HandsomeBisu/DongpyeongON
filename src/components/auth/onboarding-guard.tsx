"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { PageSkeleton } from "@/components/ui/skeleton";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const policyPage = pathname === "/terms" || pathname === "/privacy";
  const needsOnboarding = Boolean(
    user && profile && !profile.onboardingCompleted,
  );
  const needsLogin = pathname === "/onboarding" && !loading && !user;
  const leaveOnboarding =
    pathname === "/onboarding" && Boolean(user && profile?.onboardingCompleted);

  useEffect(() => {
    if (loading) return;
    if (needsLogin) router.replace("/login");
    else if (needsOnboarding && pathname !== "/onboarding" && !policyPage)
      router.replace("/onboarding");
    else if (leaveOnboarding) router.replace("/mypage");
  }, [
    leaveOnboarding,
    loading,
    needsLogin,
    needsOnboarding,
    pathname,
    policyPage,
    router,
  ]);

  if (
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
