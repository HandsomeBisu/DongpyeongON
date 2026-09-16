"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  GraduationCap,
  Mail,
  School,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { StudentProfileForm } from "@/components/profile/student-profile-form";
import { SiteHeader } from "@/components/site-header";

export function MyPage() {
  const router = useRouter();
  const { user, profile, loading, saveStudentProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (
    loading ||
    !user ||
    !profile ||
    !profile.onboardingCompleted ||
    profile.grade === null ||
    profile.classNumber === null ||
    profile.studentNumber === null
  ) {
    return (
      <>
        <SiteHeader />
        <main className="grid min-h-[70vh] place-items-center">
          <span className="size-6 animate-spin rounded-full border-2 border-[#007aff]/25 border-t-[#007aff]" />
        </main>
      </>
    );
  }

  const initials = profile.name.slice(-2);

  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-[#f5f5f7]">
      <SiteHeader active="/mypage" />
      <main className="page-enter mx-auto min-w-0 max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
        <div className="mb-7">
          <p className="text-sm font-semibold text-[#007aff]">마이페이지</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-.04em]">
            나의 DongpyeongON
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            내 계정과 학생 정보를 한곳에서 관리해요.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
          <aside className="ios-card overflow-hidden">
            <div className="hero-card relative p-6 text-white">
              <div className="absolute -right-10 -top-14 size-36 rounded-full bg-white/15 blur-2xl" />
              <div className="relative">
                <span className="grid size-20 place-items-center rounded-[26px] border border-white/20 bg-white/16 text-xl font-bold shadow-xl backdrop-blur-xl">
                  {initials}
                </span>
                <div className="mt-5 flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <BadgeCheck
                    size={19}
                    fill="white"
                    className="text-[#007aff]"
                  />
                </div>
                <p className="mt-1 text-sm text-white/75">동평중학교 학생</p>
              </div>
            </div>
            <div className="space-y-1 p-3">
              <ProfileRow
                icon={<GraduationCap size={18} />}
                label="학급"
                value={`${profile.grade}학년 ${profile.classNumber}반 ${profile.studentNumber}번`}
              />
              <ProfileRow
                icon={<Mail size={18} />}
                label="학교 이메일"
                value={profile.email}
              />
              <ProfileRow
                icon={<School size={18} />}
                label="학교"
                value="동평중학교"
              />
            </div>
          </aside>

          <section className="ios-card p-6 sm:p-8">
            <div className="mb-7 flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f1ff] text-[#007aff]">
                <UserRound size={19} />
              </span>
              <div>
                <h2 className="text-xl font-bold">학생 정보</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  학년이나 반이 바뀌었다면 최신 정보로 수정해 주세요.
                </p>
              </div>
            </div>
            <StudentProfileForm
              initialValue={{
                name: profile.name,
                grade: profile.grade,
                classNumber: profile.classNumber,
                studentNumber: profile.studentNumber,
              }}
              submitLabel="변경사항 저장"
              onSubmit={async (value) => {
                await saveStudentProfile(value);
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2400);
              }}
            />
            {saved && (
              <p
                role="status"
                className="ios-pop mt-4 flex items-center justify-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-xs font-semibold text-green-700"
              >
                <BadgeCheck size={16} />
                학생 정보가 저장됐어요.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-3 hover:bg-[#f5f5f7]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f2f2f7] text-[#6e6e73]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-[var(--muted)]">{label}</span>
        <strong className="block truncate text-sm font-semibold">
          {value}
        </strong>
      </span>
    </div>
  );
}
