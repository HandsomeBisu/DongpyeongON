"use client";

import Link from "next/link";
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
    <div className="sticky top-[74px] z-30 max-w-full overflow-hidden border-b border-blue-200/70 bg-[#eaf4ff]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-11 max-w-6xl items-center gap-2 px-3 py-2 text-sm text-[#005bbb] sm:px-5">
        <Link
          href={`/announcement/${announcement.id}`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 hover:opacity-75"
        >
          <Megaphone size={16} className="shrink-0" />
          <strong className="min-w-0 truncate">{announcement.title}</strong>
          <span className="hidden min-w-0 truncate text-[#356d9e] sm:block">
            {announcement.content.replace(/\s+/g, " ")}
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setAnnouncement(null)}
          className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-blue-100"
          aria-label="공지 배너 닫기"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
