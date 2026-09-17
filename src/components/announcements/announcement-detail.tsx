"use client";

import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { MarkdownContent } from "@/components/community/markdown-content";
import { SiteHeader } from "@/components/site-header";
import { DetailSkeleton } from "@/components/ui/skeleton";
import type { SiteAnnouncement } from "@/lib/announcements";

export function AnnouncementDetail({
  announcementId,
}: {
  announcementId: string;
}) {
  const [announcement, setAnnouncement] = useState<
    SiteAnnouncement | null | undefined
  >();
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/announcements/${announcementId}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json().catch(() => ({}))) as {
          announcement?: SiteAnnouncement;
          error?: string;
        };
        if (!response.ok || !result.announcement)
          throw new Error(result.error || "공지사항을 불러오지 못했어요.");
        setAnnouncement(result.announcement);
      })
      .catch((caught) => {
        setAnnouncement(null);
        setError(
          caught instanceof Error
            ? caught.message
            : "공지사항을 불러오지 못했어요.",
        );
      });
  }, [announcementId]);

  return (
    <>
      <SiteHeader />
      <main className="page-enter mx-auto min-h-[calc(100dvh-74px)] max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/"
          className="mb-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          홈으로 돌아가기
        </Link>
        {announcement === undefined ? (
          <DetailSkeleton className="mt-5" />
        ) : !announcement ? (
          <Message text={error || "존재하지 않는 공지사항이에요."} />
        ) : (
          <article className="ios-card p-5 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#ff9500]">
              <Megaphone size={18} />
              전체 공지
            </div>
            <h1 className="mt-5 break-words text-2xl font-bold leading-tight sm:text-3xl">
              {announcement.title}
            </h1>
            <time className="mt-3 block text-sm text-[var(--muted)]">
              {formatDate(announcement.createdAt)}
            </time>
            <MarkdownContent
              content={announcement.content}
              className="mt-8 min-h-48 border-t border-[var(--border)] pt-8"
            />
          </article>
        )}
      </main>
    </>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className="ios-card mt-5 px-5 py-16 text-center text-sm text-[var(--muted)] sm:p-20 sm:text-base">
      {text}
    </div>
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date(value))
    : "방금 전";
}
