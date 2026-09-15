"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  Bell,
  CheckCircle2,
  Heart,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  createdAt: string | null;
};

const iconByType = {
  student_council_announcement: Megaphone,
  site_announcement: Megaphone,
  post_comment: MessageCircle,
  post_like: Heart,
  report_received: ShieldAlert,
  report_resolved: CheckCircle2,
} as const;

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const response = await authenticatedFetch(user, "/api/notifications");
      const result = (await response.json().catch(() => ({}))) as {
        notifications?: NotificationItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setItems(result.notifications ?? []);
    } catch {
      setError("알림을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [load, open]);
  useEffect(() => {
    if (!user) {
      const timer = window.setTimeout(() => setItems([]), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load, user]);

  async function clearAll() {
    if (!user || !items.length) return;
    setClearing(true);
    setError("");
    try {
      const response = await authenticatedFetch(user, "/api/notifications", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      setItems([]);
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      setOpen(false);
    } catch {
      setClearing(false);
      setError("알림을 지우지 못했어요.");
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="알림 센터 열기"
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          void load();
        }}
        className="relative grid size-9 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:scale-105 hover:bg-white hover:shadow-sm sm:size-10"
      >
        <Bell size={19} />
        {items.length > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#ff3b30] ring-2 ring-white" />
        )}
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[120]">
            <button
              type="button"
              aria-label="알림 센터 닫기"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default bg-black/25 backdrop-blur-[2px]"
            />
            <aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-title"
              className="notification-drawer absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-[#f7f7f9] shadow-[-16px_0_50px_rgba(0,0,0,.13)]"
            >
              <div className="flex items-center justify-between border-b border-black/8 bg-white/80 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
                <div>
                  <p className="text-xs font-bold text-[#007aff]">DONGPYEONGON</p>
                  <h2 id="notification-title" className="mt-1 text-2xl font-bold">
                    알림 센터
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={() => setOpen(false)}
                  className="grid size-10 place-items-center rounded-full bg-[#e9e9ed] text-[var(--muted)]"
                >
                  <X size={19} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                {!user ? (
                  <Empty text="로그인하면 내 소식과 처리 결과를 확인할 수 있어요." />
                ) : loading ? (
                  <Empty text="새로운 알림을 확인하고 있어요." />
                ) : error ? (
                  <Empty text={error} />
                ) : !items.length ? (
                  <Empty text="새로운 알림이 없어요." />
                ) : (
                  <div className="space-y-2.5">
                    {items.map((item, index) => {
                      const Icon =
                        iconByType[item.type as keyof typeof iconByType] ?? Bell;
                      const content = (
                        <>
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e9f3ff] text-[#007aff]">
                            <Icon size={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block break-keep text-sm leading-5">
                              {item.title}
                            </strong>
                            {item.body && (
                              <span className="mt-1 block break-keep text-xs leading-5 text-[var(--muted)]">
                                {item.body}
                              </span>
                            )}
                            <time className="mt-1.5 block text-[11px] text-[#8e8e93]">
                              {formatDate(item.createdAt)}
                            </time>
                          </span>
                        </>
                      );
                      const className = `notification-item flex gap-3 rounded-[20px] border border-black/[.06] bg-white p-4 text-left shadow-sm ${clearing ? "notification-item-clearing" : ""}`;
                      const style = { animationDelay: `${index * 35}ms` };
                      return item.href ? (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={className}
                          style={style}
                        >
                          {content}
                        </Link>
                      ) : (
                        <div key={item.id} className={className} style={style}>
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-black/8 bg-white/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
                <button
                  type="button"
                  disabled={!user || !items.length || clearing}
                  onClick={() => void clearAll()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#e9e9ed] text-sm font-bold text-[#ff3b30] disabled:text-[#aeaeb2]"
                >
                  <Trash2 size={17} />
                  {clearing ? "알림을 정리하는 중..." : "모두 지우기"}
                </button>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-[24px] border border-black/[.05] bg-white px-8 text-center text-sm leading-6 text-[var(--muted)] shadow-sm">
      {text}
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "방금 전";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
