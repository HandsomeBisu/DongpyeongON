"use client";

import Link from "next/link";
import { Bell, Home, Inbox, MessageCircle, Music2, Radio, Search } from "lucide-react";
import { AuthButton } from "@/components/auth/auth-button";
import { BrandLogo } from "@/components/brand-logo";

const links = [{ href: "/", label: "홈", icon: Home }, { href: "/community", label: "커뮤니티", icon: MessageCircle }, { href: "/suggestions", label: "신문고", icon: Inbox }, { href: "/music", label: "신청곡", icon: Music2 }];

export function SiteHeader({ active = "" }: { active?: string }) {
  return <>
    <header className="glass-bar sticky top-0 z-40">
      <div className="mx-auto flex h-[74px] max-w-6xl items-center gap-5 px-5">
        <div className="mr-auto sm:mr-10"><BrandLogo/></div>
        <label className="hidden h-11 max-w-md flex-1 items-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 text-[var(--muted)] shadow-sm transition focus-within:border-[#007aff]/40 focus-within:shadow-[0_0_0_4px_rgba(0,122,255,.09)] sm:flex">
          <Search size={17}/><input aria-label="검색" placeholder="무엇을 찾으시나요?" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9aa0]"/>
        </label>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link href="/music" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] lg:flex"><Radio size={17} className="text-[#ff2d55]"/>점심시간 노래방송</Link>
          <span className="hidden h-5 w-px bg-black/10 lg:block"/>
          <button aria-label="알림" className="grid size-10 place-items-center rounded-full text-[var(--muted)] hover:scale-105 hover:bg-white hover:shadow-sm"><Bell size={19}/></button>
          <span className="hidden h-5 w-px bg-black/10 sm:block"/>
          <AuthButton/>
        </div>
      </div>
    </header>
    <nav aria-label="모바일 메뉴" className="glass-bar fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-b-0 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden">{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium ${active === href ? "text-[#007aff]" : "text-[var(--muted)]"}`}><Icon size={20} strokeWidth={active === href ? 2.5 : 2}/>{label}</Link>)}</nav>
  </>;
}
