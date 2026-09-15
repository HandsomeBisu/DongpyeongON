"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const dark = pathname === "/music";

  return (
    <footer
      className={`border-t px-5 py-7 ${dark ? "border-white/10 bg-[#121212] text-white/50" : "border-black/8 bg-[#f8f8fa] text-[var(--muted)]"}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <strong className={dark ? "text-white/75" : "text-[#3a3a3c]"}>
            DongpyeongON
          </strong>
          <p className="mt-1 text-xs">
            DPS Team이 제공하는 동평중학교 커뮤니티
          </p>
        </div>
        <nav
          aria-label="정책 안내"
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold"
        >
          <Link
            href="/terms"
            className="hover:underline hover:underline-offset-4"
          >
            이용약관
          </Link>
          <Link
            href="/privacy"
            className="hover:underline hover:underline-offset-4"
          >
            개인정보 처리방침
          </Link>
          <a
            href="mailto:support@dpsteam.kr"
            className="hover:underline hover:underline-offset-4"
          >
            문의하기
          </a>
        </nav>
      </div>
      <p className="mx-auto mt-5 max-w-6xl text-center text-[10px] opacity-70 sm:text-left">
        © 2026 DPS Team. All rights reserved.
      </p>
    </footer>
  );
}
