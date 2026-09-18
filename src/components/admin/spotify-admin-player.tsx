"use client";

import Image from "next/image";
import Script from "next/script";
import { Expand, ListMusic, LoaderCircle, Minimize2, Music2, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { didTrackNaturallyComplete, type PlaybackSnapshot } from "@/lib/spotify-playback";
import type { SongRequestRecord } from "@/types/spotify";

type TokenResponse = { accessToken?: string; error?: string };

export function SpotifyAdminPlayer({ queue, onTrackCompleted }: { queue: SongRequestRecord[]; onTrackCompleted: (requestId: string) => Promise<boolean> }) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const queueRef = useRef(queue);
  const onTrackCompletedRef = useRef(onTrackCompleted);
  const previousPlaybackRef = useRef<PlaybackSnapshot | null>(null);
  const completionInFlightRef = useRef(new Set<string>());
  const suppressCompletionUntilRef = useRef(0);
  const playerShellRef = useRef<HTMLElement | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [playback, setPlayback] = useState<Spotify.WebPlaybackState | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { onTrackCompletedRef.current = onTrackCompleted; }, [onTrackCompleted]);

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === playerShellRef.current);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const completeTrack = useCallback(async (uri: string) => {
    const request = queueRef.current.find((item) => item.uri === uri && !completionInFlightRef.current.has(item.id));
    if (!request) return;
    completionInFlightRef.current.add(request.id);
    const completed = await onTrackCompletedRef.current(request.id);
    if (!completed) completionInFlightRef.current.delete(request.id);
  }, []);

  const updatePlayback = useCallback((state: Spotify.WebPlaybackState | null) => {
    setPlayback(state);
    const now = Date.now();
    if (!state) {
      const previous = previousPlaybackRef.current;
      previousPlaybackRef.current = null;
      if (previous) {
        const stopped = { ...previous, position: 0, paused: true, observedAt: now };
        if (didTrackNaturallyComplete(previous, stopped, now, suppressCompletionUntilRef.current)) void completeTrack(previous.uri);
      }
      return;
    }

    const current: PlaybackSnapshot = {
      uri: state.track_window.current_track.uri,
      position: state.position,
      duration: state.duration,
      paused: state.paused,
      observedAt: now,
    };
    const previous = previousPlaybackRef.current;
    previousPlaybackRef.current = current;
    if (previous && didTrackNaturallyComplete(previous, current, now, suppressCompletionUntilRef.current)) void completeTrack(previous.uri);
  }, [completeTrack]);

  const getAccessToken = useCallback(async () => {
    const response = await adminFetch("/api/admin/spotify/token");
    const data = await response.json().catch(() => ({})) as TokenResponse;
    if (!response.ok || !data.accessToken) throw new Error(data.error ?? "Spotify 인증 정보를 가져오지 못했어요.");
    return data.accessToken;
  }, []);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("spotify");
    if (result) {
      const messages: Record<string, string> = {
        connected: "Spotify Premium 계정을 연결했어요.",
        denied: "Spotify 연결이 취소됐어요.",
        "invalid-state": "Spotify 연결 요청을 확인하지 못했어요. 다시 시도해 주세요.",
        "no-refresh-token": "Spotify 재연결 토큰을 받지 못했어요. 다시 연결해 주세요.",
        failed: "Spotify 계정을 연결하지 못했어요.",
      };
      queueMicrotask(() => setMessage(messages[result] ?? ""));
      window.history.replaceState({}, "", window.location.pathname);
    }
    getAccessToken().then(() => setConnected(true)).catch(() => setConnected(false));
  }, [getAccessToken]);

  useEffect(() => {
    if (!connected) return;
    const handleSdkReady = () => setSdkReady(true);
    window.onSpotifyWebPlaybackSDKReady = handleSdkReady;
    if (window.Spotify) handleSdkReady();
    return () => {
      if (window.onSpotifyWebPlaybackSDKReady === handleSdkReady) delete window.onSpotifyWebPlaybackSDKReady;
    };
  }, [connected]);

  useEffect(() => {
    if (!connected || !sdkReady || !window.Spotify) return;
    const player = new window.Spotify.Player({
      name: "DongpyeongON 관리자 플레이어",
      getOAuthToken: (callback) => { getAccessToken().then(callback).catch((error) => { setConnected(false); setMessage(error instanceof Error ? error.message : "Spotify 인증이 만료됐어요."); }); },
      volume: 0.7,
    });
    playerRef.current = player;
    player.addListener("ready", ({ device_id }) => { setDeviceId(device_id); setMessage("Spotify 플레이어가 준비됐어요."); });
    player.addListener("not_ready", () => { setDeviceId(""); setMessage("Spotify 플레이어 연결이 끊어졌어요."); });
    player.addListener("player_state_changed", updatePlayback);
    player.addListener("initialization_error", ({ message: error }) => setMessage(error));
    player.addListener("authentication_error", ({ message: error }) => { setConnected(false); setMessage(error); });
    player.addListener("account_error", () => setMessage("Spotify Premium 계정이 필요해요."));
    player.addListener("playback_error", ({ message: error }) => setMessage(error));
    void player.connect();
    return () => { suppressCompletionUntilRef.current = Date.now() + 3_000; player.disconnect(); playerRef.current = null; setDeviceId(""); };
  }, [connected, getAccessToken, sdkReady, updatePlayback]);

  useEffect(() => {
    if (!deviceId) return;
    const timer = window.setInterval(() => { playerRef.current?.getCurrentState().then(updatePlayback).catch(() => undefined); }, 1000);
    return () => window.clearInterval(timer);
  }, [deviceId, updatePlayback]);

  async function startQueue() {
    if (!deviceId || !queue.length || !playerRef.current) return;
    setBusy(true);
    setMessage("");
    suppressCompletionUntilRef.current = Date.now() + 3_000;
    try {
      await playerRef.current.activateElement();
      const response = await adminFetch("/api/admin/spotify/playback", { method: "PUT", body: JSON.stringify({ deviceId, uris: queue.map((request) => request.uri) }) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "재생을 시작하지 못했어요.");
      setMessage("먼저 신청된 곡부터 재생을 시작했어요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "재생을 시작하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function changeTrack(direction: "previous" | "next") {
    const player = playerRef.current;
    if (!player) return;
    suppressCompletionUntilRef.current = Date.now() + 3_000;
    if (direction === "previous") await player.previousTrack();
    else await player.nextTrack();
  }

  async function seek(positionMs: number) {
    suppressCompletionUntilRef.current = Date.now() + 3_000;
    await playerRef.current?.seek(positionMs);
  }

  async function disconnect() {
    setBusy(true);
    suppressCompletionUntilRef.current = Date.now() + 3_000;
    await adminFetch("/api/admin/spotify/token", { method: "DELETE" }).catch(() => undefined);
    playerRef.current?.disconnect();
    setPlayback(null);
    previousPlaybackRef.current = null;
    completionInFlightRef.current.clear();
    setDeviceId("");
    setConnected(false);
    setBusy(false);
    setMessage("Spotify 계정 연결을 해제했어요.");
  }

  async function toggleFullscreen() {
    const shell = playerShellRef.current;
    if (!shell) return;
    try {
      if (document.fullscreenElement === shell) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch {
      setMessage("이 브라우저에서는 전체화면을 시작할 수 없어요.");
    }
  }

  if (connected === null) return <section className="mb-5 grid min-h-40 place-items-center rounded-3xl bg-[#181818] text-white"><LoaderCircle className="animate-spin text-[#1ed760]"/></section>;

  if (!connected) return <section className="mb-5 overflow-hidden rounded-3xl bg-linear-to-br from-[#252525] to-[#121212] p-6 text-white shadow-xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black"><Play size={24} fill="currentColor"/></span><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">Spotify 플레이어 연결</h2><p className="mt-1 text-sm leading-6 text-white/60">Spotify Premium 계정을 연결하면 이 페이지에서 승인 목록을 직접 재생할 수 있어요.</p>{message && <p className="mt-2 text-xs text-amber-300">{message}</p>}</div><a href="/api/admin/spotify/connect" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black hover:scale-[1.02] hover:bg-[#2be374]">Spotify 연결하기</a></div></section>;

  const spotifySdk = <Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setMessage("Spotify 플레이어 SDK를 불러오지 못했어요.")}/>;

  if (!deviceId) return <>{spotifySdk}<section aria-busy="true" aria-label="Spotify 웹 플레이어 준비 중" className="mb-5 grid min-h-44 place-items-center overflow-hidden rounded-3xl bg-linear-to-br from-[#282828] via-[#1b1b1b] to-[#101010] text-white shadow-xl"><LoaderCircle size={30} className="animate-spin text-[#1ed760]"/><span className="sr-only">Spotify 웹 플레이어를 준비하고 있어요.</span></section></>;

  const track = playback?.track_window.current_track;
  const position = playback?.position ?? 0;
  const duration = playback?.duration ?? 0;
  const trackId = track?.uri.split(":")[2];
  const videoEmbedUrl = trackId
    ? `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator&theme=0&autoplay=1`
    : "";

  return (
    <>
      {spotifySdk}
      <section
        ref={playerShellRef}
        className={`relative mb-5 overflow-hidden bg-linear-to-br from-[#282828] via-[#1b1b1b] to-[#101010] text-white shadow-xl ${isFullscreen ? "h-screen w-screen" : "rounded-3xl p-5 sm:p-6"}`}
      >
        {isFullscreen && (
          <>
            {track?.album.images[0]?.url && (
              <Image
                src={track.album.images[0].url}
                alt=""
                fill
                priority
                sizes="100vw"
                className="scale-110 object-cover opacity-55 blur-2xl"
              />
            )}
            {videoEmbedUrl && (
              <iframe
                key={videoEmbedUrl}
                src={videoEmbedUrl}
                title={`${track?.name ?? "현재 곡"} Spotify 뮤직비디오`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="eager"
                className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-105 border-0 opacity-80"
              />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.22)_0%,rgba(0,0,0,.12)_38%,rgba(0,0,0,.88)_100%)]" />
          </>
        )}

        <div className={isFullscreen ? "absolute inset-0 z-10 flex flex-col justify-end p-7 sm:p-12 lg:p-16" : "relative z-10"}>
          <div className={isFullscreen ? "mx-auto flex w-full max-w-7xl flex-col gap-8" : "flex flex-col gap-5 lg:flex-row lg:items-center"}>
            <div className={`flex min-w-0 flex-1 items-center ${isFullscreen ? "gap-6" : "gap-4"}`}>
              {track?.album.images[0]?.url ? (
                <Image
                  src={track.album.images[0].url}
                  alt={`${track.album.name} 앨범 표지`}
                  width={isFullscreen ? 152 : 80}
                  height={isFullscreen ? 152 : 80}
                  className={`${isFullscreen ? "size-28 rounded-3xl sm:size-38" : "size-20 rounded-2xl"} shrink-0 object-cover shadow-2xl`}
                />
              ) : (
                <span className={`${isFullscreen ? "size-28 rounded-3xl sm:size-38" : "size-20 rounded-2xl"} grid shrink-0 place-items-center bg-white/8 text-white/40`}>
                  <Music2 size={isFullscreen ? 48 : 29} />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#1ed760]">
                  Now playing
                </p>
                <h2 className={`${isFullscreen ? "mt-2 text-3xl sm:text-5xl lg:text-6xl" : "mt-1 text-xl"} truncate font-bold tracking-tight`}>
                  {track?.name ?? "재생 중인 곡이 없어요"}
                </h2>
                <p className={`${isFullscreen ? "mt-3 text-lg text-white/72 sm:text-2xl" : "mt-1 text-sm text-white/55"} truncate`}>
                  {track?.artists.map((artist) => artist.name).join(", ") ?? "승인 목록을 재생해 보세요."}
                </p>
                {isFullscreen && track?.album.name && (
                  <p className="mt-2 truncate text-sm text-white/45 sm:text-base">{track.album.name}</p>
                )}
              </div>
            </div>

            <div className={isFullscreen ? "flex flex-col gap-5" : "flex flex-col items-center gap-3"}>
              <div className={`flex items-center ${isFullscreen ? "justify-center gap-6" : "gap-3"}`}>
                <button type="button" aria-label="이전 곡" onClick={() => void changeTrack("previous")} className={`${isFullscreen ? "size-12" : "size-9"} grid place-items-center rounded-full text-white/65 hover:text-white`}>
                  <SkipBack size={isFullscreen ? 28 : 20} fill="currentColor" />
                </button>
                <button type="button" aria-label={playback?.paused === false ? "일시정지" : "재생"} onClick={() => void playerRef.current?.togglePlay()} className={`${isFullscreen ? "size-16" : "size-12"} grid place-items-center rounded-full bg-white text-black shadow-xl hover:scale-105`}>
                  {playback?.paused === false ? <Pause size={isFullscreen ? 27 : 20} fill="currentColor" /> : <Play size={isFullscreen ? 27 : 20} fill="currentColor" className="ml-0.5" />}
                </button>
                <button type="button" aria-label="다음 곡" onClick={() => void changeTrack("next")} className={`${isFullscreen ? "size-12" : "size-9"} grid place-items-center rounded-full text-white/65 hover:text-white`}>
                  <SkipForward size={isFullscreen ? 28 : 20} fill="currentColor" />
                </button>
              </div>
              <div className={`${isFullscreen ? "w-full text-sm" : "w-full min-w-64 text-[10px]"} flex items-center gap-3 text-white/55`}>
                <span>{formatDuration(position)}</span>
                <input aria-label="재생 위치" type="range" min={0} max={Math.max(duration, 1)} value={Math.min(position, duration || 1)} onChange={(event) => void seek(Number(event.target.value))} className="h-1 flex-1 accent-white" />
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {!isFullscreen && (
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <label className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2">
                  <Volume2 size={15} className="text-white/55" />
                  <input aria-label="음량" type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); void playerRef.current?.setVolume(next); }} className="w-20 accent-[#1ed760]" />
                </label>
                <button type="button" disabled={!queue.length || busy} onClick={() => void startQueue()} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1ed760] px-4 text-sm font-bold text-black hover:scale-[1.02] disabled:opacity-40">
                  {busy ? <LoaderCircle size={16} className="animate-spin" /> : <ListMusic size={16} />}
                  목록 재생
                </button>
                <button type="button" onClick={() => void toggleFullscreen()} className="grid size-10 place-items-center rounded-full bg-white/8 text-white/65 hover:bg-white/12 hover:text-white" aria-label="전체화면으로 보기">
                  <Expand size={17} />
                </button>
                <button type="button" disabled={busy} onClick={() => void disconnect()} className="grid size-10 place-items-center rounded-full bg-white/8 text-white/55 hover:bg-white/12 hover:text-white" aria-label="Spotify 연결 해제">
                  <RotateCcw size={16} />
                </button>
              </div>
            )}
          </div>

          {message && !isFullscreen && <p role="status" className="mt-4 rounded-xl bg-white/6 px-3 py-2 text-xs text-white/65">{message}</p>}
        </div>

        {isFullscreen && (
          <>
            <button type="button" onClick={() => void toggleFullscreen()} className="absolute right-6 top-6 z-20 grid size-12 place-items-center rounded-full bg-black/35 text-white backdrop-blur-xl hover:bg-black/55" aria-label="전체화면 닫기">
              <Minimize2 size={21} />
            </button>
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 text-[#171719] shadow-2xl backdrop-blur-xl sm:bottom-10 sm:right-10">
              <span className="text-xs font-semibold tracking-tight sm:text-sm">Powered by. DPS Team</span>
              <Image src="https://assets.dpsteam.kr/brend/D-Black.png" alt="DPS Team" width={84} height={32} className="h-6 w-auto object-contain" />
            </div>
          </>
        )}
      </section>
    </>
  );
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
