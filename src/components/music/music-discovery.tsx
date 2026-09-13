"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, CircleCheck, ExternalLink, LoaderCircle, Music2, Plus, Search, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { SongRequestRecord, SpotifyTrack } from "@/types/spotify";

const REQUEST_GUIDELINES = [
  "하루에 한 곡만 신청할 수 있어요.",
  "신청 한도는 매일 오전 7시에 초기화돼요.",
  "모든 노래는 검토 후에 재생돼요.",
  "19세 이용가로 분류된 노래는 신청해도 반려될 수 있어요.",
  "학교에서 재생하기 어려운 노래는 신청해도 반려될 수 있어요.",
];
const SEARCH_PAGE_SIZE = 10;

export function MusicDiscovery() {
  const { user, profile } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [visibleCount, setVisibleCount] = useState(SEARCH_PAGE_SIZE);
  const [searching, setSearching] = useState(false);
  const [requesting, setRequesting] = useState("");
  const [requestState, setRequestState] = useState<{ uid: string; request: SongRequestRecord | null; limitResetsAt: string } | null>(null);
  const [message, setMessage] = useState("");
  const todayRequest = requestState && requestState.uid === user?.uid ? requestState.request : null;
  const limitResetsAt = requestState && requestState.uid === user?.uid ? requestState.limitResetsAt : null;

  useEffect(() => {
    if (!user) return;
    authenticatedFetch(user, "/api/song-requests").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as { request: SongRequestRecord | null; limitResetsAt: string };
      setRequestState({ uid: user.uid, request: data.request, limitResetsAt: data.limitResetsAt });
    }).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!user || trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage("");
      try {
        const response = await authenticatedFetch(user, `/api/spotify/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data = await response.json() as { tracks?: SpotifyTrack[]; error?: string; retryAfter?: number };
        if (!response.ok) { setResults([]); setMessage(`${data.error ?? "노래를 검색하지 못했어요."}${data.retryAfter ? ` ${data.retryAfter}초 후 다시 시도해 주세요.` : ""}`); return; }
        setResults(data.tracks ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("검색 중 연결 문제가 발생했어요.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 420);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, user]);

  async function requestTrack(track: SpotifyTrack) {
    if (!user || todayRequest) return;
    setRequesting(track.id);
    setMessage("");
    try {
      const response = await authenticatedFetch(user, "/api/song-requests", { method: "POST", body: JSON.stringify({ trackId: track.id }) });
      const data = await response.json() as { request?: SongRequestRecord; error?: string; limitResetsAt?: string };
      if (!response.ok || !data.request) {
        setMessage(data.error ?? "노래를 신청하지 못했어요.");
        if (data.limitResetsAt) setRequestState({ uid: user.uid, request: data.request ?? null, limitResetsAt: data.limitResetsAt });
        return;
      }
      setRequestState({ uid: user.uid, request: data.request, limitResetsAt: data.request.limitResetsAt });
      setMessage("신청곡을 방송부에 전달했어요.");
    } catch {
      setMessage("노래를 신청하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setRequesting("");
    }
  }

  return <div className="min-h-screen bg-black p-2 text-white sm:p-3"><main className="min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[14px] bg-linear-to-b from-[#282828] via-[#151515] to-[#121212]"><header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-[#121212]/75 px-4 backdrop-blur-2xl sm:px-6"><Link href="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-2.5 text-xs font-bold text-white hover:scale-[1.02] hover:border-white/30 hover:bg-white/12 sm:px-4"><span className="hidden sm:inline">DongpyeongON으로 돌아가기</span><span className="sm:hidden">돌아가기</span><ArrowUpRight size={15}/></Link><label className={`flex h-11 min-w-0 max-w-xl flex-1 items-center gap-3 rounded-full bg-white px-4 text-black shadow-lg ${!user ? "opacity-60" : ""}`}><Search size={20}/><input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setVisibleCount(SEARCH_PAGE_SIZE); if (value.trim().length < 2) { setResults([]); setSearching(false); setMessage(""); } }} disabled={!user} placeholder={user ? "노래 또는 아티스트 검색" : "로그인 후 검색할 수 있어요"} className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#6a6a6a]"/>{searching && user && <LoaderCircle size={17} className="animate-spin text-[#555]"/>}</label><Link href={user ? "/mypage" : "/login"} className="ml-auto hidden rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:scale-105 md:block">{user ? profile?.name || "마이페이지" : "학교 계정으로 로그인"}</Link><Link href={user ? "/mypage" : "/login"} aria-label={user ? "마이페이지" : "로그인"} className="hidden size-9 place-items-center rounded-full bg-[#2a2a2a] hover:bg-[#383838] sm:grid"><UserRound size={18}/></Link></header><div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6"><section className="page-enter relative mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-[#1db954] via-[#178544] to-[#123d2c] p-6 sm:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#1ed760]/25 blur-3xl"/><div className="relative max-w-2xl"><span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-white/70"><Sparkles size={14}/>Dongpyeong lunch music</span><h1 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">점심시간에 듣고 싶은 노래,<br/>이제 신청해 보세요.</h1><p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">Spotify에서 노래를 검색하고, 듣고 싶은 한 곡을 방송부에 보내보세요.</p></div></section><section aria-labelledby="request-guidelines-title" className="page-enter mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1ed760]/15 text-[#1ed760]"><CircleCheck size={21}/></span><div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#1ed760]">Before you request</p><h2 id="request-guidelines-title" className="mt-0.5 text-lg font-bold">신청 전 확인해 주세요</h2></div></div><ul className="mt-5 grid gap-3 sm:grid-cols-2">{REQUEST_GUIDELINES.map((guideline) => <li key={guideline} className="flex items-start gap-2.5 text-sm leading-6 text-white/70"><Check size={16} className="mt-1 shrink-0 text-[#1ed760]" strokeWidth={2.5}/><span>{guideline}</span></li>)}</ul></section>{todayRequest && <section className="ios-pop mt-6 flex flex-col gap-4 rounded-2xl border border-[#1ed760]/30 bg-[#1ed760]/10 p-4 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black"><Check size={22} strokeWidth={2.8}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#1ed760]">오늘 신청 완료</p><h2 className="mt-1 truncate font-bold">{todayRequest.name} · {todayRequest.artists}</h2><p className="mt-1 text-xs text-white/55">{formatReset(limitResetsAt)} 다시 신청할 수 있어요.</p></div><StatusBadge status={todayRequest.status}/></section>}{message && <p role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm ${message.includes("전달했어요") ? "bg-[#1ed760]/12 text-[#70e897]" : "bg-red-500/10 text-red-300"}`}>{message}</p>}<section className="mt-8"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-tight">{query.trim().length >= 2 ? "검색 결과" : "Spotify에서 노래 찾기"}</h2><p className="mt-1 text-sm text-[#a7a7a7]">곡명이나 아티스트 이름을 두 글자 이상 입력해 주세요.</p></div>{results.length > 0 && <span className="text-xs text-[#8f8f8f]">{Math.min(visibleCount, results.length)} / {results.length}곡</span>}</div><div className="mt-4">{!user ? <EmptyState icon={<UserRound size={28}/>} title="로그인이 필요해요" description="학교 계정으로 로그인하면 노래를 검색하고 신청할 수 있어요." action={<Link href="/login" className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-bold text-black hover:scale-105">학교 계정으로 로그인</Link>}/> : query.trim().length < 2 ? <EmptyState icon={<Search size={28}/>} title="어떤 노래를 듣고 싶나요?" description="위 검색창에서 곡명 또는 아티스트를 검색해 보세요."/> : searching ? <div className="grid min-h-52 place-items-center"><LoaderCircle className="size-7 animate-spin text-[#1ed760]"/></div> : results.length ? <div className="space-y-1">{results.slice(0, visibleCount).map((track, index) => { const requestedThis = todayRequest?.spotifyTrackId === track.id; return <article key={track.id} className="group grid grid-cols-[2rem_3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/8 sm:grid-cols-[2rem_3.5rem_minmax(0,1fr)_auto_auto]"><span className="text-center text-sm text-[#a7a7a7]">{index + 1}</span><a href={track.spotifyUrl} target="_blank" rel="noreferrer" className="relative size-13 overflow-hidden rounded-md bg-[#282828] sm:size-14" aria-label={`${track.name} Spotify에서 열기`}>{track.albumImageUrl ? <Image src={track.albumImageUrl} alt={`${track.albumName} 앨범 표지`} fill sizes="56px" className="object-cover"/> : <span className="grid size-full place-items-center text-[#777]"><Music2 size={22}/></span>}</a><span className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-sm">{track.name}</strong>{track.explicit && <span className="rounded-sm bg-[#b3b3b3] px-1 text-[9px] font-black text-[#181818]">19</span>}</span><span className="mt-0.5 block truncate text-xs text-[#a7a7a7]">{track.artists} · {track.albumName}</span><a href={track.spotifyUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#1ed760] hover:underline">Spotify <ExternalLink size={10}/></a></span><span className="hidden text-xs text-[#8f8f8f] sm:block">{formatDuration(track.durationMs)}</span><button onClick={() => void requestTrack(track)} disabled={Boolean(todayRequest) || requesting !== ""} aria-label={`${track.name} 신청`} className={`grid size-10 place-items-center rounded-full border disabled:cursor-not-allowed ${requestedThis ? "border-[#1ed760] bg-[#1ed760] text-black" : todayRequest ? "border-white/10 text-white/25" : "border-[#727272] text-[#d7d7d7] hover:scale-105 hover:border-white hover:text-white"}`}>{requesting === track.id ? <LoaderCircle size={17} className="animate-spin"/> : requestedThis ? <Check size={18} strokeWidth={2.8}/> : <Plus size={17}/>}</button></article>; })}{visibleCount < results.length && <div className="pt-5 text-center"><button type="button" onClick={() => setVisibleCount((count) => Math.min(count + SEARCH_PAGE_SIZE, results.length))} className="rounded-full border border-white/20 bg-white/8 px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] hover:border-white/35 hover:bg-white/12">검색 결과 {Math.min(SEARCH_PAGE_SIZE, results.length - visibleCount)}개 더 보기</button></div>}</div> : <EmptyState icon={<Music2 size={28}/>} title="검색 결과가 없어요" description="다른 곡명이나 아티스트 이름으로 검색해 보세요."/>}</div></section><div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-white/35"><span className="size-2.5 rounded-full bg-[#1ed760]"/><span>Music data provided by Spotify</span></div></div></main></div>;
}

function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="grid min-h-52 place-items-center rounded-2xl bg-white/4 p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-full bg-white/6 text-[#777]">{icon}</span><p className="mt-4 text-sm font-bold text-[#d7d7d7]">{title}</p><p className="mt-1 text-xs leading-5 text-[#777]">{description}</p>{action}</div></div>;
}

function StatusBadge({ status }: { status: SongRequestRecord["status"] }) {
  const labels = { pending: "승인 대기", approved: "방송 예정", rejected: "신청 반려", played: "재생 완료" };
  return <span className="inline-flex w-fit rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white/70">{labels[status]}</span>;
}

function formatDuration(durationMs: number) {
  const seconds = Math.floor(durationMs / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatReset(value: string | null) {
  if (!value) return "다음 오전 7시에";
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Seoul" }).format(new Date(value)) + "에";
}
