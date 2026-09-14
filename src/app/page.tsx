"use client";

import Link from "next/link";
import {
  Bell,
  Clock3,
  Home,
  Inbox,
  LogIn,
  Megaphone,
  MessageCircle,
  Music2,
  Radio,
  Search,
  Utensils,
} from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";
import { BrandLogo } from "@/components/brand-logo";
import { HomeCommunity } from "@/components/community/home-community";

const mobileLinks = [
  { href: "/", label: "홈", icon: Home },
  { href: "/#community", label: "커뮤니티", icon: MessageCircle },
  { href: "/suggestions", label: "신문고", icon: Inbox },
  { href: "/music", label: "신청곡", icon: Music2 },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <header className="glass-bar sticky top-0 z-40">
        <div className="mx-auto flex h-[74px] max-w-6xl items-center gap-5 px-5">
          <div className="mr-auto sm:mr-10">
            <BrandLogo />
          </div>
          <label className="hidden h-11 max-w-md flex-1 items-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 text-[var(--muted)] shadow-sm transition focus-within:border-[#007aff]/40 focus-within:shadow-[0_0_0_4px_rgba(0,122,255,.09)] sm:flex">
            <Search size={17} />
            <input
              aria-label="검색"
              placeholder="무엇을 찾으시나요?"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9aa0]"
            />
          </label>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link
              href="/suggestions"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] lg:flex"
            >
              <Inbox size={17} className="text-[#007aff]" />
              동평신문고
            </Link>
            <Link
              href="/music"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] lg:flex"
            >
              <Radio size={17} className="text-[#ff2d55]" />
              점심시간 노래방송
            </Link>
            <span className="hidden h-5 w-px bg-black/10 lg:block" />
            <button
              aria-label="알림"
              className="grid size-10 place-items-center rounded-full text-[var(--muted)] hover:scale-105 hover:bg-white hover:shadow-sm"
            >
              <Bell size={19} />
            </button>
            <span className="hidden h-5 w-px bg-black/10 sm:block" />
            <AuthButton />
          </div>
        </div>
      </header>

      <main className="page-enter mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:py-10">
        <HomeCommunity />

        <aside className="space-y-6 lg:sticky lg:top-[98px]">
          <SideCard
            icon={<Utensils size={22} />}
            title="오늘의 급식"
            badge="점심"
          >
            <div className="grid min-h-[150px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center text-sm text-[var(--muted)] shadow-inner">
              오늘의 급식 정보가
              <br />
              아직 등록되지 않았어요.
            </div>
          </SideCard>
          <SideCard icon={<Clock3 size={22} />} title="오늘 시간표">
            <div className="grid min-h-[150px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center">
              <div>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  우리 반 시간표를 확인하려면
                  <br />
                  먼저 로그인해 주세요.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#007aff] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:scale-[1.03]"
                >
                  <LogIn size={15} />
                  로그인하기
                </Link>
              </div>
            </div>
          </SideCard>
          <SideCard icon={<Megaphone size={22} />} title="학교/학생회 공지">
            <div className="grid min-h-[130px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center text-sm text-[var(--muted)]">
              등록된 공지사항이 없어요.
            </div>
          </SideCard>
        </aside>
      </main>

      <nav
        aria-label="모바일 메뉴"
        className="glass-bar fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-b-0 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
      >
        {mobileLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium ${href === "/" ? "text-[#007aff]" : "text-[var(--muted)]"}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function SideCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ios-card stagger-item p-5">
      <div className="mb-5 flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-xl font-bold tracking-[-0.025em]">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-lg border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}
