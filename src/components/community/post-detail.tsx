"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { MarkdownContent } from "@/components/community/markdown-content";
import { MarkdownEditor } from "@/components/community/markdown-editor";
import { SiteHeader } from "@/components/site-header";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import {
  POST_CATEGORIES,
  archivePost,
  formatPostDate,
  postInputSchema,
  subscribeToComments,
  subscribeToMyLike,
  subscribeToPost,
  updatePost,
  type CommunityPost,
  type PostComment,
} from "@/lib/posts";

export function PostDetail({ postId }: { postId: string }) {
  const router = useRouter();
  const { user, profile, configured } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reporting, setReporting] = useState(false);
  useEffect(() => {
    if (!configured || !user) return;
    const stops = [
      subscribeToPost(postId, setPost, () =>
        setError("게시물을 불러올 수 없습니다."),
      ),
      subscribeToComments(postId, setComments),
      subscribeToMyLike(postId, user.uid, setLiked),
    ];
    return () => stops.forEach((stop) => stop());
  }, [configured, postId, user]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!post) return;
    const data = new FormData(event.currentTarget);
    const result = postInputSchema.safeParse({
      title: data.get("title"),
      content: data.get("content"),
      category: data.get("category"),
    });
    if (!result.success)
      return setError(
        result.error.issues[0]?.message ?? "입력을 확인해 주세요.",
      );
    setBusy(true);
    try {
      await updatePost(post.id, result.data);
      setEditing(false);
    } catch {
      setError("수정하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!post || !confirm("이 게시물을 삭제할까요?")) return;
    try {
      await archivePost(post.id);
      router.replace("/#community");
    } catch {
      setError("삭제하지 못했습니다.");
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
  async function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const response = await authenticatedFetch(user, "/api/reports", {
        method: "POST",
        body: JSON.stringify({
          postId,
          reason: data.get("reason"),
          detail: data.get("detail"),
        }),
      });
      if (!response.ok) throw new Error();
      setReporting(false);
      setError("");
      alert("신고가 접수되었습니다.");
    } catch {
      setError("신고를 접수하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
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
          <Message text="게시물을 불러오고 있어요." />
        ) : post === null ? (
          <Message text="존재하지 않거나 삭제된 게시물입니다." />
        ) : editing ? (
          <form onSubmit={save} className="ios-card mt-4 grid gap-4 p-5 sm:p-8">
            <select
              name="category"
              defaultValue={post.category}
              className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-3"
            >
              {POST_CATEGORIES.filter(
                (category) =>
                  category !== "학생회 공지" ||
                  profile?.role === "student_council" ||
                  profile?.role === "admin",
              ).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <input
              name="title"
              defaultValue={post.title}
              required
              maxLength={80}
              className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-3"
            />
            <MarkdownEditor
              name="content"
              defaultValue={post.content}
              rows={12}
            />
            <button
              disabled={busy}
              className="justify-self-end rounded-full bg-[var(--primary)] px-5 py-2.5 text-white"
            >
              저장
            </button>
          </form>
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
                  <button
                    onClick={() => setReporting(!reporting)}
                    className="rounded-full border border-[var(--border)] px-4 py-2"
                  >
                    신고
                  </button>
                  {owner && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border border-[var(--border)] px-4 py-2"
                      >
                        수정
                      </button>
                      <button
                        onClick={remove}
                        className="rounded-full bg-red-50 px-4 py-2 text-red-700"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
            {reporting && (
              <form onSubmit={report} className="ios-card mt-4 grid gap-3 p-5">
                <strong>게시물 신고</strong>
                <select
                  name="reason"
                  className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-3"
                >
                  {[
                    "욕설·비방",
                    "개인정보 노출",
                    "광고·도배",
                    "부적절한 내용",
                    "기타",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
                <textarea
                  name="detail"
                  maxLength={500}
                  placeholder="상세 내용(선택)"
                  className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-3"
                />
                <button
                  disabled={busy}
                  className="justify-self-end rounded-full bg-red-600 px-4 py-2 text-white"
                >
                  신고 접수
                </button>
              </form>
            )}
            <section className="ios-card mt-6 p-5 sm:p-6">
              <h2 className="text-xl font-bold">댓글 {comments.length}</h2>
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
              <div className="mt-5 divide-y divide-[var(--border)]">
                {comments.map((comment) => (
                  <div key={comment.id} className="py-4">
                    <div className="text-sm font-semibold">
                      {comment.authorNickname}{" "}
                      <span className="font-normal text-[var(--muted)]">
                        · {formatPostDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        {error && (
          <p className="mt-5 rounded-2xl bg-red-50 p-4 text-red-800">{error}</p>
        )}
      </main>
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
