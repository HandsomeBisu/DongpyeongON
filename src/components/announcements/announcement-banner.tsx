"use client";

import Link from "next/link";
import { X } from "lucide-react";
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
          className="min-w-0 flex-1 rounded-lg py-1 hover:opacity-75"
        >
          <strong className="block truncate">{announcement.title}</strong>
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
