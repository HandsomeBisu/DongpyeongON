"use client";

import Link from "next/link";
import {
  CircleHelp,
  Clock3,
  Eye,
  Flame,
  Heart,
  ListFilter,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { VerifiedName } from "@/components/verified-name";
import { ListSkeleton } from "@/components/ui/skeleton";
import { markdownToPlainText } from "@/lib/markdown";
import {
  POST_CATEGORIES,
  formatPostDate,
  subscribeToPosts,
  type CommunityPost,
} from "@/lib/posts";

type PostCategory = (typeof POST_CATEGORIES)[number];
type Board = "전체" | PostCategory;
type SortKey = "latest" | "popular" | "likes" | "comments" | "oldest";

const boards: Board[] = ["전체", ...POST_CATEGORIES];
const sortOptions: Array<{
  key: SortKey;
  label: string;
  icon: typeof Clock3;
}> = [
  { key: "latest", label: "최신순", icon: Clock3 },
  { key: "popular", label: "인기순", icon: Flame },
  { key: "likes", label: "좋아요 많은 순", icon: Heart },
  { key: "comments", label: "댓글 많은 순", icon: MessageSquare },
  { key: "oldest", label: "오래된 순", icon: ListFilter },
];

const categoryDetails: Record<
  PostCategory,
  { icon: typeof MessagesSquare; color: string }
> = {
  자유게시판: {
    icon: MessagesSquare,
    color: "text-[#007aff] bg-[#e5f1ff]",
  },
  질문게시판: {
    icon: CircleHelp,
    color: "text-[#af52de] bg-[#f3eafa]",
  },
  "학생회 공지": {
    icon: Megaphone,
    color: "text-[#d97706] bg-[#fff3df]",
  },
};

function sortPosts(posts: CommunityPost[], sort: SortKey) {
  const createdAt = (post: CommunityPost) => post.createdAt?.toMillis() ?? 0;
  return [...posts].sort((left, right) => {
    if (sort === "oldest") return createdAt(left) - createdAt(right);
    if (sort === "likes")
      return (
        right.likeCount - left.likeCount || createdAt(right) - createdAt(left)
      );
    if (sort === "comments")
      return (
        right.commentCount - left.commentCount ||
        createdAt(right) - createdAt(left)
      );
    if (sort === "popular") {
      const score = (post: CommunityPost) =>
        post.likeCount * 5 + post.commentCount * 3 + post.viewCount;
      return score(right) - score(left) || createdAt(right) - createdAt(left);
    }
    return createdAt(right) - createdAt(left);
  });
}

export function HomeCommunity() {
  const { user, loading: authLoading, configured } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [board, setBoard] = useState<Board>("전체");
  const [sort, setSort] = useState<SortKey>("latest");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!configured || !user) return;
    return subscribeToPosts(
      (items) => {
        setPosts(items);
        setLoadedFor(user.uid);
        setError("");
      },
      () => {
        setLoadedFor(user.uid);
        setError("게시물을 불러오지 못했어요.");
      },
      0,
    );
  }, [configured, user]);

  const visiblePosts = useMemo(
    () =>
      sortPosts(
        board === "전체"
          ? posts
          : posts.filter((post) => post.category === board),
        sort,
      ),
    [board, posts, sort],
  );
  const isLoading = authLoading || Boolean(user && loadedFor !== user.uid);
  const emptyMessage = !configured
    ? "커뮤니티 연결 정보를 확인해 주세요."
    : !user
      ? "로그인하면 동평의 이야기를 볼 수 있어요."
      : board === "전체"
        ? "아직 등록된 게시물이 없어요."
        : `${board}의 첫 글을 기다리고 있어요.`;

  return (
    <>
      <section className="pb-24 md:pb-10">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <MessageCircle size={26} />
            <h1 className="text-2xl font-bold tracking-[-.03em] sm:text-3xl">
              전체 게시물
            </h1>
          </div>
          <p className="mt-2 break-keep text-sm text-[var(--muted)]">
            동평중학교의 모든 이야기를 원하는 순서로 확인해 보세요.
          </p>
        </div>

        <div className="mb-4 space-y-3">
          <div
            className="flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-[#e9e9ed] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="게시판 선택"
          >
            {boards.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={board === item}
                onClick={() => setBoard(item)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${board === item ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <div
            className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="게시물 정렬"
          >
            {sortOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                aria-pressed={sort === key}
                onClick={() => setSort(key)}
                className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition ${sort === key ? "border-[#007aff] bg-[#eaf4ff] text-[#007aff]" : "border-black/10 bg-white text-[var(--muted)] hover:bg-[#f8f8fa]"}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="ios-card overflow-hidden">
          {isLoading ? (
            <ListSkeleton rows={6} />
          ) : !visiblePosts.length ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#e5f1ff] text-[#007aff]">
                  <MessagesSquare size={26} />
                </span>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  {emptyMessage}
                </p>
                {!user && !authLoading && (
                  <Link
                    href="/login"
                    className="mt-3 inline-flex text-sm font-semibold text-[#007aff]"
                  >
                    로그인하기 →
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {visiblePosts.map((post) => {
                const details = categoryDetails[post.category];
                const Icon = details.icon;
                return (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className={`group block px-4 py-5 transition hover:bg-[#f8f8fa] sm:px-6 ${post.category === "학생회 공지" ? "bg-gradient-to-r from-[#fff8ec] to-white" : ""}`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span
                        className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-[13px] ${details.color}`}
                      >
                        <Icon size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
                          <span className="font-semibold text-[var(--foreground)]">
                            {post.category}
                          </span>
                          <span>·</span>
                          <VerifiedName
                            name={post.authorNickname}
                            userId={post.authorId}
                          />
                          <span>·</span>
                          <time>{formatPostDate(post.createdAt)}</time>
                        </div>
                        <h2 className="mt-1.5 truncate text-base font-bold group-hover:text-[#007aff]">
                          {post.title}
                        </h2>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
                          {markdownToPlainText(post.content)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={13} /> 조회 {post.viewCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart size={13} /> 좋아요 {post.likeCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare size={13} /> 댓글 {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Link
        href={user ? "/post/new" : "/login"}
        aria-label={user ? "새 게시물 작성" : "로그인하고 새 게시물 작성"}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-[60] grid size-14 place-items-center rounded-full bg-[#007aff] text-white shadow-xl shadow-blue-500/30 transition hover:scale-105 hover:bg-[#0674df] md:bottom-7 md:right-7"
      >
        <Plus size={27} strokeWidth={2.5} />
      </Link>
    </>
  );
}
