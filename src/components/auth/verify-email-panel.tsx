"use client";

import { applyActionCode } from "firebase/auth";
import { ArrowLeft, CircleCheck, CircleX, LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { getFirebaseClient } from "@/lib/firebase/client";
import { SCHOOL_EMAIL_DOMAIN } from "@/lib/firebase/school-email";

type VerifyState = "checking" | "waiting" | "verifying" | "success" | "failed";

export function VerifyEmailPanel() {
  const [state, setState] = useState<VerifyState>("checking");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    let active = true;

    async function verify() {
      await Promise.resolve();
      if (!active || started.current) return;
      started.current = true;
      const params = new URL(window.location.href).searchParams;
      const code = params.get("oobCode");
      const mode = params.get("mode");

      if (!code || mode !== "verifyEmail") {
        setState(params.get("verified") === "1" ? "success" : "waiting");
        return;
      }

      setState("verifying");
      try {
        await applyActionCode(getFirebaseClient().auth, code);
        if (active) setState("success");
      } catch {
        if (active) setState("failed");
      }
    }

    void verify();
    return () => { active = false; };
  }, []);

  const title = state === "success" ? "이메일 인증이 완료됐어요" : state === "failed" ? "인증 링크를 사용할 수 없어요" : state === "waiting" ? "인증 메일을 확인해 주세요" : "이메일을 인증하고 있어요";
  const description = state === "success" ? "이제 학교 이메일과 비밀번호로 로그인할 수 있습니다." : state === "failed" ? "링크가 만료되었거나 이미 사용되었습니다. 로그인 화면에서 인증 메일을 다시 요청해 주세요." : state === "waiting" ? "받은 편지함에서 동평ON이 보낸 인증 링크를 누른 뒤 로그인해 주세요." : "인증 링크의 유효성을 확인하고 있습니다.";
  const verifying = state === "checking" || state === "verifying";

  return <main className="-mb-18 flex min-h-dvh flex-col bg-[#fbfbfc] px-5 text-[#171719] md:mb-0">
    <header className="flex h-20 shrink-0 items-center justify-between sm:h-24 sm:px-1"><BrandLogo/><Link href="/login" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#6e6e73] hover:bg-black/5 hover:text-black"><ArrowLeft size={15}/>로그인으로</Link></header>
    <section className="flex flex-1 items-center justify-center py-10 sm:-translate-y-5"><div className="page-enter w-full max-w-[410px] text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-[22px] ${state === "success" ? "bg-[#e8f8ed] text-[#28a745]" : state === "failed" ? "bg-[#fff0f0] text-[#ff3b30]" : "bg-[#edf5ff] text-[#007aff]"}`}>{state === "success" ? <CircleCheck size={30}/> : state === "failed" ? <CircleX size={30}/> : verifying ? <LoaderCircle className="animate-spin" size={29}/> : <MailCheck size={29}/>}</span>
      <p className="mt-6 text-xs font-bold tracking-[.14em] text-[#007aff]">EMAIL VERIFICATION</p><h1 className="mt-3 text-[28px] font-bold tracking-[-.04em] sm:text-[32px]">{title}</h1><p className="mx-auto mt-3 max-w-[360px] text-sm leading-6 text-[#77777d]">{description}</p>
      {!verifying && <div className="mt-7 flex flex-col items-center gap-3"><Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full bg-[#171719] px-7 text-sm font-bold text-white hover:scale-[1.02]">{state === "success" ? "로그인하기" : "로그인 화면으로"}</Link>{state === "waiting" && <p className="text-[11px] text-[#9a9aa0]">메일이 보이지 않으면 스팸함도 확인해 주세요.</p>}</div>}
    </div></section>
    <footer className="shrink-0 pb-8 text-center text-[11px] text-[#b0b0b6]">@{SCHOOL_EMAIL_DOMAIN} 학교 계정 전용</footer>
  </main>;
}
