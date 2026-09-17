"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Megaphone,
  MessagesSquare,
  Pencil,
  Send,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { ListSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { MarkdownEditor } from "@/components/community/markdown-editor";
import { adminFetch } from "@/lib/admin-fetch";
import { CommunityAdminNav } from "@/components/admin/community-admin-nav";
import type { SiteAnnouncement } from "@/lib/announcements";
import type { ContentStatus } from "@/types/domain";
import { VerifiedName } from "@/components/verified-name";

type AdminPost = {
  id: string;
  title: string;
  category: string;
  authorNickname: string;
  authorId: string;
  authorVerified: boolean;
  status: ContentStatus;
  likeCount: number;
  commentCount: number;
  createdAt: string | null;
};

const statuses: Array<{ value: ContentStatus; label: string }> = [
  { value: "published", label: "공개" },
  { value: "hidden", label: "숨김" },
  { value: "deleted", label: "삭제됨" },
];

export function AdminCommunity() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [message, setMessage] = useState("");
  const [postsLoading, setPostsLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<SiteAnnouncement | null>(null);
  const announcementFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    adminFetch("/api/admin/posts")
      .then(async (response) => {
        if (!response.ok) {
          setMessage(
            response.status === 423
              ? "커뮤니티 관리 비밀번호 인증이 필요해요."
              : "게시물을 불러오지 못했어요.",
          );
          return;
        }
        setPosts((await response.json()).posts);
        setMessage("");
      })
      .catch(() => setMessage("게시물을 불러오지 못했어요."))
      .finally(() => setPostsLoading(false));
    adminFetch("/api/admin/announcements")
      .then(async (response) => {
        if (!response.ok) return;
        setAnnouncements((await response.json()).announcements);
      })
      .catch(() => undefined)
      .finally(() => setAnnouncementsLoading(false));
  }, []);

  async function publishAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPublishing(true);
    setAnnouncementMessage("");
    const response = await adminFetch(
      editingAnnouncement
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : "/api/admin/announcements",
      {
      method: editingAnnouncement ? "PATCH" : "POST",
      body: JSON.stringify({
        title: data.get("title"),
        content: data.get("content"),
        showPopup: data.get("showPopup") === "on",
        showBanner: data.get("showBanner") === "on",
      }),
      },
    );
    const result = (await response.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
    };
    if (response.ok && (editingAnnouncement || result.id)) {
      const saved: SiteAnnouncement = {
        id: editingAnnouncement?.id ?? result.id ?? "",
        title: String(data.get("title")),
        content: String(data.get("content")),
        showPopup: data.get("showPopup") === "on",
        showBanner: data.get("showBanner") === "on",
        createdAt:
          editingAnnouncement?.createdAt ?? new Date().toISOString(),
      };
      setAnnouncements((items) =>
        editingAnnouncement
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items].slice(0, 100),
      );
      setAnnouncementMessage(
        editingAnnouncement
          ? "전체 공지를 수정했어요."
          : "전체 공지를 등록했어요.",
      );
      setEditingAnnouncement(null);
      form.reset();
    } else {
      setAnnouncementMessage(result.error || "전체 공지를 등록하지 못했어요.");
    }
    setPublishing(false);
  }

  async function changeStatus(id: string, status: ContentStatus) {
    setBusy(id);
    const response = await adminFetch(`/api/admin/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      setPosts((items) =>
        items.map((item) => (item.id === id ? { ...item, status } : item)),
      );
      setMessage("게시물 상태를 변경했어요.");
    } else setMessage("게시물 상태를 변경하지 못했어요.");
    setBusy("");
  }

  return (
    <>
      <SiteHeader />
      <main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          관리자 홈
        </Link>
        <CommunityAdminNav active="/admin/community" />
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#af52de]">
              커뮤니티 관리
            </p>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-3xl">
              게시물 관리
            </h1>
            <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)] sm:text-base">
              커뮤니티 게시물의 공개 상태를 관리해요.
            </p>
          </div>
          <span className="hidden size-12 place-items-center rounded-2xl bg-[#f3eafa] text-[#af52de] sm:grid">
            <MessagesSquare size={24} />
          </span>
        </div>
        <section className="ios-card mb-8 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#fff3df] text-[#ff9500]">
              <Megaphone size={20} />
            </span>
            <div>
              <h2 className="font-bold">전체 공지 작성</h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                여러 공지를 배너와 팝업에 동시에 활성화할 수 있어요.
              </p>
            </div>
          </div>
          <form
            key={editingAnnouncement?.id ?? "new-announcement"}
            ref={announcementFormRef}
            onSubmit={publishAnnouncement}
            className="mt-5 grid scroll-mt-28 gap-4"
          >
            {editingAnnouncement && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#edf5ff] px-4 py-3 text-sm text-[#0066d6]">
                <span className="min-w-0 truncate font-bold">
                  ‘{editingAnnouncement.title}’ 수정 중
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementMessage("");
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white/80"
                  aria-label="공지 수정 취소"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <input
              name="title"
              defaultValue={editingAnnouncement?.title ?? ""}
              required
              minLength={2}
              maxLength={80}
              placeholder="공지 제목"
              className="h-12 rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 outline-none focus:border-[#007aff]"
            />
            <div>
              <span className="mb-2 block text-sm font-semibold">
                공지 내용
              </span>
              <MarkdownEditor
                key={editingAnnouncement?.id ?? "new-editor"}
                name="content"
                defaultValue={editingAnnouncement?.content ?? ""}
                rows={8}
                placeholder="전체 사용자에게 알릴 내용을 입력해 주세요."
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AnnouncementOption
                name="showPopup"
                title="접속 팝업"
                description="최신 활성 공지 중 최대 2개를 차례로 띄워요."
                defaultChecked={editingAnnouncement?.showPopup ?? false}
              />
              <AnnouncementOption
                name="showBanner"
                title="상단 배너"
                description="여러 제목을 상단에서 차례로 전환해요."
                defaultChecked={editingAnnouncement?.showBanner ?? false}
              />
            </div>
            {announcementMessage && (
              <p className="rounded-2xl bg-[#f5f5f7] px-4 py-3 text-sm text-[var(--muted)]">
                {announcementMessage}
              </p>
            )}
            <button
              disabled={publishing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#007aff] px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 disabled:opacity-50 sm:justify-self-end"
            >
              <Send size={16} />
              {publishing
                ? editingAnnouncement
                  ? "수정 중..."
                  : "등록 중..."
                : editingAnnouncement
                  ? "수정사항 저장"
                  : "전체 공지 등록"}
            </button>
          </form>
          {announcementsLoading ? (
            <div className="mt-6 overflow-hidden border-t border-[var(--border)] pt-5">
              <ListSkeleton rows={2} className="rounded-2xl bg-[#f5f5f7]" />
            </div>
          ) : (
            announcements.length > 0 && (
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <h3 className="text-sm font-bold">전체 공지 관리</h3>
                <div className="mt-3 space-y-2">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#f5f5f7] px-4 py-3"
                    >
                      {announcement.showPopup || announcement.showBanner ? (
                        <Link
                          href={`/announcement/${announcement.id}`}
                          target="_blank"
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-bold hover:text-[#007aff]"
                        >
                          <span className="truncate">{announcement.title}</span>
                          <ExternalLink size={13} className="shrink-0" />
                        </Link>
                      ) : (
                        <strong className="min-w-0 flex-1 truncate text-sm">
                          {announcement.title}
                        </strong>
                      )}
                      {announcement.showPopup && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#af52de]">
                          팝업
                        </span>
                      )}
                      {announcement.showBanner && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#007aff]">
                          배너
                        </span>
                      )}
                      {!announcement.showPopup && !announcement.showBanner && (
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                          비노출
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAnnouncement(announcement);
                          setAnnouncementMessage("");
                          window.requestAnimationFrame(() =>
                            announcementFormRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            }),
                          );
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold text-[#007aff] shadow-sm"
                      >
                        <Pencil size={13} /> 수정
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </section>
        {message && (
          <p
            className={`mb-4 rounded-2xl px-4 py-3 text-sm ${message.includes("변경했어요") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}
          >
            {message}
          </p>
        )}
        <section className="ios-card overflow-hidden">
          {postsLoading ? (
            <TableSkeleton rows={5} />
          ) : (
            <>
              <div className="divide-y divide-[var(--border)] md:hidden">
                {posts.map((post) => (
                  <article key={post.id} className="p-5">
                    <div className="flex min-w-0 items-start gap-2">
                      <strong className="min-w-0 flex-1 break-words leading-6">
                        {post.title}
                      </strong>
                      <Link
                        href={`/post/${post.id}`}
                        target="_blank"
                        aria-label="게시물 열기"
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[#edf5ff] text-[#007aff]"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {post.category} ·{" "}
                      <VerifiedName
                        name={post.authorNickname}
                        userId={post.authorId}
                        verified={post.authorVerified}
                      />{" "}
                      ·{" "}
                      {formatDate(post.createdAt)}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                      <span className="text-xs text-[var(--muted)]">
                        좋아요 {post.likeCount} · 댓글 {post.commentCount}
                      </span>
                      <select
                        aria-label={`${post.title} 상태`}
                        value={post.status}
                        disabled={busy === post.id}
                        onChange={(event) =>
                          void changeStatus(
                            post.id,
                            event.target.value as ContentStatus,
                          )
                        }
                        className="h-11 min-w-24 rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-3 text-sm font-semibold"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left">
                  <thead className="bg-[#f5f5f7] text-xs text-[var(--muted)]">
                    <tr>
                      <th className="p-4">게시물</th>
                      <th className="p-4">작성자</th>
                      <th className="p-4">반응</th>
                      <th className="p-4">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr
                        key={post.id}
                        className="border-t border-[var(--border)]"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <strong className="max-w-sm truncate">
                              {post.title}
                            </strong>
                            <Link
                              href={`/post/${post.id}`}
                              target="_blank"
                              aria-label="게시물 열기"
                              className="text-[#007aff]"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {post.category} · {formatDate(post.createdAt)}
                          </p>
                        </td>
                        <td className="p-4 text-sm">
                          <VerifiedName
                            name={post.authorNickname}
                            userId={post.authorId}
                            verified={post.authorVerified}
                          />
                        </td>
                        <td className="p-4 text-sm text-[var(--muted)]">
                          좋아요 {post.likeCount} · 댓글 {post.commentCount}
                        </td>
                        <td className="p-4">
                          <select
                            aria-label={`${post.title} 상태`}
                            value={post.status}
                            disabled={busy === post.id}
                            onChange={(event) =>
                              void changeStatus(
                                post.id,
                                event.target.value as ContentStatus,
                              )
                            }
                            className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-3 py-2 text-sm font-semibold"
                          >
                            {statuses.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!posts.length && !message && (
                <div className="grid min-h-60 place-items-center px-5 text-center text-sm text-[var(--muted)]">
                  관리할 게시물이 없어요.
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}

function AnnouncementOption({
  name,
  title,
  description,
  defaultChecked = false,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-[#f8f8fa] p-4 has-checked:border-[#007aff]/40 has-checked:bg-[#edf5ff]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-5 accent-[#007aff]"
      />
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block break-keep text-xs leading-5 text-[var(--muted)]">
          {description}
        </span>
      </span>
    </label>
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "방금 전";
}
