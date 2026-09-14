"use client";

import { ArrowLeft, CircleCheck, LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  isSchoolEmail,
  normalizeEmail,
  SCHOOL_EMAIL_DOMAIN,
} from "@/lib/firebase/school-email";

type VerifyState = "waiting" | "verifying" | "success";

export function VerifyEmailPanel() {
  const [state, setState] = useState<VerifyState>("waiting");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const storedEmail =
      sessionStorage.getItem("dongpyeongon:verification-email") ?? "";
    queueMicrotask(() => {
      if (active) setEmail(storedEmail);
    });
    return () => {
      active = false;
    };
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const normalized = normalizeEmail(email);
    if (!isSchoolEmail(normalized)) {
      setError(`@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("메일로 받은 6자리 인증 코드를 입력해 주세요.");
      return;
    }

    setState("verifying");
    try {
      const response = await fetch("/api/auth/email-verification/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized, code }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "인증 코드를 확인하지 못했습니다.");
      sessionStorage.removeItem("dongpyeongon:verification-email");
      setState("success");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "인증 코드를 확인하지 못했습니다.",
      );
      setState("waiting");
    }
  }

  const success = state === "success";
  const verifying = state === "verifying";

  return (
    <main className="flex min-h-dvh flex-col bg-[#fbfbfc] px-5 text-[#171719]">
      <header className="flex h-20 shrink-0 items-center justify-between sm:h-24 sm:px-1">
        <BrandLogo />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-black/5 hover:text-black"
        >
          <ArrowLeft size={15} />
          로그인으로
        </Link>
      </header>
      <section className="flex flex-1 items-center justify-center py-10 sm:-translate-y-5">
        <div className="page-enter w-full max-w-[410px] text-center">
          <span
            className={`mx-auto grid size-16 place-items-center rounded-[22px] ${success ? "bg-[#e8f8ed] text-[#28a745]" : "bg-[#edf5ff] text-[#007aff]"}`}
          >
            {success ? (
              <CircleCheck size={30} />
            ) : verifying ? (
              <LoaderCircle className="animate-spin" size={29} />
            ) : (
              <MailCheck size={29} />
            )}
          </span>
          <p className="mt-6 text-xs font-bold tracking-[.14em] text-[#007aff]">
            EMAIL VERIFICATION
          </p>
          <h1 className="mt-3 text-[27px] font-bold leading-[1.32] tracking-[-.04em] sm:text-[32px]">
            {success ? (
              "이메일 인증이 완료됐어요"
            ) : (
              <>
                <span className="block">메일로 보낸 코드를</span>
                <span className="block">입력해 주세요</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#77777d]">
            {success ? (
              "이제 학교 이메일과 비밀번호로 로그인할 수 있습니다."
            ) : (
              <>
                <span className="block">인증 코드는 10분 동안 유효하며,</span>
                <span className="block">5회까지 입력할 수 있어요.</span>
              </>
            )}
          </p>

          {success ? (
            <Link
              href="/login"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#171719] px-7 text-sm font-bold text-white hover:scale-[1.02]"
            >
              로그인하기
            </Link>
          ) : (
            <form
              onSubmit={verify}
              className="mx-auto mt-7 max-w-[360px] space-y-3 text-left"
            >
              <label className="sr-only" htmlFor="verification-email">
                학교 이메일
              </label>
              <input
                id="verification-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder={`이메일 주소@${SCHOOL_EMAIL_DOMAIN}`}
                className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)]"
              />
              <label className="sr-only" htmlFor="verification-code">
                6자리 인증 코드
              </label>
              <input
                id="verification-code"
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                placeholder="000000"
                className="h-15 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-center text-xl font-bold tracking-[.28em] outline-none placeholder:text-[#c7c7cc] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)]"
              />
              <button
                disabled={verifying}
                className="flex h-13 w-full items-center justify-center rounded-full bg-[#171719] text-sm font-bold text-white shadow-sm hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
              >
                {verifying ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  "인증하기"
                )}
              </button>
              {error && (
                <p
                  role="alert"
                  className="rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-xs leading-5 text-[#c62828]"
                >
                  {error}
                </p>
              )}
              <p className="px-3 pt-1 text-center text-[11px] leading-5 text-[#9a9aa0]">
                코드를 받지 못했다면{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#55555a] underline underline-offset-2"
                >
                  로그인 화면에서 다시 요청
                </Link>
                해 주세요.
              </p>
            </form>
          )}
        </div>
      </section>
      <footer className="shrink-0 pb-8 text-center text-[11px] text-[#b0b0b6]">
        @{SCHOOL_EMAIL_DOMAIN} 학교 계정 전용
      </footer>
    </main>
  );
}
