"use client";

import { Clock3, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

type QueueStatus = {
  admitted: boolean;
  active?: number;
  position?: number;
  capacity?: number;
  disabled?: boolean;
  error?: string;
};

function safeReturnTo() {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export function WaitingRoom() {
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const response = await fetch("/api/queue", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as QueueStatus;
      if (!response.ok) throw new Error(payload.error);
      if (payload.admitted || payload.disabled) {
        window.location.replace(safeReturnTo());
        return;
      }
      setStatus(payload);
    } catch (error) {
      setStatus({
        admitted: false,
        error:
          error instanceof Error && error.message
            ? error.message
            : "대기열을 확인하지 못했어요.",
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const initialCheck = window.setTimeout(() => void check(), 0);
    const timer = window.setInterval(() => void check(), 5_000);
    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(timer);
    };
  }, [check]);

  const position = status?.position ?? 0;
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f5f7] px-5 py-10">
      <section className="ios-pop w-full max-w-md rounded-[30px] bg-white p-7 text-center shadow-xl sm:p-9">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <span className="mx-auto mt-8 grid size-16 place-items-center rounded-[22px] bg-[#e9f3ff] text-[#007aff]">
          <Users size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          잠시만 기다려 주세요
        </h1>
        <p className="mt-3 break-keep text-sm leading-6 text-[var(--muted)]">
          한 번에 100명이 안정적으로 이용할 수 있도록 순서대로 입장하고 있어요.
        </p>

        {status?.error ? (
          <div className="mt-7 rounded-2xl bg-red-50 px-4 py-4 text-sm leading-6 text-red-600">
            {status.error}
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f5f5f7] px-3 py-4">
              <span className="block text-xs text-[var(--muted)]">
                내 앞 대기
              </span>
              <strong className="mt-1 block text-xl">
                {Math.max(0, position - 1)}명
              </strong>
            </div>
            <div className="rounded-2xl bg-[#f5f5f7] px-3 py-4">
              <span className="block text-xs text-[var(--muted)]">
                현재 이용 중
              </span>
              <strong className="mt-1 block text-xl">
                {status?.active ?? 0}/{status?.capacity ?? 100}명
              </strong>
            </div>
          </div>
        )}

        <div className="mt-7 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
          <Clock3 size={14} />
          <span>
            {checking
              ? "입장 가능 여부를 확인하고 있어요."
              : "5초마다 자동으로 확인해요."}
          </span>
        </div>
        {status?.error && (
          <button
            type="button"
            onClick={() => void check()}
            disabled={checking}
            className="mt-5 h-11 rounded-full bg-[#007aff] px-6 text-sm font-bold text-white disabled:opacity-50"
          >
            다시 확인
          </button>
        )}
      </section>
    </main>
  );
}
