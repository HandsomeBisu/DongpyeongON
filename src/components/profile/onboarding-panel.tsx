"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { StudentProfileForm } from "@/components/profile/student-profile-form";
import { PageSkeleton } from "@/components/ui/skeleton";

export function OnboardingPanel() {
  const router = useRouter();
  const { user, loading, saveStudentProfile } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user)
    return (
      <div className="min-h-dvh bg-[#f5f5f7]">
        <PageSkeleton className="pt-20" />
      </div>
    );

  return (
    <main className="relative min-h-dvh overflow-x-clip bg-[#f5f5f7] px-5 py-6 sm:grid sm:place-items-center sm:py-10">
      <div className="absolute -left-32 -top-36 size-96 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="absolute -bottom-48 -right-32 size-[28rem] rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="mb-7 flex items-center justify-between">
          <BrandLogo />
          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--muted)] shadow-sm">
            마지막 한 단계
          </span>
        </div>
        <section className="ios-card page-enter overflow-visible p-6 sm:p-9">
          <div className="mb-8 flex items-start gap-4">
            <span className="grid size-13 shrink-0 place-items-center rounded-[18px] bg-[#007aff] text-white shadow-lg shadow-blue-500/20">
              <GraduationCap size={25} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[.1em] text-[#007aff] sm:text-xs sm:tracking-[.12em]">
                WELCOME TO DONGPYEONGON
              </p>
              <h1 className="mt-2 break-keep text-2xl font-bold tracking-[-.04em] sm:text-3xl">
                학교생활에 맞게 준비할게요.
              </h1>
              <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)]">
                시간표와 학교 정보를 정확하게 보여드릴 수 있도록 학생 정보를
                입력해 주세요.
              </p>
            </div>
          </div>
          <StudentProfileForm
            submitLabel="DongpyeongON 시작하기"
            onSubmit={async (value) => {
              await saveStudentProfile(value);
              router.replace("/");
            }}
          />
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-[#8e8e93]">
            <ShieldCheck size={13} />
            입력한 정보는 학교 서비스 제공에만 사용돼요.
          </p>
        </section>
      </div>
    </main>
  );
}
