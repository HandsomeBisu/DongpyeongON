"use client";

import Image from "next/image";
import Script from "next/script";
import { ListMusic, LoaderCircle, Music2, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2 } from "lucide-react";
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
  const [connected, setConnected] = useState<boolean | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [playback, setPlayback] = useState<Spotify.WebPlaybackState | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { onTrackCompletedRef.current = onTrackCompleted; }, [onTrackCompleted]);

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
      setMessage("최신 신청곡부터 재생을 시작했어요.");
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

  if (connected === null) return <section className="mb-5 grid min-h-40 place-items-center rounded-3xl bg-[#181818] text-white"><LoaderCircle className="animate-spin text-[#1ed760]"/></section>;

  if (!connected) return <section className="mb-5 overflow-hidden rounded-3xl bg-linear-to-br from-[#252525] to-[#121212] p-6 text-white shadow-xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#1ed760] text-black"><Play size={24} fill="currentColor"/></span><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">Spotify 플레이어 연결</h2><p className="mt-1 text-sm leading-6 text-white/60">Spotify Premium 계정을 연결하면 이 페이지에서 승인 목록을 직접 재생할 수 있어요.</p>{message && <p className="mt-2 text-xs text-amber-300">{message}</p>}</div><a href="/api/admin/spotify/connect" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#1ed760] px-5 text-sm font-bold text-black hover:scale-[1.02] hover:bg-[#2be374]">Spotify 연결하기</a></div></section>;

  const track = playback?.track_window.current_track;
  const position = playback?.position ?? 0;
  const duration = playback?.duration ?? 0;

  return <><Script src="https://sdk.scdn.co/spotify-player.js" strategy="afterInteractive" onReady={() => setSdkReady(true)} onError={() => setMessage("Spotify 플레이어 SDK를 불러오지 못했어요.")}/><section className="mb-5 overflow-hidden rounded-3xl bg-linear-to-br from-[#282828] via-[#1b1b1b] to-[#101010] p-5 text-white shadow-xl sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-4">{track?.album.images[0]?.url ? <Image src={track.album.images[0].url} alt={`${track.album.name} 앨범 표지`} width={80} height={80} className="size-20 shrink-0 rounded-2xl object-cover shadow-lg"/> : <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white/8 text-white/40"><Music2 size={29}/></span>}<div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.12em] text-[#1ed760]">{deviceId ? "Web player ready" : "Connecting player"}</p><h2 className="mt-1 truncate text-xl font-bold">{track?.name ?? "재생 중인 곡이 없어요"}</h2><p className="mt-1 truncate text-sm text-white/55">{track?.artists.map((artist) => artist.name).join(", ") ?? "승인 목록을 재생해 보세요."}</p></div></div><div className="flex flex-col items-center gap-3"><div className="flex items-center gap-3"><button type="button" aria-label="이전 곡" disabled={!deviceId} onClick={() => void changeTrack("previous")} className="grid size-9 place-items-center rounded-full text-white/65 hover:text-white disabled:opacity-30"><SkipBack size={20} fill="currentColor"/></button><button type="button" aria-label={playback?.paused === false ? "일시정지" : "재생"} disabled={!deviceId} onClick={() => void playerRef.current?.togglePlay()} className="grid size-12 place-items-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-40">{playback?.paused === false ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-0.5"/>}</button><button type="button" aria-label="다음 곡" disabled={!deviceId} onClick={() => void changeTrack("next")} className="grid size-9 place-items-center rounded-full text-white/65 hover:text-white disabled:opacity-30"><SkipForward size={20} fill="currentColor"/></button></div><div className="flex w-full min-w-64 items-center gap-2 text-[10px] text-white/45"><span>{formatDuration(position)}</span><input aria-label="재생 위치" type="range" min={0} max={Math.max(duration, 1)} value={Math.min(position, duration || 1)} onChange={(event) => void seek(Number(event.target.value))} className="h-1 flex-1 accent-white"/><span>{formatDuration(duration)}</span></div></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><label className="flex items-center gap-2 rounded-full bg-white/8 px-3 py-2"><Volume2 size={15} className="text-white/55"/><input aria-label="음량" type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); void playerRef.current?.setVolume(next); }} className="w-20 accent-[#1ed760]"/></label><button type="button" disabled={!deviceId || !queue.length || busy} onClick={() => void startQueue()} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1ed760] px-4 text-sm font-bold text-black hover:scale-[1.02] disabled:opacity-40">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <ListMusic size={16}/>}목록 재생</button><button type="button" disabled={busy} onClick={() => void disconnect()} className="grid size-10 place-items-center rounded-full bg-white/8 text-white/55 hover:bg-white/12 hover:text-white" aria-label="Spotify 연결 해제"><RotateCcw size={16}/></button></div></div>{message && <p role="status" className="mt-4 rounded-xl bg-white/6 px-3 py-2 text-xs text-white/65">{message}</p>}</section></>;
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.floor(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
