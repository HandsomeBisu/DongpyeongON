"use client";

import Image from "next/image";
import Script from "next/script";
import { Expand, ListMusic, Minimize2, Music2, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SongRequestRecord } from "@/types/spotify";
import type { YouTubePlayer } from "@/types/youtube-iframe";

export function YouTubeAdminPlayer({ queue, onTrackCompleted }: { queue: SongRequestRecord[]; onTrackCompleted: (requestId: string) => Promise<boolean> }) {
  const shellRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const queueRef = useRef(queue);
  const completedRef = useRef(onTrackCompleted);
  const currentRef = useRef<SongRequestRecord | null>(null);
  const endingRef = useRef(false);
  const intermissionTimerRef = useRef<number | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [current, setCurrent] = useState<SongRequestRecord | null>(null);
  const [upNext, setUpNext] = useState<SongRequestRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { completedRef.current = onTrackCompleted; }, [onTrackCompleted]);
  useEffect(() => () => {
    if (intermissionTimerRef.current !== null) window.clearTimeout(intermissionTimerRef.current);
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const playRequest = useCallback((request: SongRequestRecord) => {
    if (!request.youtubeVideoId || !playerRef.current) return;
    if (intermissionTimerRef.current !== null) window.clearTimeout(intermissionTimerRef.current);
    intermissionTimerRef.current = null;
    currentRef.current = request;
    setCurrent(request);
    setUpNext(null);
    setPosition(0);
    setDuration(0);
    setMessage("");
    playerRef.current.loadVideoById(request.youtubeVideoId);
  }, []);

  const announceNext = useCallback((next: SongRequestRecord) => {
    if (intermissionTimerRef.current !== null) window.clearTimeout(intermissionTimerRef.current);
    playerRef.current?.pauseVideo();
    currentRef.current = null;
    setCurrent(null);
    setPlaying(false);
    setPosition(0);
    setDuration(0);
    setUpNext(next);
    intermissionTimerRef.current = window.setTimeout(() => {
      intermissionTimerRef.current = null;
      const queued = queueRef.current.find((item) => item.id === next.id && item.youtubeVideoId);
      if (queued) playRequest(queued);
      else { setUpNext(null); setMessage("다음 곡을 재생 목록에서 찾을 수 없어요."); }
    }, 5_000);
  }, [playRequest]);

  const finishCurrent = useCallback(async () => {
    const finished = currentRef.current;
    if (!finished || endingRef.current) return;
    endingRef.current = true;
    const index = queueRef.current.findIndex((item) => item.id === finished.id);
    const next = queueRef.current.slice(index + 1).find((item) => item.youtubeVideoId);
    try {
      if (await completedRef.current(finished.id)) {
        if (currentRef.current?.id !== finished.id) return;
        if (next) announceNext(next);
        else { currentRef.current = null; setCurrent(null); setMessage("재생 목록이 끝났어요."); }
      } else setMessage("재생 완료 처리를 하지 못했어요. 다시 시도해 주세요.");
    } finally {
      endingRef.current = false;
    }
  }, [announceNext]);

  useEffect(() => {
    const onReady = () => setSdkReady(true);
    window.onYouTubeIframeAPIReady = onReady;
    if (window.YT?.Player) onReady();
    return () => { if (window.onYouTubeIframeAPIReady === onReady) delete window.onYouTubeIframeAPIReady; };
  }, []);

  useEffect(() => {
    if (!sdkReady || !window.YT?.Player || !hostRef.current) return;
    const mount = document.createElement("div");
    hostRef.current.appendChild(mount);
    const player = new window.YT.Player(mount, {
      width: "100%",
      height: "100%",
      playerVars: { controls: 0, disablekb: 1, playsinline: 1, origin: window.location.origin },
      events: {
        onReady: () => {
          hostRef.current?.querySelector("iframe")?.setAttribute("tabindex", "-1");
          setPlayerReady(true);
        },
        onStateChange: ({ data }) => { setPlaying(data === 1); if (data === 0) void finishCurrent(); },
        onError: () => setMessage("이 영상은 재생할 수 없어요. 다른 영상을 선택해 주세요."),
        onAutoplayBlocked: () => setMessage("브라우저가 자동 재생을 막았어요. 아래 재생 버튼을 눌러 주세요."),
      },
    });
    playerRef.current = player;
    return () => {
      playerRef.current = null;
      player.destroy();
      if (mount.parentNode) mount.remove();
      setPlayerReady(false);
    };
  }, [sdkReady, finishCurrent]);

  useEffect(() => {
    if (!playerReady || upNext) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setPosition(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
    }, 500);
    return () => window.clearInterval(timer);
  }, [playerReady, upNext]);

  function changeTrack(direction: -1 | 1) {
    const playable = queueRef.current.filter((item) => item.youtubeVideoId);
    const index = playable.findIndex((item) => item.id === currentRef.current?.id);
    const next = playable[index + direction];
    if (next) {
      if (direction === 1) announceNext(next);
      else playRequest(next);
    }
  }

  async function toggleFullscreen() {
    if (!shellRef.current) return;
    try {
      if (document.fullscreenElement === shellRef.current) await document.exitFullscreen();
      else await shellRef.current.requestFullscreen();
    } catch { setMessage("이 브라우저에서는 전체화면을 시작할 수 없어요."); }
  }

  const playableCount = queue.filter((item) => item.youtubeVideoId).length;

  return (
    <>
      <Script src="https://www.youtube.com/iframe_api" strategy="afterInteractive" onReady={() => { if (window.YT?.Player) setSdkReady(true); }} onError={() => setMessage("YouTube 플레이어를 불러오지 못했어요.")} />
      <section ref={shellRef} className={`flex flex-col overflow-hidden bg-[#141414] text-white shadow-xl ${isFullscreen ? "relative h-dvh w-screen" : "mb-5 gap-3 rounded-3xl p-3 sm:p-4"}`}>
        <div className={`flex items-center justify-between gap-3 ${isFullscreen ? "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/85 via-black/50 to-transparent px-4 pb-10 pt-4 sm:px-6" : ""}`}>
          <div className="min-w-0"><h2 className="truncate text-lg font-bold sm:text-xl">{upNext ? "잠시 후 다음 곡" : current?.name ?? "재생 중인 곡이 없어요"}</h2><p className="truncate text-sm text-white/60">{upNext ? `${upNext.name} · ${upNext.artists}` : current?.artists ?? "승인된 목록을 재생해 보세요."}</p></div>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "전체화면 닫기" : "전체화면으로 보기"} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">{isFullscreen ? <Minimize2 size={18} /> : <Expand size={18} />}</button>
        </div>
        <div className={`flex min-h-0 items-center justify-center ${isFullscreen ? "absolute inset-0" : "flex-1"}`}>
          <div className={`relative aspect-video overflow-hidden bg-black ${isFullscreen ? "w-full max-w-[min(100vw,177.778dvh)]" : "w-full max-w-[1600px] rounded-xl"}`} aria-label="YouTube 영상 플레이어">
            <div ref={hostRef} className="pointer-events-none absolute inset-0" />
            <div aria-hidden="true" className="absolute inset-0 z-10 bg-transparent" />
            {upNext && (
              <div className="absolute inset-0 z-20 flex items-center justify-center gap-3 bg-[#101820] p-3 text-white sm:gap-6 sm:p-6">
                <div className="min-w-0 max-w-xl flex-1">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#64d2ff] sm:text-sm">DONGPYEONGON</p>
                  <p className="mt-2 break-keep text-lg font-bold leading-tight sm:mt-4 sm:text-3xl lg:text-5xl">신청곡은 DongpyeongON 사이트에서 신청할 수 있어요.</p>
                  <p className="mt-2 text-xs text-white/65 sm:mt-5 sm:text-base">QR코드를 스캔해 신청곡 페이지로 이동하세요.</p>
                  <p className="mt-2 break-all text-[10px] text-[#64d2ff] sm:text-sm">dpon.dpsteam.kr/music</p>
                  <p className="mt-3 text-xs text-white/50 sm:mt-6 sm:text-sm">5초 후 다음 곡이 재생됩니다.</p>
                </div>
                <Image src="/music-request-qr.svg" alt="DongpyeongON 신청곡 페이지 QR코드" width={440} height={440} unoptimized className="size-28 shrink-0 rounded-lg bg-white p-1 sm:size-48 sm:p-2 lg:size-72 xl:size-80" />
              </div>
            )}
          </div>
        </div>
        <div className={isFullscreen ? "absolute inset-x-0 bottom-0 z-30 flex flex-col gap-3 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-4 pt-14 sm:px-6" : "flex flex-col gap-3"}>
        <div className="flex flex-wrap items-center gap-3">
          {current?.albumImageUrl ? <Image src={current.albumImageUrl} alt={`${current.albumName} 앨범 표지`} width={48} height={48} className="size-12 rounded-lg object-cover" /> : <span className="grid size-12 place-items-center rounded-lg bg-white/10"><Music2 size={20} /></span>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{current?.name ?? "재생 대기"}</p><p className="truncate text-xs text-white/55">{current?.youtubeVideoTitle ?? `${playableCount}곡 준비됨`}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="이전 곡" onClick={() => changeTrack(-1)} disabled={!current} className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white disabled:opacity-30"><SkipBack size={19} fill="currentColor" /></button>
            <button type="button" aria-label={playing ? "일시정지" : "재생"} onClick={() => playing ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()} disabled={!current} className="grid size-10 place-items-center rounded-full bg-white text-black disabled:opacity-30">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button type="button" aria-label="다음 곡" onClick={() => changeTrack(1)} disabled={!current} className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white disabled:opacity-30"><SkipForward size={19} fill="currentColor" /></button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/55"><span>{formatTime(position)}</span><input type="range" aria-label="재생 위치" min={0} max={Math.max(duration, 1)} value={Math.min(position, duration || 1)} onChange={(event) => playerRef.current?.seekTo(Number(event.target.value), true)} disabled={!current} className="h-1 flex-1 accent-[#64d2ff]" /><span>{formatTime(duration)}</span></div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex w-40 items-center gap-2 text-white/65"><Volume2 size={17} /><input type="range" aria-label="음량" min={0} max={100} value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); playerRef.current?.setVolume(next); }} disabled={!playerReady} className="h-1 flex-1 accent-[#64d2ff]" /></label>
            {!isFullscreen && <button type="button" disabled={!playerReady || !playableCount} onClick={() => { const first = queueRef.current.find((item) => item.youtubeVideoId); if (first) playRequest(first); }} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#64d2ff] px-4 text-sm font-bold text-[#101820] disabled:opacity-40"><ListMusic size={16} />목록 재생</button>}
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-[#171719] shadow-lg"><span className="text-xs font-semibold tracking-tight">Powered by. DPS Team</span><Image src="https://assets.dpsteam.kr/brend/D-Black.png" alt="DPS Team" width={84} height={32} className="h-5 w-auto object-contain" /></div>
        </div>
        {message && <p role="status" className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/75">{message}</p>}
        {!playableCount && <p className="text-xs text-amber-200">재생하려면 승인된 곡에 YouTube 영상을 선택해 주세요.</p>}
        </div>
      </section>
    </>
  );
}

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
