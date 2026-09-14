"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Clock3, ExternalLink, History, ListMusic, Music2, Play, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SpotifyAdminPlayer } from "@/components/admin/spotify-admin-player";
import { adminFetch } from "@/lib/admin-fetch";
import type { SongRequestRecord, SongRequestStatus } from "@/types/spotify";

type View = SongRequestStatus;

const views: Array<{ id: View; label: string }> = [
  { id: "pending", label: "승인 대기" },
  { id: "approved", label: "재생 목록" },
  { id: "played", label: "재생 완료" },
  { id: "rejected", label: "반려" },
];

export function AdminSongRequests() {
  const [requests, setRequests] = useState<SongRequestRecord[]>([]);
  const [view, setView] = useState<View>("pending");
  const [message, setMessage] = useState("노래 신청 내역을 불러오고 있어요.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/song-requests").then(async (response) => {
      if (!response.ok) {
        setMessage(response.status === 423 ? "노래 신청 관리 비밀번호 인증이 필요해요." : "신청 내역을 불러오지 못했어요.");
        return;
      }
      setRequests((await response.json()).requests);
      setMessage("");
    }).catch(() => setMessage("신청 내역을 불러오지 못했어요."));
  }, []);

  const counts = useMemo(() => Object.fromEntries(views.map(({ id }) => [id, requests.filter((request) => request.status === id).length])) as Record<View, number>, [requests]);
  const visibleRequests = useMemo(() => requests.filter((request) => request.status === view).sort((a, b) => dateValue(statusDate(b, view)) - dateValue(statusDate(a, view))), [requests, view]);

  async function changeStatus(id: string, status: SongRequestStatus) {
    setBusy(id);
    setMessage("");
    try {
      const response = await adminFetch(`/api/admin/song-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setMessage(data.error ?? "처리 상태를 변경하지 못했어요.");
        return;
      }
      const changedAt = new Date().toISOString();
      setRequests((items) => items.map((item) => item.id === id ? { ...item, status, updatedAt: changedAt, ...(status === "approved" ? { approvedAt: changedAt } : {}), ...(status === "rejected" ? { rejectedAt: changedAt } : {}), ...(status === "played" ? { playedAt: changedAt } : {}) } : item));
      setMessage(statusMessage(status));
    } catch {
      setMessage("처리 상태를 변경하지 못했어요.");
    } finally {
      setBusy("");
    }
  }

  return <><SiteHeader/><main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10"><Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"><ArrowLeft size={16}/>관리자 홈</Link><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#20a34a]">노래 신청 관리</p><h1 className="mt-1 text-3xl font-bold tracking-tight">점심 방송 신청곡</h1><p className="mt-2 text-[var(--muted)]">신청곡을 승인하고 최신 신청순으로 재생 목록을 관리해요.</p></div><span className="hidden size-12 place-items-center rounded-2xl bg-[#e8f9ed] text-[#20a34a] sm:grid"><ListMusic size={24}/></span></div><div className="mb-5 overflow-x-auto pb-1"><div className="flex min-w-max gap-2 rounded-2xl bg-[#e9e9ed] p-1.5">{views.map((item) => <button key={item.id} type="button" onClick={() => { setView(item.id); setMessage(""); }} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${view === item.id ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>{item.label}<span className={`rounded-full px-2 py-0.5 text-xs ${view === item.id ? "bg-[#e5f1ff] text-[#007aff]" : "bg-black/5"}`}>{counts[item.id]}</span></button>)}</div></div>{message && <p role="status" className={`mb-4 rounded-2xl px-4 py-3 text-sm ${message.includes("못했") || message.includes("필요") ? "bg-amber-50 text-amber-800" : message.includes("반려") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message}</p>}{view === "approved" && <><SpotifyAdminPlayer queue={visibleRequests}/><section className="mb-5 flex items-start gap-3 rounded-2xl border border-[#20a34a]/20 bg-[#e8f9ed] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#20a34a] shadow-sm"><Play size={19} fill="currentColor"/></span><div><h2 className="text-sm font-bold">최신 신청곡부터 재생해 주세요</h2><p className="mt-1 text-xs leading-5 text-[#497056]">목록 재생 버튼을 누르면 위에서 아래 순서로 재생돼요. 방송이 끝난 곡은 관리자가 직접 재생 완료로 처리합니다.</p></div></section></>}<section className="ios-card overflow-hidden"><div className="divide-y divide-[var(--border)]">{visibleRequests.map((request, index) => <SongRow key={request.id} request={request} index={index} view={view} busy={busy === request.id} onStatusChange={changeStatus}/>)}{!visibleRequests.length && <EmptyView view={view}/>}</div></section></main></>;
}

function SongRow({ request, index, view, busy, onStatusChange }: { request: SongRequestRecord; index: number; view: View; busy: boolean; onStatusChange: (id: string, status: SongRequestStatus) => Promise<void> }) {
  return <article className="grid gap-4 p-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center sm:p-5"><div className="relative">{request.albumImageUrl ? <Image src={request.albumImageUrl} alt={`${request.albumName} 앨범 표지`} width={72} height={72} className="size-18 rounded-2xl object-cover shadow-sm"/> : <span className="grid size-18 place-items-center rounded-2xl bg-[#e8f9ed] text-[#20a34a]"><Music2 size={27}/></span>}{view === "approved" && <span className="absolute -left-2 -top-2 grid size-7 place-items-center rounded-full bg-[#171719] text-xs font-bold text-white shadow-md">{index + 1}</span>}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-base">{request.name}</strong>{request.explicit && <span className="rounded bg-[#e5e5ea] px-1.5 py-0.5 text-[9px] font-bold text-[#6e6e73]">19</span>}</div><p className="mt-1 truncate text-sm text-[var(--muted)]">{request.artists} · {request.albumName}</p><p className="mt-2 text-xs text-[var(--muted)]">{request.requestedByName} · {request.requesterLabel || "학급 정보 없음"} · {formatDate(request.createdAt)}</p>{view === "played" && request.playedAt && <p className="mt-1 text-xs font-medium text-[#20a34a]">{formatDate(request.playedAt)} 재생 완료</p>}{view === "rejected" && request.rejectedAt && <p className="mt-1 text-xs font-medium text-[#ff3b30]">{formatDate(request.rejectedAt)} 반려</p>}</div><div className="flex flex-wrap items-center gap-2 sm:justify-end">{view === "pending" && <><button type="button" disabled={busy} onClick={() => void onStatusChange(request.id, "rejected")} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[#ff3b30] hover:bg-red-50 disabled:opacity-50"><X size={16}/>반려</button><button type="button" disabled={busy} onClick={() => void onStatusChange(request.id, "approved")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#20a34a] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#18863b] disabled:opacity-50"><Check size={16}/>승인</button></>}{view === "approved" && <><a href={request.spotifyUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#191414] px-4 text-sm font-semibold text-white hover:scale-[1.02]"><Play size={15} fill="currentColor"/>Spotify에서 재생<ExternalLink size={13}/></a><button type="button" disabled={busy} onClick={() => void onStatusChange(request.id, "played")} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#20a34a]/30 bg-[#e8f9ed] px-4 text-sm font-semibold text-[#18863b] hover:bg-[#d9f3e1] disabled:opacity-50"><CheckCircle2 size={16}/>재생 완료</button></>}{view === "played" && <a href={request.spotifyUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--muted)] hover:bg-[#f5f5f7]">Spotify에서 열기<ExternalLink size={13}/></a>}{view === "rejected" && <button type="button" disabled={busy} onClick={() => void onStatusChange(request.id, "pending")} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-sm font-semibold hover:bg-[#f5f5f7] disabled:opacity-50"><RotateCcw size={15}/>다시 검토</button>}</div></article>;
}

function EmptyView({ view }: { view: View }) {
  const content: Record<View, { icon: React.ReactNode; text: string }> = {
    pending: { icon: <Clock3 size={26}/>, text: "승인을 기다리는 신청곡이 없어요." },
    approved: { icon: <ListMusic size={26}/>, text: "승인된 재생 목록이 비어 있어요." },
    played: { icon: <History size={26}/>, text: "아직 재생 완료된 곡이 없어요." },
    rejected: { icon: <X size={26}/>, text: "반려된 신청곡이 없어요." },
  };
  return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#f2f2f7] text-[#8e8e93]">{content[view].icon}</span><p className="mt-4 text-sm text-[var(--muted)]">{content[view].text}</p></div></div>;
}

function statusMessage(status: SongRequestStatus) {
  if (status === "approved") return "신청곡을 승인하고 재생 목록에 추가했어요.";
  if (status === "rejected") return "신청곡을 반려했어요.";
  if (status === "played") return "재생 목록에서 제거하고 완료 기록으로 옮겼어요.";
  return "신청곡을 승인 대기로 되돌렸어요.";
}

function dateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function statusDate(request: SongRequestRecord, view: View) {
  if (view === "played") return request.playedAt ?? request.createdAt;
  if (view === "rejected") return request.rejectedAt ?? request.createdAt;
  return request.createdAt;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "방금 전";
}
