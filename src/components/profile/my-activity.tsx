"use client";

import Link from "next/link";
import { ChevronRight, FileText, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { ListSkeleton } from "@/components/ui/skeleton";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

type MyPost = {
  id: string;
  title: string;
  category: string;
  createdAt: string | null;
};

type MyComment = {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  createdAt: string | null;
};

export function MyActivity() {
  const { user } = useAuth();
  const [view, setView] = useState<"posts" | "comments">("posts");
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    authenticatedFetch(user, "/api/me/activity")
      .then(async (response) => {
        const result = (await response.json().catch(() => ({}))) as {
          posts?: MyPost[];
          comments?: MyComment[];
          error?: string;
        };
        if (!response.ok) throw new Error(result.error);
        if (!active) return;
        setPosts(result.posts ?? []);
        setComments(result.comments ?? []);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error && caught.message
            ? caught.message
            : "내 활동을 불러오지 못했어요.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const items = view === "posts" ? posts : comments;

  return (
    <section className="ios-card mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-xl font-bold">내 활동</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            내가 작성한 게시물과 댓글을 다시 확인할 수 있어요.
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-2xl bg-[#e9e9ed] p-1">
          <ActivityTab
            active={view === "posts"}
            label={`게시물 ${posts.length}`}
            onClick={() => setView("posts")}
          />
          <ActivityTab
            active={view === "comments"}
            label={`댓글 ${comments.length}`}
            onClick={() => setView("comments")}
          />
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ActivityMessage text={error} />
      ) : items.length === 0 ? (
        <ActivityMessage
          text={
            view === "posts"
              ? "아직 작성한 게시물이 없어요."
              : "아직 작성한 댓글이 없어요."
          }
        />
      ) : view === "posts" ? (
        <div className="divide-y divide-[var(--border)]">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="group flex min-w-0 items-center gap-3 px-5 py-4 hover:bg-[#f8f8fa] sm:px-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#e5f1ff] text-[#007aff]">
                <FileText size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm group-hover:text-[#007aff]">
                  {post.title}
                </strong>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {post.category} · {formatDate(post.createdAt)}
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-[#aeaeb2]" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {comments.map((comment) => (
            <Link
              key={comment.id}
              href={`/post/${comment.postId}?comment=${encodeURIComponent(comment.id)}`}
              className="group flex min-w-0 items-center gap-3 px-5 py-4 hover:bg-[#f8f8fa] sm:px-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f3eafa] text-[#af52de]">
                <MessageCircle size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm group-hover:text-[#007aff]">
                  {comment.content}
                </strong>
                <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                  {comment.postTitle} · {formatDate(comment.createdAt)}
                </span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-[#aeaeb2]" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-xl px-4 text-xs font-bold transition ${active ? "bg-white text-[#007aff] shadow-sm" : "text-[var(--muted)]"}`}
    >
      {label}
    </button>
  );
}

function ActivityMessage({ text }: { text: string }) {
  return (
    <div className="grid min-h-44 place-items-center px-6 text-center text-sm text-[var(--muted)]">
      {text}
    </div>
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "방금 전";
}
