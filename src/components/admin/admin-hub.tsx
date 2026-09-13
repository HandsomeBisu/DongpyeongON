"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LoaderCircle, MessageCircle, Music2, ShieldCheck, Users, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { adminFetch } from "@/lib/admin-fetch";
import type { AdminCategory } from "@/lib/admin-session";

const categories = [
  { id: "users" as const, href: "/admin/users", title: "사용자 관리", description: "학생과 교사, 관리자의 역할 및 계정 정보를 관리해요.", icon: Users, color: "bg-[#e5f1ff] text-[#007aff]" },
  { id: "music" as const, href: "/admin/music", title: "노래 신청 관리", description: "학생 신청곡을 검토하고 방송 상태를 변경해요.", icon: Music2, color: "bg-[#e8f9ed] text-[#20a34a]" },
  { id: "community" as const, href: "/admin/community", title: "커뮤니티 관리", description: "게시물을 확인하고 공개 또는 숨김 상태를 관리해요.", icon: MessageCircle, color: "bg-[#f3eafa] text-[#af52de]" },
];

export function AdminHub() {
  const router = useRouter();
  const [selected, setSelected] = useState<(typeof categories)[number] | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<AdminCategory | null>(null);
  const [error, setError] = useState("");

  async function openCategory(category: (typeof categories)[number]) {
    setBusy(category.id);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/session?category=${category.id}`);
      if (response.ok) { router.push(category.href); return; }
      setPassword("");
      setSelected(category);
    } catch {
      setError("관리자 인증 상태를 확인하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(selected.id);
    setError("");
    try {
      const response = await adminFetch("/api/admin/session", { method: "POST", body: JSON.stringify({ category: selected.id, password }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "관리자 비밀번호를 확인해 주세요.");
        return;
      }
      router.push(selected.href);
    } catch {
      setError("관리자 인증을 완료하지 못했어요.");
    } finally {
      setBusy(null);
    }
  }

  return <><SiteHeader/><main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10"><div className="mx-auto max-w-3xl text-center"><span className="mx-auto grid size-14 place-items-center rounded-[19px] bg-[#007aff] text-white shadow-lg shadow-blue-500/20"><ShieldCheck size={27}/></span><p className="mt-5 text-xs font-bold tracking-[.14em] text-[#007aff]">DONGPYEONGON ADMIN</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">관리할 영역을 선택하세요.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted)]">각 관리 도구는 서로 다른 비밀번호로 보호돼요.</p></div><div className="mx-auto mt-9 grid max-w-4xl gap-4 md:grid-cols-3">{categories.map((category) => { const Icon = category.icon; return <button key={category.id} type="button" onClick={() => void openCategory(category)} disabled={busy !== null} className="ios-card ios-card-interactive group min-h-64 p-6 text-left disabled:opacity-55"><span className={`grid size-12 place-items-center rounded-2xl ${category.color}`}><Icon size={23}/></span><h2 className="mt-6 text-xl font-bold">{category.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{category.description}</p><span className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#007aff]">{busy === category.id ? <LoaderCircle size={16} className="animate-spin"/> : <>열기<ArrowRight size={15} className="transition-transform group-hover:translate-x-1"/></>}</span></button>; })}</div>{error && !selected && <p role="alert" className="mx-auto mt-5 max-w-xl rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</p>}</main>{selected && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/25 p-5 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setPassword(""); setError(""); } }}><form onSubmit={unlock} className="ios-pop w-full max-w-sm rounded-[26px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${selected.color}`}><selected.icon size={21}/></span><button type="button" aria-label="닫기" onClick={() => { setSelected(null); setPassword(""); setError(""); }} className="grid size-9 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)] hover:bg-[#e5e5ea]"><X size={17}/></button></div><h2 className="mt-5 text-xl font-bold">{selected.title} 잠금 해제</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">이 관리 영역에 설정된 전용 비밀번호를 입력해 주세요.</p><label className="mt-5 flex h-13 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 focus-within:border-[#007aff] focus-within:ring-4 focus-within:ring-blue-500/10"><KeyRound size={17} className="text-[#8e8e93]"/><input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoFocus autoComplete="off" required placeholder="관리자 비밀번호" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>{error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</p>}<button disabled={busy !== null} className="mt-4 flex h-13 w-full items-center justify-center rounded-2xl bg-[#171719] text-sm font-bold text-white hover:bg-black disabled:opacity-50">{busy ? <LoaderCircle size={19} className="animate-spin"/> : "확인"}</button></form></div>}</>;
}
