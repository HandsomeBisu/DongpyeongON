"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAnnouncements, type SiteAnnouncement } from "@/lib/announcements";

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    fetchAnnouncements()
      .then((items) => {
        setIndex(0);
        setAnnouncements(items.filter((item) => item.showBanner));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (announcements.length < 2 || closed) return;
    let transitionTimer = 0;
    const interval = window.setInterval(() => {
      setSliding(true);
      transitionTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % announcements.length);
        setSliding(false);
      }, 560);
    }, 3_000);
    return () => {
      window.clearInterval(interval);
      if (transitionTimer) window.clearTimeout(transitionTimer);
    };
  }, [announcements.length, closed]);

  if (closed || !announcements.length) return null;
  const current = announcements[index % announcements.length];
  const next = announcements[(index + 1) % announcements.length];

  return (
    <div className="sticky top-[74px] z-30 max-w-full overflow-hidden border-b border-blue-200/70 bg-[#eaf4ff]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-11 max-w-6xl items-center gap-2 px-3 py-2 text-sm text-[#005bbb] sm:px-5">
        <div className="relative h-7 min-w-0 flex-1 overflow-hidden">
          <BannerLink
            announcement={current}
            className={sliding ? "announcement-title-out" : ""}
          />
          {announcements.length > 1 && (
            <BannerLink
              announcement={next}
              className={
                sliding ? "announcement-title-in" : "announcement-title-next"
              }
            />
          )}
        </div>
        {announcements.length > 1 && (
          <span className="shrink-0 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold text-[#007aff]">
            {index + 1}/{announcements.length}
          </span>
        )}
        <button
          type="button"
          onClick={() => setClosed(true)}
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-blue-100"
          aria-label="공지 배너 닫기"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

function BannerLink({
  announcement,
  className,
}: {
  announcement: SiteAnnouncement;
  className: string;
}) {
  return (
    <Link
      href={announcement.href ?? `/announcement/${announcement.id}`}
      className={`absolute inset-0 flex min-w-0 items-center rounded-lg will-change-transform hover:opacity-75 ${className}`}
    >
      <strong className="block truncate">{announcement.title}</strong>
    </Link>
  );
}
