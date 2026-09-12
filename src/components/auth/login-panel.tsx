"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { isSchoolEmail, SCHOOL_EMAIL_DOMAIN } from "@/lib/firebase/school-email";

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg>;
}

export function LoginPanel() {
  const router = useRouter();
  const { user, loading, configured, error, signIn, sendEmailLink } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace("/");
  }, [router, user]);

  async function continueWithGoogle() {
    setLocalError(null);
    setBusy(true);
    try { await signIn(); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (!isSchoolEmail(email)) {
      setLocalError(`@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`);
      return;
    }
    setBusy(true);
    try {
      if (await sendEmailLink(email)) router.push("/verify-email");
    } finally { setBusy(false); }
  }

  const disabled = loading || busy || !configured;

  return <main className="-mb-18 flex min-h-dvh flex-col overflow-hidden bg-[#fbfbfc] px-5 text-[#171719] md:mb-0">
    <header className="flex h-20 shrink-0 items-center justify-between sm:h-24 sm:px-1"><BrandLogo/><Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-black/5 hover:text-black"><ArrowLeft size={15}/>돌아가기</Link></header>

    <section className="flex flex-1 items-center justify-center py-10 sm:-translate-y-5">
      <div className="page-enter w-full max-w-[380px]">
        <div className="text-center"><p className="text-xs font-bold tracking-[.14em] text-[#007aff]">DONGPYEONGON</p><h1 className="mt-3 text-[28px] font-bold tracking-[-.04em] sm:text-[32px]">로그인 또는 회원가입</h1><p className="mt-2 text-sm leading-6 text-[#77777d]">학교 Google 계정 또는 이메일로 시작하세요.</p></div>

        <button type="button" disabled={disabled} onClick={() => void continueWithGoogle()} className="mt-8 flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[#d7d7dc] bg-white text-sm font-semibold shadow-[0_1px_2px_rgba(0,0,0,.02)] hover:border-[#b8b8bf] hover:bg-[#f8f8f9] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle className="size-5 animate-spin"/> : <GoogleMark/>}학교 Google 계정으로 계속하기</button>

        <div className="my-7 flex items-center gap-4 text-xs text-[#9a9aa0]"><span className="h-px flex-1 bg-[#e1e1e6]"/><span>또는</span><span className="h-px flex-1 bg-[#e1e1e6]"/></div>

        <form onSubmit={submit} className="space-y-3"><label className="sr-only" htmlFor="school-email">학교 이메일 주소</label><input id="school-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setLocalError(null); }} required autoComplete="email" placeholder={`이메일 주소@${SCHOOL_EMAIL_DOMAIN}`} aria-describedby="school-email-help" aria-invalid={Boolean(localError)} className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)] aria-invalid:border-[#ff3b30]"/><p id="school-email-help" className="px-2 text-[11px] leading-4 text-[#8e8e93]">@{SCHOOL_EMAIL_DOMAIN} 학교 주소만 사용할 수 있어요.</p><button disabled={disabled} className="flex h-13 w-full items-center justify-center rounded-full bg-[#171719] text-sm font-bold text-white shadow-sm hover:scale-[1.01] hover:bg-black disabled:cursor-not-allowed disabled:opacity-45">{loading || busy ? <LoaderCircle className="size-5 animate-spin"/> : "인증 이메일 받기"}</button></form>

        {!configured && <p className="mt-4 rounded-2xl bg-[#fff3cd] px-4 py-3 text-center text-xs leading-5 text-[#7a5a00]">Firebase 환경 변수를 설정하면 로그인을 사용할 수 있어요.</p>}
        {(localError || error) && <p role="alert" className="mt-4 rounded-2xl bg-[#fff0f0] px-4 py-3 text-center text-xs leading-5 text-[#c62828]">{localError || error}</p>}
        <p className="mx-auto mt-6 max-w-[330px] text-center text-[11px] leading-5 text-[#8e8e93]">계속 진행하면 <span className="font-semibold text-[#55555a]">이용약관</span> 및 <span className="font-semibold text-[#55555a]">개인정보 보호 정책</span>에 동의하는 것입니다.</p>
      </div>
    </section>

    <footer className="flex shrink-0 flex-col items-center pb-7 text-center sm:pb-8"><span className="text-xs font-semibold text-[#b0b0b6]">DongpyeongON</span><p className="mt-1 text-[10px] text-[#bebec4]">동평중학교 커뮤니티</p></footer>
  </main>;
}
