"use client";

import { Clock3, LogOut, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "long",
  timeStyle: "short",
});

function remainingLabel(endsAt: number, now: number) {
  const seconds = Math.max(0, Math.ceil((endsAt - now) / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  if (minutes > 0) return `${minutes}분 남음`;
  return `${seconds}초 남음`;
}

export function SuspendedAccount() {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const [now, setNow] = useState(Date.now);
  const suspension = profile?.suspension;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(
    () => (suspension ? remainingLabel(suspension.endsAt, now) : ""),
    [now, suspension],
  );

  if (!suspension) return null;

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f5f7] px-5 py-12">
      <section className="page-enter w-full max-w-lg rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.10)] sm:p-9">
        <div className="grid size-16 place-items-center rounded-[22px] bg-red-50 text-[#ff3b30]">
          <ShieldAlert size={32} strokeWidth={2.2} />
        </div>
        <p className="mt-7 text-sm font-bold text-[#ff3b30]">계정 이용 제한</p>
        <h1 className="mt-2 break-keep text-3xl font-bold tracking-[-0.04em]">
          DongpyeongON 이용이 제한되었어요.
        </h1>
        <p className="mt-3 break-keep text-[15px] leading-6 text-[var(--muted)]">
          아래 기간 동안 이 계정으로 사이트 기능을 이용할 수 없습니다.
        </p>

        <dl className="mt-7 overflow-hidden rounded-2xl bg-[#f5f5f7]">
          <div className="border-b border-black/5 p-5">
            <dt className="text-xs font-bold text-[var(--muted)]">제한 사유</dt>
            <dd className="mt-2 whitespace-pre-wrap break-words text-[15px] font-semibold leading-6">
              {suspension.reason}
            </dd>
          </div>
          <div className="p-5">
            <dt className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
              <Clock3 size={14} /> 제한 기간
            </dt>
            <dd className="mt-2 text-[15px] font-semibold leading-6">
              {dateFormatter.format(suspension.startsAt)}
              <br />~ {dateFormatter.format(suspension.endsAt)}
            </dd>
            <p className="mt-2 text-sm font-bold text-[#007aff]">{remaining}</p>
          </div>
        </dl>

        <button
          type="button"
          onClick={() =>
            void signOut().finally(() => router.replace("/login"))
          }
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1d1d1f] text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <LogOut size={17} />
          다른 계정으로 로그인
        </button>
      </section>
    </main>
  );
}
