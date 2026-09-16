"use client";

import { ArrowUpRight, Ellipsis, ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  createAndroidExternalBrowserUrl,
  detectMobileInAppBrowser,
  type InAppBrowserInfo,
} from "@/lib/in-app-browser";

export function InAppBrowserGuard() {
  const [browser, setBrowser] = useState<InAppBrowserInfo | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setBrowser(detectMobileInAppBrowser(navigator.userAgent)),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!browser) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [browser]);

  function openExternalBrowser() {
    const currentUrl = window.location.href;
    if (browser?.platform === "android") {
      window.location.href = createAndroidExternalBrowserUrl(currentUrl);
      return;
    }
    window.open(currentUrl, "_blank", "noopener,noreferrer");
  }

  if (!browser) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-[#f2f2f7] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        <div className="flex justify-center">
          <BrandLogo />
        </div>

        <main className="my-auto py-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#007aff] text-white shadow-lg shadow-blue-500/25">
            <ExternalLink size={29} strokeWidth={2.2} />
          </span>
          <p className="mt-6 text-xs font-bold tracking-[.14em] text-[#007aff]">
            {browser.name.toUpperCase()} IN-APP BROWSER
          </p>
          <h1 className="mt-2 break-keep text-[30px] font-bold leading-tight tracking-[-.045em]">
            외부 브라우저에서
            <br />
            열어주세요.
          </h1>
          <p className="mx-auto mt-4 max-w-sm break-keep text-sm leading-6 text-[var(--muted)]">
            인앱 브라우저에서는 로그인과 음악 재생 등 일부 기능이 정상적으로
            작동하지 않을 수 있어요.
          </p>

          <button
            type="button"
            onClick={openExternalBrowser}
            className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#007aff] px-6 text-base font-bold text-white shadow-lg shadow-blue-500/20 active:scale-[.98]"
          >
            외부 브라우저로 이동
            <ArrowUpRight size={19} />
          </button>

          <section className="mt-5 rounded-[24px] border border-black/[.06] bg-white p-5 text-left shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f2f2f7] text-[#1c1c1e]">
                <ShieldCheck size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold">버튼이 작동하지 않나요?</h2>
                <p className="mt-1 break-keep text-sm leading-6 text-[var(--muted)]">
                  카카오톡 화면 오른쪽 아래의 점 3개 버튼을 누른 뒤,
                  <strong className="text-[var(--foreground)]">
                    {" "}‘다른 브라우저로 열기’
                  </strong>
                  를 선택해 주세요.
                </p>
              </div>
            </div>
            <div className="relative mt-4 h-20 overflow-hidden rounded-2xl border border-black/[.06] bg-[#f7f7f9]">
              <div className="absolute inset-x-0 top-0 h-7 border-b border-black/[.06] bg-white/80" />
              <div className="absolute bottom-2.5 right-3 flex items-center gap-2 text-xs font-bold text-[#007aff]">
                여기를 눌러주세요
                <span className="grid size-10 place-items-center rounded-full bg-white text-[#1c1c1e] shadow-md ring-2 ring-[#007aff]/20">
                  <Ellipsis size={22} />
                </span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
