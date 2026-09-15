"use client";

import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAnnouncements, type SiteAnnouncement } from "@/lib/announcements";

export function AnnouncementPopup() {
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
          setAnnouncement(item);
      })
      .catch(() => undefined);
  }, []);

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
        <p className="mt-6 max-h-[50dvh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7 text-[#3a3a3c]">
          {announcement.content}
        </p>
        <button
          type="button"
          onClick={close}
          className="mt-7 h-12 w-full rounded-full bg-[#007aff] text-sm font-bold text-white"
        >
          확인했어요
        </button>
      </section>
    </div>
  );
}
