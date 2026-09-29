"use client";

import Image from "next/image";
import Script from "next/script";
import { Expand, ListMusic, Minimize2, Music2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
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
  const [sdkReady, setSdkReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [current, setCurrent] = useState<SongRequestRecord | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { completedRef.current = onTrackCompleted; }, [onTrackCompleted]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === shellRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const playRequest = useCallback((request: SongRequestRecord) => {
    if (!request.youtubeVideoId || !playerRef.current) return;
    currentRef.current = request;
    setCurrent(request);
    setPosition(0);
    setDuration(0);
    setMessage("");
    playerRef.current.loadVideoById(request.youtubeVideoId);
  }, []);

  const finishCurrent = useCallback(async () => {
    const finished = currentRef.current;
    if (!finished || endingRef.current) return;
    endingRef.current = true;
    const index = queueRef.current.findIndex((item) => item.id === finished.id);
    const next = queueRef.current.slice(index + 1).find((item) => item.youtubeVideoId);
    try {
      if (await completedRef.current(finished.id)) {
        if (next) playRequest(next);
        else { currentRef.current = null; setCurrent(null); setMessage("재생 목록이 끝났어요."); }
      } else setMessage("재생 완료 처리를 하지 못했어요. 다시 시도해 주세요.");
    } finally {
      endingRef.current = false;
    }
  }, [playRequest]);

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
      playerVars: { controls: 1, playsinline: 1, origin: window.location.origin },
      events: {
        onReady: () => setPlayerReady(true),
        onStateChange: ({ data }) => { setPlaying(data === 1); if (data === 0) void finishCurrent(); },
        onError: () => setMessage("이 영상은 재생할 수 없어요. 다른 영상을 선택해 주세요."),
        onAutoplayBlocked: () => setMessage("브라우저가 자동 재생을 막았어요. 영상의 재생 버튼을 눌러 주세요."),
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
    if (!playerReady) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setPosition(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
    }, 500);
    return () => window.clearInterval(timer);
  }, [playerReady]);

  function changeTrack(direction: -1 | 1) {
    const playable = queueRef.current.filter((item) => item.youtubeVideoId);
    const index = playable.findIndex((item) => item.id === currentRef.current?.id);
    const next = playable[index + direction];
    if (next) playRequest(next);
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
      <section ref={shellRef} className={`mb-5 flex flex-col gap-4 overflow-hidden bg-[#141414] p-4 text-white shadow-xl sm:p-6 ${isFullscreen ? "h-screen w-screen" : "rounded-3xl"}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff4545]">YouTube player</p><h2 className="mt-1 truncate text-lg font-bold sm:text-xl">{current?.name ?? "재생 중인 곡이 없어요"}</h2><p className="truncate text-sm text-white/60">{current?.artists ?? "승인된 목록을 재생해 보세요."}</p></div>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "전체화면 닫기" : "전체화면으로 보기"} className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20">{isFullscreen ? <Minimize2 size={18} /> : <Expand size={18} />}</button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className={`aspect-video overflow-hidden rounded-xl bg-black ${isFullscreen ? "h-auto max-h-[65vh] w-full max-w-[min(100%,calc(65vh*16/9))]" : "w-full max-w-5xl"}`} ref={hostRef} aria-label="YouTube 영상 플레이어" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {current?.albumImageUrl ? <Image src={current.albumImageUrl} alt={`${current.albumName} 앨범 표지`} width={48} height={48} className="size-12 rounded-lg object-cover" /> : <span className="grid size-12 place-items-center rounded-lg bg-white/10"><Music2 size={20} /></span>}
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{current?.name ?? "재생 대기"}</p><p className="truncate text-xs text-white/55">{current?.youtubeVideoTitle ?? `${playableCount}곡 준비됨`}</p></div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="이전 곡" onClick={() => changeTrack(-1)} disabled={!current} className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white disabled:opacity-30"><SkipBack size={19} fill="currentColor" /></button>
            <button type="button" aria-label={playing ? "일시정지" : "재생"} onClick={() => playing ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()} disabled={!current} className="grid size-10 place-items-center rounded-full bg-white text-black disabled:opacity-30">{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button type="button" aria-label="다음 곡" onClick={() => changeTrack(1)} disabled={!current} className="grid size-9 place-items-center rounded-full text-white/70 hover:text-white disabled:opacity-30"><SkipForward size={19} fill="currentColor" /></button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/55"><span>{formatTime(position)}</span><input type="range" aria-label="재생 위치" min={0} max={Math.max(duration, 1)} value={Math.min(position, duration || 1)} onChange={(event) => playerRef.current?.seekTo(Number(event.target.value), true)} disabled={!current} className="h-1 flex-1 accent-[#ff4545]" /><span>{formatTime(duration)}</span></div>
        {!isFullscreen && <button type="button" disabled={!playerReady || !playableCount} onClick={() => { const first = queueRef.current.find((item) => item.youtubeVideoId); if (first) playRequest(first); }} className="inline-flex h-10 self-start items-center gap-2 rounded-full bg-[#ff4545] px-4 text-sm font-bold text-white disabled:opacity-40"><ListMusic size={16} />목록 재생</button>}
        {message && <p role="status" className="rounded-xl bg-white/10 px-3 py-2 text-xs text-white/75">{message}</p>}
        {!playableCount && <p className="text-xs text-amber-200">재생하려면 승인된 곡에 YouTube 영상을 선택해 주세요.</p>}
      </section>
    </>
  );
}

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
