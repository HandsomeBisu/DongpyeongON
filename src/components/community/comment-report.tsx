"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, LoaderCircle } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { DetailSkeleton } from "@/components/ui/skeleton";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { subscribeToComments, type PostComment } from "@/lib/posts";

const reasons = [
  "욕설·비방",
  "개인정보 노출",
  "광고·도배",
  "부적절한 내용",
  "기타",
] as const;

export function CommentReport({
  postId,
  commentId,
}: {
  postId: string;
  commentId: string;
}) {
  const { user, configured } = useAuth();
  const [comment, setComment] = useState<PostComment | null>();
  const [reason, setReason] = useState<(typeof reasons)[number]>(reasons[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!configured || !user) return;
    return subscribeToComments(postId, (comments) => {
      setComment(comments.find((item) => item.id === commentId) ?? null);
    });
  }, [commentId, configured, postId, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await authenticatedFetch(user, "/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: "comment",
          postId,
          commentId,
          reason,
          detail: data.get("detail"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error || "신고를 접수하지 못했어요.");
      setCompleted(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "신고를 접수하지 못했어요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SiteHeader active="/community" />
      <main className="page-enter mx-auto min-h-[calc(100dvh-74px)] max-w-3xl px-5 py-7 sm:px-8 sm:py-10">
        <Link
          href={`/post/${postId}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          게시물로 돌아가기
        </Link>
        {!configured || !user ? (
          <Message text="학교 계정으로 로그인해 주세요." />
        ) : comment === undefined ? (
          <DetailSkeleton className="mt-10" />
        ) : !comment ? (
          <Message text="존재하지 않거나 삭제된 댓글이에요." />
        ) : completed ? (
          <section className="ios-card mt-6 px-6 py-14 text-center sm:px-10">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
              <Check size={30} strokeWidth={2.5} />
            </span>
            <h1 className="mt-5 text-2xl font-bold">신고가 접수됐어요</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              처리 결과는 알림 센터에서 확인할 수 있어요.
            </p>
          </section>
        ) : (
          <>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-[15px] bg-red-50 text-red-600">
                <AlertTriangle size={21} />
              </span>
              <div>
                <p className="text-xs font-bold tracking-[.12em] text-red-600">
                  REPORT
                </p>
                <h1 className="mt-1 text-[28px] font-bold tracking-[-.04em] sm:text-3xl">
                  댓글 신고
                </h1>
              </div>
            </div>
            <form
              onSubmit={submit}
              className="ios-card mt-6 grid gap-5 p-5 sm:p-8"
            >
              <div className="rounded-2xl bg-[#f5f5f7] px-4 py-4">
                <p className="text-xs font-semibold text-[var(--muted)]">
                  신고할 댓글
                </p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-6">
                  {comment.content}
                </p>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">
                  신고 사유
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {reasons.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setReason(item)}
                      className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold ${reason === item ? "border-red-400 bg-red-50 text-red-700 ring-4 ring-red-500/10" : "border-[var(--border)] bg-[#f8f8fa]"}`}
                    >
                      {item}
                      {reason === item && <Check size={17} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label>
                <span className="mb-2 block text-sm font-semibold">
                  상세 내용
                </span>
                <textarea
                  name="detail"
                  maxLength={500}
                  rows={6}
                  placeholder="관리자가 확인할 내용을 입력해 주세요. (선택)"
                  className="w-full resize-y rounded-2xl border border-[var(--border)] bg-[#f5f5f7] p-4 leading-6 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                />
              </label>
              {error && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button
                disabled={busy}
                className="inline-flex h-12 min-w-28 items-center justify-center rounded-full bg-red-600 px-6 text-sm font-bold text-white disabled:opacity-50 sm:justify-self-end"
              >
                {busy ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  "신고 접수"
                )}
              </button>
            </form>
          </>
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
