"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Flag,
  LoaderCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { MarkdownContent } from "@/components/community/markdown-content";
import { SiteHeader } from "@/components/site-header";
import {
  DetailSkeleton,
  ListSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import {
  archivePost,
  formatPostDate,
  subscribeToComments,
  subscribeToMyLike,
  subscribeToPost,
  type CommunityPost,
  type PostComment,
} from "@/lib/posts";

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { user, configured } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingComment, setDeletingComment] = useState<PostComment | null>(
    null,
  );
  const [editingCommentId, setEditingCommentId] = useState("");
  const [editingContent, setEditingContent] = useState("");
  useEffect(() => {
    if (!configured || !user) return;
    const stops = [
      subscribeToPost(postId, setPost, () =>
        setError("게시물을 불러올 수 없습니다."),
      ),
      subscribeToComments(postId, (items) => {
        setComments(items);
        setCommentsLoaded(true);
      }),
      subscribeToMyLike(postId, user.uid, setLiked),
    ];
    return () => stops.forEach((stop) => stop());
  }, [configured, postId, user]);
  async function remove() {
    if (!post) return;
    setBusy(true);
    try {
      await archivePost(post.id);
      router.replace("/#community");
    } catch {
      setError("삭제하지 못했습니다.");
      setDeleteOpen(false);
      setBusy(false);
    }
  }
  async function toggleLike() {
    if (!user) return;
    setBusy(true);
    try {
      const response = await authenticatedFetch(
        user,
        `/api/posts/${postId}/like`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error();
    } catch {
      setError("좋아요를 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = event.currentTarget;
    const content = String(new FormData(form).get("content") || "").trim();
    if (!content) return;
    setBusy(true);
    try {
      const response = await authenticatedFetch(
        user,
        `/api/posts/${postId}/comments`,
        { method: "POST", body: JSON.stringify({ content }) },
      );
      if (!response.ok) throw new Error();
      form.reset();
    } catch {
      setError("댓글을 등록하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function updateComment(commentId: string) {
    if (!user || !editingContent.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        user,
        `/api/posts/${postId}/comments/${commentId}`,
        { method: "PATCH", body: JSON.stringify({ content: editingContent }) },
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setEditingCommentId("");
      setEditingContent("");
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "댓글을 수정하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeComment() {
    if (!user || !deletingComment) return;
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch(
        user,
        `/api/posts/${postId}/comments/${deletingComment.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();
      setDeletingComment(null);
    } catch {
      setError("댓글을 삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!deleteOpen && !deletingComment) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        setDeleteOpen(false);
        setDeletingComment(null);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [busy, deleteOpen, deletingComment]);
  const owner = Boolean(user && post && user.uid === post.authorId);
  return (
    <>
      <SiteHeader active="/#community" />
      <main className="page-enter mx-auto min-h-screen max-w-4xl px-5 py-8 sm:px-8">
        <Link
          href="/#community"
          className="mb-5 inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          커뮤니티로 돌아가기
        </Link>
        {!configured || !user ? (
          <Message text="학교 계정으로 로그인해 주세요." />
        ) : post === undefined ? (
          <DetailSkeleton className="mt-10" />
        ) : post === null ? (
          <Message text="존재하지 않거나 삭제된 게시물입니다." />
        ) : (
          <>
            <article className="ios-card p-5 sm:p-8">
              <div className="text-sm text-[var(--muted)]">
                {post.category} · {post.authorNickname} ·{" "}
                {formatPostDate(post.createdAt)}
              </div>
              <h1 className="mt-5 break-words text-2xl font-bold leading-tight sm:text-3xl">
                {post.title}
              </h1>
              <MarkdownContent
                content={post.content}
                className="mt-8 min-h-40 border-t border-[var(--border)] pt-8"
              />
              <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[var(--border)] pt-5">
                <button
                  disabled={busy}
                  onClick={toggleLike}
                  className={`rounded-full px-4 py-2 font-semibold ${liked ? "bg-[#e5f1ff] text-[var(--primary)]" : "border border-[var(--border)]"}`}
                >
                  ♥ 좋아요 {post.likeCount}
                </button>
                <div className="flex gap-2">
                  <Link
                    href={`/post/${postId}/report`}
                    className="rounded-full border border-[var(--border)] px-4 py-2"
                  >
                    신고
                  </Link>
                  {owner && (
                    <>
                      <Link
                        href={`/post/${postId}/edit`}
                        className="rounded-full border border-[var(--border)] px-4 py-2"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => setDeleteOpen(true)}
                        className="rounded-full bg-red-50 px-4 py-2 text-red-700"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
            <section className="ios-card mt-6 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                댓글
                {commentsLoaded ? (
                  comments.length
                ) : (
                  <Skeleton className="h-6 w-8 rounded-lg" />
                )}
              </h2>
              <form
                onSubmit={addComment}
                className="mt-4 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  name="content"
                  required
                  maxLength={1000}
                  placeholder="댓글을 입력해 주세요"
                  className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-4 py-3"
                />
                <button
                  disabled={busy}
                  className="h-11 rounded-full bg-[var(--primary)] px-5 text-white sm:h-auto"
                >
                  등록
                </button>
              </form>
              {!commentsLoaded ? (
                <ListSkeleton rows={2} className="mt-5" />
              ) : (
                <div className="mt-5 divide-y divide-[var(--border)]">
                  {comments.map((comment) => (
                    <div key={comment.id} className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 text-sm font-semibold">
                          {comment.authorNickname}{" "}
                          <span className="font-normal text-[var(--muted)]">
                            · {formatPostDate(comment.createdAt)}
                            {comment.updatedAt && " · 수정됨"}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Link
                            href={`/post/${postId}/comment/${comment.id}/report`}
                            aria-label="댓글 신고"
                            className="grid size-9 place-items-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                          >
                            <Flag size={15} />
                          </Link>
                          {comment.authorId === user.uid && (
                            <>
                              <button
                                type="button"
                                aria-label="댓글 수정"
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingContent(comment.content);
                                }}
                                className="grid size-9 place-items-center rounded-full text-[var(--muted)] hover:bg-[#edf5ff] hover:text-[#007aff]"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                aria-label="댓글 삭제"
                                onClick={() => setDeletingComment(comment)}
                                className="grid size-9 place-items-center rounded-full text-[var(--muted)] hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-3 rounded-2xl bg-[#f5f5f7] p-3">
                          <textarea
                            value={editingContent}
                            onChange={(event) =>
                              setEditingContent(event.target.value)
                            }
                            maxLength={1000}
                            rows={4}
                            autoFocus
                            className="w-full resize-y bg-transparent leading-6 outline-none"
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setEditingCommentId("")}
                              className="h-9 rounded-full px-4 text-xs font-semibold text-[var(--muted)] hover:bg-black/5"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              disabled={busy || !editingContent.trim()}
                              onClick={() => void updateComment(comment.id)}
                              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#007aff] px-4 text-xs font-bold text-white disabled:opacity-50"
                            >
                              <Check size={14} /> 저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        {error && (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-red-800">{error}</p>
        )}
      </main>
      {deleteOpen && post && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-post-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy)
              setDeleteOpen(false);
          }}
        >
          <section className="ios-pop w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="delete-post-title" className="text-xl font-bold">
                  정말로 삭제할까요?
                </h2>
                <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)]">
                  삭제한 게시물은 다시 복구할 수 없어요.
                </p>
              </div>
              <button
                type="button"
                aria-label="삭제 확인 닫기"
                disabled={busy}
                onClick={() => setDeleteOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)] disabled:opacity-40"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeleteOpen(false)}
                className="h-12 rounded-full bg-[#f2f2f7] text-sm font-semibold disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                삭제
              </button>
            </div>
          </section>
        </div>
      )}
      {deletingComment && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/30 p-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-comment-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy)
              setDeletingComment(null);
          }}
        >
          <section className="ios-pop w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
            <span className="grid size-11 place-items-center rounded-2xl bg-red-50 text-red-600">
              <AlertTriangle size={21} />
            </span>
            <h2 id="delete-comment-title" className="mt-4 text-xl font-bold">
              댓글을 삭제할까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              삭제한 댓글은 다시 복구할 수 없어요.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDeletingComment(null)}
                className="h-12 rounded-full bg-[#f2f2f7] text-sm font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeComment()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                삭제
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function Message({ text }: { text: string }) {
  return (
    <div className="ios-card mt-10 px-5 py-14 text-center text-sm text-[var(--muted)] sm:p-16 sm:text-base">
      {text}
    </div>
  );
}
