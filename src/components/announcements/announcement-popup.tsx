"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MarkdownContent } from "@/components/community/markdown-content";
import { fetchAnnouncements, type SiteAnnouncement } from "@/lib/announcements";

export function AnnouncementPopup() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(
    null,
  );

  useEffect(() => {
    fetchAnnouncements()
      .then((items) => {
        const item = items.find((entry) => entry.showPopup);
        if (
          item &&
          sessionStorage.getItem(`dpon:announcement:${item.id}`) !== "seen"
        )
          if (pathname !== `/announcement/${item.id}`) setAnnouncement(item);
      })
      .catch(() => undefined);
  }, [pathname]);

  function close() {
    if (announcement)
      sessionStorage.setItem(`dpon:announcement:${announcement.id}`, "seen");
    setAnnouncement(null);
  }

  if (!announcement) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-announcement-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section className="ios-pop w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff3df] text-[#ff9500]">
            <Megaphone size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#ff9500]">전체 공지</p>
            <h2
              id="site-announcement-title"
              className="mt-1 break-words text-xl font-bold tracking-tight"
            >
              {announcement.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="공지 닫기"
            onClick={close}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)] hover:bg-[#e8e8ed]"
          >
            <X size={18} />
          </button>
        </div>
        <MarkdownContent
          content={announcement.content}
          className="mt-6 max-h-[45dvh] overflow-y-auto text-sm text-[#3a3a3c]"
        />
        <div className="mt-7 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={close}
            className="h-12 rounded-full bg-[#f2f2f7] text-sm font-semibold"
          >
            닫기
          </button>
          <Link
            href={`/announcement/${announcement.id}`}
            onClick={close}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#007aff] text-sm font-bold text-white"
          >
            자세히 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
