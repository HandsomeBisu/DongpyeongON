"use client";

import Link from "next/link";
import {
  CircleHelp,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { markdownToPlainText } from "@/lib/markdown";
import { VerifiedName } from "@/components/verified-name";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  POST_CATEGORIES,
  formatPostDate,
  subscribeToPosts,
  type CommunityPost,
} from "@/lib/posts";

type PostCategory = (typeof POST_CATEGORIES)[number];

const boardDetails: Record<
  PostCategory,
  { description: string; icon: typeof MessagesSquare; color: string }
> = {
  자유게시판: {
    description: "학교생활과 일상을 자유롭게 나눠요.",
    icon: MessagesSquare,
    color: "text-[#007aff] bg-[#e5f1ff]",
  },
  질문게시판: {
    description: "궁금한 것을 묻고 함께 답해요.",
    icon: CircleHelp,
    color: "text-[#af52de] bg-[#f3eafa]",
  },
  "학생회 공지": {
    description: "학생회에서 전하는 소식을 확인해요.",
    icon: MessageCircle,
    color: "text-[#ff9500] bg-[#fff3df]",
  },
};

export function HomeCommunity() {
  const { user, loading: authLoading, configured } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [board, setBoard] = useState<PostCategory>(POST_CATEGORIES[0]);
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
    );
  }, [configured, user]);

  const visiblePosts = posts.filter((post) => post.category === board);
  const isLoading = authLoading || Boolean(user && loadedFor !== user.uid);
  let emptyMessage = "";
  if (!configured) emptyMessage = "커뮤니티 연결 정보를 확인해 주세요.";
  else if (!user) emptyMessage = "로그인하면 동평의 이야기를 볼 수 있어요.";
  else if (!visiblePosts.length)
    emptyMessage = `${board}의 첫 글을 기다리고 있어요.`;

  return (
    <>
      <section id="community" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageCircle size={24} />
              <h1 className="text-2xl font-bold tracking-[-.03em]">커뮤니티</h1>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              지금 우리 학교의 이야기를 확인해 보세요.
            </p>
          </div>
          <div
            className="flex rounded-2xl bg-[#e9e9ed] p-1.5"
            role="tablist"
            aria-label="게시판 선택"
          >
            {POST_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={board === item}
                onClick={() => setBoard(item)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${board === item ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                {item}
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
            <ListSkeleton rows={4} />
          ) : emptyMessage ? (
            <div className="grid min-h-72 place-items-center p-8 text-center">
              <div>
                <span
                  className={`mx-auto grid size-14 place-items-center rounded-[18px] ${boardDetails[board].color}`}
                >
                  {board === "자유게시판" ? (
                    <MessagesSquare size={26} />
                  ) : (
                    <CircleHelp size={26} />
                  )}
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
              {visiblePosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group block px-5 py-5 transition hover:bg-[#f8f8fa] sm:px-6"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-[13px] ${boardDetails[board].color}`}
                    >
                      {board === "자유게시판" ? (
                        <MessagesSquare size={19} />
                      ) : (
                        <CircleHelp size={19} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                        <VerifiedName
                          name={post.authorNickname}
                          userId={post.authorId}
                          className="font-semibold text-[var(--foreground)]"
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
                      <div className="mt-3 flex items-center gap-3 text-xs text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare size={13} />
                          댓글 {post.commentCount}
                        </span>
                        <span>좋아요 {post.likeCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
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
