"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, Headphones, ListMusic, Music2, Pause, Play, Plus, Radio, Search, SkipForward, Sparkles, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

const tracks = [
  { id: "demo-1", title: "오늘을 여는 노래", artist: "동평ON 추천", color: "from-[#1ed760] to-[#087c36]", duration: "3:24" },
  { id: "demo-2", title: "점심시간의 설렘", artist: "이번 주 인기곡", color: "from-[#af52de] to-[#5e5ce6]", duration: "2:58" },
  { id: "demo-3", title: "친구와 함께", artist: "학생회 플레이리스트", color: "from-[#ff9f0a] to-[#ff375f]", duration: "3:41" },
  { id: "demo-4", title: "하교 전 한 곡", artist: "동평 방송부", color: "from-[#0a84ff] to-[#64d2ff]", duration: "3:12" },
];

export function MusicDiscovery() {
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<typeof tracks>([]);
  const [playing, setPlaying] = useState(false);
  const results = useMemo(() => query.trim() ? tracks.filter((track) => `${track.title} ${track.artist}`.includes(query.trim())) : tracks, [query]);

  function addToQueue(track: (typeof tracks)[number]) {
    setQueue((items) => items.some((item) => item.id === track.id) ? items : [...items, track]);
  }

  return <div className="min-h-screen bg-black p-2 text-white sm:p-3">
    <div className="grid min-h-[calc(100vh-1.5rem)] gap-2 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden flex-col rounded-[14px] bg-[#121212] p-4 lg:flex">
        <div className="flex items-center gap-3 px-2 py-2"><span className="grid size-10 place-items-center rounded-xl bg-[#1ed760] text-black shadow-[0_8px_24px_rgba(30,215,96,.2)]"><Music2 size={21}/></span><span><strong className="block text-sm tracking-tight">Lunch Music</strong><span className="mt-0.5 block text-[11px] text-[#8f8f8f]">점심시간 신청곡</span></span></div>
        <div className="mt-8 border-t border-white/10 pt-6"><div className="flex items-center gap-3 px-3 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-md bg-linear-to-br from-[#1ed760] to-[#087c36]"><ListMusic size={18}/></span>내 신청 목록</div><p className="mt-4 px-3 text-xs leading-5 text-[#8f8f8f]">신청한 노래와 방송 상태를 이곳에서 확인할 수 있어요.</p></div>
        <div className="mt-auto rounded-xl bg-[#242424] p-4"><div className="flex items-center gap-2 text-sm font-bold"><Radio size={17} className="text-[#1ed760]"/>방송 준비 중</div><p className="mt-2 text-xs leading-5 text-[#a7a7a7]">Spotify 연결 후 점심시간 자동 재생이 활성화됩니다.</p></div>
      </aside>

      <main className="min-w-0 overflow-hidden rounded-[14px] bg-linear-to-b from-[#282828] via-[#151515] to-[#121212]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-[#121212]/75 px-4 backdrop-blur-2xl sm:px-6"><Link href="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-2.5 text-xs font-bold text-white transition hover:scale-[1.02] hover:border-white/30 hover:bg-white/12 sm:px-4"><span className="hidden sm:inline">DongpyeongON으로 돌아가기</span><span className="sm:hidden">돌아가기</span><ArrowUpRight size={15}/></Link><label className="flex h-11 min-w-0 max-w-xl flex-1 items-center gap-3 rounded-full bg-white px-4 text-black shadow-lg"><Search size={20}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="노래 또는 아티스트 검색" className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-[#6a6a6a]"/></label><Link href="/login" className="ml-auto hidden rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition hover:scale-105 md:block">학교 계정으로 로그인</Link><button aria-label="프로필" className="hidden size-9 place-items-center rounded-full bg-[#2a2a2a] sm:grid"><UserRound size={18}/></button></header>

        <div className="px-4 pb-32 sm:px-6">
          <section className="page-enter relative mt-4 overflow-hidden rounded-2xl bg-linear-to-br from-[#1db954] via-[#178544] to-[#123d2c] p-6 sm:p-8"><div className="absolute -right-16 -top-20 size-64 rounded-full bg-[#1ed760]/25 blur-3xl"/><div className="relative max-w-xl"><span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.16em] text-white/70"><Sparkles size={14}/>Dongpyeong lunch music</span><h1 className="mt-4 text-3xl font-black tracking-[-.04em] sm:text-5xl">점심시간을 채울<br/>오늘의 한 곡.</h1><p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">듣고 싶은 노래를 찾아 신청하면 방송부가 확인한 뒤 점심 플레이리스트에 담아요.</p></div></section>

          <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_330px]">
            <section><div className="flex items-end justify-between"><div><h2 className="text-2xl font-bold tracking-tight">{query ? "검색 결과" : "오늘의 추천곡"}</h2><p className="mt-1 text-sm text-[#a7a7a7]">미리 구성한 디자인용 곡 목록입니다.</p></div><span className="text-xs text-[#8f8f8f]">{results.length}곡</span></div><div className="mt-4 space-y-1">{results.map((track,index) => <div key={track.id} className="group grid grid-cols-[2rem_3.25rem_1fr_auto_auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/8"><span className="text-center text-sm text-[#a7a7a7] group-hover:hidden">{index + 1}</span><Play size={17} className="mx-auto hidden group-hover:block" fill="currentColor"/><span className={`grid size-13 place-items-center rounded-md bg-linear-to-br ${track.color}`}><Music2 size={23}/></span><span className="min-w-0"><strong className="block truncate text-sm">{track.title}</strong><span className="block truncate text-xs text-[#a7a7a7]">{track.artist}</span></span><span className="hidden text-xs text-[#8f8f8f] sm:block">{track.duration}</span><button onClick={() => addToQueue(track)} aria-label={`${track.title} 신청`} className="grid size-9 place-items-center rounded-full border border-[#727272] text-[#d7d7d7] hover:scale-105 hover:border-white hover:text-white"><Plus size={17}/></button></div>)}{results.length === 0 && <div className="rounded-xl bg-white/5 p-12 text-center text-sm text-[#a7a7a7]">검색 결과가 없어요.</div>}</div></section>

            <aside className="h-fit rounded-2xl bg-[#181818] p-5 shadow-2xl"><div className="flex items-center gap-2"><ListMusic size={20} className="text-[#1ed760]"/><h2 className="font-bold">신청 대기열</h2><span className="ml-auto rounded-full bg-white/8 px-2.5 py-1 text-xs text-[#b3b3b3]">{queue.length}곡</span></div>{queue.length ? <div className="mt-4 space-y-2">{queue.map((track,index) => <div key={track.id} className="flex items-center gap-3 rounded-lg bg-white/5 p-2"><span className="text-xs text-[#777]">{index+1}</span><span className={`size-9 rounded bg-linear-to-br ${track.color}`}/><span className="min-w-0"><strong className="block truncate text-xs">{track.title}</strong><span className="text-[11px] text-[#929292]">승인 대기</span></span></div>)}</div> : <div className="grid min-h-40 place-items-center text-center"><div><Headphones size={30} className="mx-auto text-[#555]"/><p className="mt-3 text-sm font-medium text-[#b3b3b3]">아직 신청한 곡이 없어요</p><p className="mt-1 text-xs text-[#777]">+ 버튼을 눌러 곡을 담아보세요.</p></div></div>}<div className="mt-5 border-t border-white/10 pt-4"><div className="flex items-center gap-2 text-xs text-[#8f8f8f]"><Clock3 size={14}/>점심 방송까지 준비 중</div><div className="mt-4 flex items-center justify-center gap-5"><button onClick={() => setPlaying(!playing)} className="grid size-12 place-items-center rounded-full bg-white text-black hover:scale-105">{playing ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor" className="ml-0.5"/>}</button><button aria-label="다음 곡" className="text-[#b3b3b3] hover:text-white"><SkipForward size={21} fill="currentColor"/></button></div></div></aside>
          </div>
        </div>
      </main>
    </div>

  </div>;
}
