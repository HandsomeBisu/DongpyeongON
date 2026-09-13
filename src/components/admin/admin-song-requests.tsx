"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ListMusic, Music2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { SongRequestRecord, SongRequestStatus } from "@/types/spotify";

const statusOptions: Array<{ value: SongRequestStatus; label: string }> = [
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
  { value: "played", label: "재생 완료" },
];

export function AdminSongRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SongRequestRecord[]>([]);
  const [message, setMessage] = useState("노래 신청 내역을 불러오고 있어요.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!user) return;
    authenticatedFetch(user, "/api/admin/song-requests").then(async (response) => {
      if (!response.ok) { setMessage(response.status === 423 ? "노래 신청 관리 비밀번호 인증이 필요해요." : response.status === 403 ? "관리자만 접근할 수 있어요." : "신청 내역을 불러오지 못했어요."); return; }
      setRequests((await response.json()).requests); setMessage("");
    }).catch(() => setMessage("신청 내역을 불러오지 못했어요."));
  }, [user]);

  async function changeStatus(id: string, status: SongRequestStatus) {
    if (!user) return;
    setBusy(id);
    const response = await authenticatedFetch(user, `/api/admin/song-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (response.ok) { setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item)); setMessage("처리 상태를 변경했어요."); }
    else setMessage("처리 상태를 변경하지 못했어요.");
    setBusy("");
  }

  return <><SiteHeader/><main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10"><Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"><ArrowLeft size={16}/>관리자 홈</Link><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#20a34a]">노래 신청 관리</p><h1 className="mt-1 text-3xl font-bold tracking-tight">점심 방송 신청곡</h1><p className="mt-2 text-[var(--muted)]">신청곡을 검토하고 방송 진행 상태를 관리해요.</p></div><span className="hidden size-12 place-items-center rounded-2xl bg-[#e8f9ed] text-[#20a34a] sm:grid"><ListMusic size={24}/></span></div>{message && <p className={`mb-4 rounded-2xl px-4 py-3 text-sm ${message.includes("변경했어요") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{message}</p>}<section className="ios-card overflow-hidden"><div className="divide-y divide-[var(--border)]">{requests.map((request) => <article key={request.id} className="grid gap-4 p-4 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:p-5">{request.albumImageUrl ? <Image src={request.albumImageUrl} alt={`${request.albumName} 앨범 표지`} width={64} height={64} className="size-16 rounded-xl object-cover"/> : <span className="grid size-16 place-items-center rounded-xl bg-[#e8f9ed] text-[#20a34a]"><Music2 size={25}/></span>}<div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate">{request.name}</strong>{request.explicit && <span className="rounded bg-[#e5e5ea] px-1.5 py-0.5 text-[9px] font-bold text-[#6e6e73]">19</span>}<a href={request.spotifyUrl} target="_blank" rel="noreferrer" aria-label="Spotify에서 열기" className="text-[#20a34a]"><ExternalLink size={14}/></a></div><p className="mt-1 truncate text-sm text-[var(--muted)]">{request.artists} · {request.albumName}</p><p className="mt-2 text-xs text-[var(--muted)]">{request.requestedByName} · {request.requesterLabel || "학급 정보 없음"} · {formatDate(request.createdAt)}</p></div><select aria-label={`${request.name} 상태`} value={request.status} disabled={busy === request.id} onChange={(event) => void changeStatus(request.id, event.target.value as SongRequestStatus)} className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#007aff]">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></article>)}{!requests.length && <div className="grid min-h-64 place-items-center p-8 text-center text-sm text-[var(--muted)]">아직 접수된 신청곡이 없어요.</div>}</div></section></main></>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "방금 전";
}
