"use client";

import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAnnouncements, type SiteAnnouncement } from "@/lib/announcements";

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<SiteAnnouncement | null>(
    null,
  );
  useEffect(() => {
    fetchAnnouncements()
      .then((items) =>
        setAnnouncement(items.find((item) => item.showBanner) ?? null),
      )
      .catch(() => undefined);
  }, []);
  if (!announcement) return null;
  return (
    <div className="sticky top-[74px] z-30 border-b border-blue-200/70 bg-[#eaf4ff]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-11 max-w-6xl items-center gap-2 px-5 py-2 text-sm text-[#005bbb]">
        <Megaphone size={16} className="shrink-0" />
        <strong className="shrink-0">{announcement.title}</strong>
        <span className="hidden min-w-0 truncate text-[#356d9e] sm:block">
          {announcement.content.replace(/\s+/g, " ")}
        </span>
        <button
          type="button"
          onClick={() => setAnnouncement(null)}
          className="ml-auto grid size-8 shrink-0 place-items-center rounded-full hover:bg-blue-100"
          aria-label="공지 배너 닫기"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
