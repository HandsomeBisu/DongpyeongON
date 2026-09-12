"use client";

import { isSignInWithEmailLink } from "firebase/auth";
import { ArrowLeft, CircleCheck, LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-provider";
import { getFirebaseClient } from "@/lib/firebase/client";
import { EMAIL_FOR_SIGN_IN_KEY, isSchoolEmail, SCHOOL_EMAIL_DOMAIN } from "@/lib/firebase/school-email";

type VerifyState = "checking" | "waiting" | "needs-email" | "verifying" | "success" | "failed";

export function VerifyEmailPanel() {
  const router = useRouter();
  const { configured, error, completeEmailSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<VerifyState>("checking");
  const [localError, setLocalError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!configured || started.current) return;
    let active = true;
    async function inspectLink() {
      await Promise.resolve();
      if (!active) return;
      const link = window.location.href;
      if (!isSignInWithEmailLink(getFirebaseClient().auth, link)) {
        setState("waiting");
        return;
      }
      const storedEmail = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY) || "";
      if (!storedEmail) {
        setState("needs-email");
        return;
      }
      started.current = true;
      setEmail(storedEmail);
      setState("verifying");
      const completed = await completeEmailSignIn(storedEmail, link);
      if (!active) return;
      if (!completed) { setState("failed"); return; }
      setState("success");
      router.replace("/");
    }
    void inspectLink();
    return () => { active = false; };
  }, [completeEmailSignIn, configured, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    if (!isSchoolEmail(email)) {
      setLocalError(`@${SCHOOL_EMAIL_DOMAIN}로 끝나는 학교 이메일을 입력해 주세요.`);
      return;
    }
    setState("verifying");
    const completed = await completeEmailSignIn(email, window.location.href);
    if (!completed) { setState("failed"); return; }
    setState("success");
    router.replace("/");
  }

  const verifying = state === "checking" || state === "verifying";
  const title = state === "success" ? "인증이 완료되었어요" : state === "waiting" ? "이메일을 확인해 주세요" : verifying ? "이메일을 확인하고 있어요" : "학교 이메일을 확인해 주세요";
  const description = state === "waiting" ? "받은 편지함에서 동평ON 인증 링크를 누르면 이 페이지에서 로그인이 완료됩니다." : state === "needs-email" ? "보안을 위해 인증 링크를 받은 학교 이메일을 한 번 더 입력해 주세요." : state === "failed" ? "인증 링크를 처리하지 못했습니다. 다시 시도하거나 새 링크를 요청해 주세요." : state === "success" ? "잠시 후 동평ON으로 이동합니다." : "인증 링크의 유효성을 확인하는 중입니다.";

  return <main className="-mb-18 flex min-h-dvh flex-col bg-[#fbfbfc] px-5 text-[#171719] md:mb-0">
    <header className="flex h-20 shrink-0 items-center justify-between sm:h-24 sm:px-1"><BrandLogo/><Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-black/5 hover:text-black"><ArrowLeft size={15}/>로그인으로</Link></header>
    <section className="flex flex-1 items-center justify-center py-10 sm:-translate-y-5"><div className="page-enter w-full max-w-[410px] text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-[22px] ${state === "success" ? "bg-[#e8f8ed] text-[#28a745]" : "bg-[#edf5ff] text-[#007aff]"}`}>{state === "success" ? <CircleCheck size={30}/> : verifying ? <LoaderCircle className="animate-spin" size={29}/> : <MailCheck size={29}/>}</span>
      <p className="mt-6 text-xs font-bold tracking-[.14em] text-[#007aff]">EMAIL VERIFICATION</p><h1 className="mt-3 text-[28px] font-bold tracking-[-.04em] sm:text-[32px]">{title}</h1><p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#77777d]">{description}</p>
      {state === "needs-email" && <form onSubmit={submit} className="mt-7 space-y-3 text-left"><label htmlFor="verification-email" className="sr-only">학교 이메일 주소</label><input id="verification-email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setLocalError(null); }} required autoComplete="email" placeholder={`이메일 주소@${SCHOOL_EMAIL_DOMAIN}`} className="h-13 w-full rounded-full border border-[#d7d7dc] bg-white px-5 text-sm outline-none placeholder:text-[#aaaab2] focus:border-[#007aff]/60 focus:shadow-[0_0_0_4px_rgba(0,122,255,.09)]"/><button className="flex h-13 w-full items-center justify-center rounded-full bg-[#171719] text-sm font-bold text-white hover:scale-[1.01]">인증 완료하기</button></form>}
      {(localError || error) && <p role="alert" className="mt-5 rounded-2xl bg-[#fff0f0] px-4 py-3 text-xs leading-5 text-[#c62828]">{localError || error}</p>}
      {(state === "waiting" || state === "failed") && <div className="mt-7 flex flex-col items-center gap-3"><Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-[#171719] px-6 text-sm font-bold text-white hover:scale-[1.02]">새 인증 링크 요청하기</Link><p className="text-[11px] text-[#9a9aa0]">메일이 보이지 않으면 스팸함도 확인해 주세요.</p></div>}
    </div></section>
    <footer className="shrink-0 pb-8 text-center text-[11px] text-[#b0b0b6]">@{SCHOOL_EMAIL_DOMAIN} 학교 계정 전용</footer>
  </main>;
}
