"use client";

import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import {
  isSchoolEmail,
  normalizeEmail,
  SCHOOL_EMAIL_DOMAIN,
} from "@/lib/firebase/school-email";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export function LoginPanel() {
  const router = useRouter();
  const {
    user,
    profile,
    loading,
    configured,
    error,
    signIn,
    signInWithPassword,
    registerWithPassword,
  } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [action, setAction] = useState<"google" | "email" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile)
      router.replace(profile.onboardingCompleted ? "/" : "/onboarding");
  }, [profile, router, user]);

  async function continueWithGoogle() {
    setLocalError(null);
    setAction("google");
    try {
      await signIn();
    } finally {
      setAction(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (!isSchoolEmail(email)) {
      setLocalError(
        `@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`,
      );
      return;
    }
    if (password.length < 8) {
      setLocalError("비밀번호는 8자 이상 입력해 주세요.");
      return;
    }
    if (mode === "register" && password !== passwordConfirm) {
      setLocalError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setAction("email");
    try {
      const result =
        mode === "register"
          ? await registerWithPassword(email, password)
          : await signInWithPassword(email, password);
      if (result === "verification-sent") {
        sessionStorage.setItem(
          "dongpyeongon:verification-email",
          normalizeEmail(email),
        );
        router.push("/verify-email");
      }
      if (result === "signed-in") router.replace("/");
    } finally {
      setAction(null);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setPassword("");
    setPasswordConfirm("");
    setLocalError(null);
  }

  const disabled = loading || action !== null || !configured;

  return (
    <main className="flex min-h-[calc(100dvh-112px)] flex-col overflow-hidden bg-[#fbfbfc] px-5 text-[#171719]">
      <header className="flex h-20 shrink-0 items-center justify-between sm:h-24 sm:px-1">
        <BrandLogo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-black/5 hover:text-black"
        >
          <ArrowLeft size={15} />
          돌아가기
        </Link>
      </header>

      <section className="flex flex-1 items-center justify-center py-8 sm:-translate-y-3">
        <div className="page-enter w-full max-w-[380px]">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[.14em] text-[#007aff]">
              DONGPYEONGON
            </p>
            <h1 className="mt-3 text-[28px] font-bold tracking-[-.04em] sm:text-[32px]">
              로그인 또는 회원가입
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#77777d]">
              인증된 학교 계정으로 동평ON을 시작하세요.
            </p>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => void continueWithGoogle()}
            className="mt-7 flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[#d7d7dc] bg-white text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,.02)] hover:border-[#b8b8bf] hover:bg-[#f8f8f9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action === "google" ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            학교 Google 계정으로 계속하기
          </button>

          <div className="my-5 flex items-center gap-4 text-xs text-[#9a9aa0]">
            <span className="h-px flex-1 bg-[#e1e1e6]" />
            <span>또는</span>
            <span className="h-px flex-1 bg-[#e1e1e6]" />
          </div>

          <div className="mb-4 grid grid-cols-2 rounded-full bg-[#eeeef0] p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`rounded-full py-2.5 ${mode === "login" ? "bg-white text-[#171719] shadow-sm" : "text-[#77777d]"}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => changeMode("register")}
              className={`rounded-full py-2.5 ${mode === "register" ? "bg-white text-[#171719] shadow-sm" : "text-[#77777d]"}`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="sr-only" htmlFor="school-email">
              학교 이메일 주소
            </label>
            <input
              id="school-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setLocalError(null);
              }}
              required
              autoComplete="email"
              placeholder={`이메일 주소@${SCHOOL_EMAIL_DOMAIN}`}
              aria-describedby="school-email-help"
              aria-invalid={Boolean(localError)}
              className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)] aria-invalid:border-[#ff3b30]"
            />
            <div className="relative">
              <label className="sr-only" htmlFor="password">
                비밀번호
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setLocalError(null);
                }}
                required
                minLength={8}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                placeholder="비밀번호 8자 이상"
                className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 pr-12 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-[#8e8e93] hover:bg-black/5"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {mode === "register" && (
              <>
                <label className="sr-only" htmlFor="password-confirm">
                  비밀번호 확인
                </label>
                <input
                  id="password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => {
                    setPasswordConfirm(event.target.value);
                    setLocalError(null);
                  }}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="비밀번호 확인"
                  className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)]"
                />
              </>
            )}
            <p
              id="school-email-help"
              className="px-2 text-[11px] leading-4 text-[#8e8e93]"
            >
              @{SCHOOL_EMAIL_DOMAIN} 학교 주소만 사용할 수 있어요.
            </p>
            <button
              disabled={disabled}
              className="flex h-13 w-full items-center justify-center rounded-full bg-[#171719] text-sm font-bold text-white shadow-sm hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
            >
              {action === "email" || loading ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : mode === "register" ? (
                "계정 만들기"
              ) : (
                "이메일로 로그인"
              )}
            </button>
          </form>

          {!configured && (
            <p className="mt-4 rounded-2xl bg-[#fff3cd] px-4 py-3 text-center text-xs leading-5 text-[#7a5a00]">
              Firebase 환경 변수를 설정하면 로그인을 사용할 수 있어요.
            </p>
          )}
          {(localError || error) && (
            <p
              role="alert"
              className="mt-4 rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-xs leading-5 text-[#c62828]"
            >
              {localError || error}
            </p>
          )}
          <p className="mx-auto mt-6 max-w-[350px] text-center text-[11px] leading-5 text-[#8e8e93]">
            <span className="block sm:inline">계속 진행하면 </span>
            <span className="whitespace-nowrap">
              <Link
                href="/terms"
                className="font-semibold text-[#55555a] underline decoration-black/20 underline-offset-2 hover:text-[#007aff]"
              >
                이용약관
              </Link>{" "}
              및{" "}
              <Link
                href="/privacy"
                className="font-semibold text-[#55555a] underline decoration-black/20 underline-offset-2 hover:text-[#007aff]"
              >
                개인정보 보호 정책
              </Link>
              에
            </span>{" "}
            <span className="whitespace-nowrap">동의하는 것입니다.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
