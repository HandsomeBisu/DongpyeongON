"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  LoaderCircle,
  Megaphone,
  MessagesSquare,
  PenLine,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/auth-provider";
import { MarkdownEditor } from "@/components/community/markdown-editor";
import { SiteHeader } from "@/components/site-header";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import {
  POST_CATEGORIES,
  postInputSchema,
  subscribeToPost,
  updatePost,
  type CommunityPost,
} from "@/lib/posts";

type PostCategory = (typeof POST_CATEGORIES)[number];

const boardDetails = {
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
    icon: Megaphone,
    color: "text-[#ff9500] bg-[#fff3df]",
  },
} satisfies Record<
  PostCategory,
  { description: string; icon: typeof MessagesSquare; color: string }
>;

export function PostComposer({ postId }: { postId?: string }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [board, setBoard] = useState<PostCategory>(POST_CATEGORIES[0]);
  const [editingPost, setEditingPost] = useState<
    CommunityPost | null | undefined
  >(postId ? undefined : null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectionConfirmation, setSelectionConfirmation] = useState("");
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (!postId || !user) return;
    return subscribeToPost(
      postId,
      (post) => {
        setEditingPost(post);
        if (post) setBoard(post.category);
      },
      () => {
        setEditingPost(null);
        setError("게시물을 불러오지 못했어요.");
      },
    );
  }, [postId, user]);

  useEffect(
    () => () => {
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    },
    [],
  );

  function selectBoard(nextBoard: PostCategory) {
    setBoard(nextBoard);
    setError("");
    setSelectionConfirmation(`${nextBoard} 선택됨`);
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    confirmationTimer.current = setTimeout(
      () => setSelectionConfirmation(""),
      680,
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const parsed = postInputSchema.safeParse({
      title: data.get("title"),
      content: data.get("content"),
      category: board,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (postId) {
        await updatePost(postId, parsed.data);
        router.push(`/post/${postId}`);
      } else {
        const response = await authenticatedFetch(user, "/api/posts", {
          method: "POST",
          body: JSON.stringify(parsed.data),
        });
        const result = (await response.json().catch(() => ({}))) as {
          postId?: string;
          error?: string;
        };
        if (!response.ok || !result.postId)
          throw new Error(result.error || "게시물을 등록하지 못했어요.");
        router.push(`/post/${result.postId}`);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : postId
            ? "게시물을 수정하지 못했어요. 잠시 후 다시 시도해 주세요."
            : "게시물을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setSaving(false);
    }
  }

  if (loading || !user || (postId && editingPost === undefined))
    return (
      <>
        <SiteHeader active="/#community" />
        <main className="grid min-h-[70dvh] place-items-center">
          <span className="size-6 animate-spin rounded-full border-2 border-[#007aff]/25 border-t-[#007aff]" />
        </main>
      </>
    );

  if (postId && (!editingPost || editingPost.authorId !== user.uid))
    return (
      <>
        <SiteHeader active="/#community" />
        <main className="mx-auto max-w-3xl px-5 py-10">
          <div className="ios-card px-5 py-16 text-center text-sm text-[var(--muted)]">
            {editingPost
              ? "이 게시물을 수정할 권한이 없어요."
              : "존재하지 않거나 삭제된 게시물이에요."}
          </div>
        </main>
      </>
    );

  const isEditing = Boolean(postId && editingPost);
  const returnHref = postId ? `/post/${postId}` : "/#community";

  return (
    <>
      <SiteHeader active="/#community" />
      <main className="page-enter mx-auto min-h-[calc(100dvh-74px)] max-w-3xl px-5 py-7 sm:px-8 sm:py-10">
        <Link
          href={returnHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          {isEditing ? "게시물로 돌아가기" : "커뮤니티로 돌아가기"}
        </Link>

        <div className="mt-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[15px] bg-[#e5f1ff] text-[#007aff]">
              <PenLine size={21} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[.12em] text-[#007aff]">
                {isEditing ? "EDIT POST" : "NEW POST"}
              </p>
              <h1 className="mt-1 text-[28px] font-bold tracking-[-.04em] sm:text-3xl">
                {isEditing ? "게시물 수정" : "새 게시물 작성"}
              </h1>
            </div>
          </div>
          <p className="mt-3 break-keep text-sm leading-6 text-[var(--muted)]">
            {isEditing
              ? "작성 화면과 같은 방식으로 내용을 편집할 수 있어요."
              : "게시판을 고르고 우리 학교 친구들과 이야기를 나눠보세요."}
          </p>
        </div>

        <form onSubmit={submit} className="ios-card mt-6 grid gap-5 p-5 sm:p-8">
          <BoardSelect
            value={board}
            onChange={selectBoard}
            options={
              profile?.role === "student_council" || profile?.role === "admin"
                ? POST_CATEGORIES
                : POST_CATEGORIES.filter((item) => item !== "학생회 공지")
            }
          />
          <label>
            <span className="mb-2 block text-sm font-semibold">제목</span>
            <input
              name="title"
              required
              maxLength={80}
              disabled={saving}
              placeholder="제목을 입력해 주세요"
              defaultValue={editingPost?.title ?? ""}
              className="h-14 w-full rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 text-base font-semibold outline-none placeholder:font-normal placeholder:text-[#aaaab2] focus:border-[#007aff] focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
            />
          </label>
          <div>
            <span className="mb-2 block text-sm font-semibold">내용</span>
            <MarkdownEditor
              name="content"
              rows={12}
              placeholder="내용을 입력해 주세요"
              defaultValue={editingPost?.content ?? ""}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href={returnHref}
              aria-disabled={saving}
              onClick={(event) => {
                if (saving) event.preventDefault();
              }}
              className={`inline-flex h-12 items-center justify-center rounded-full px-6 text-sm font-semibold text-[var(--muted)] hover:bg-[#f2f2f7] ${saving ? "pointer-events-none opacity-40" : ""}`}
            >
              취소
            </Link>
            <button
              disabled={saving || !user}
              className="flex h-12 min-w-28 items-center justify-center rounded-full bg-[#007aff] px-6 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#0674df] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : isEditing ? (
                "수정 완료"
              ) : (
                "게시하기"
              )}
            </button>
          </div>
        </form>
      </main>

      {selectionConfirmation
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-black/10 backdrop-blur-[2px]">
              <div className="selection-success grid size-28 place-items-center rounded-full bg-[#1c1c1e] text-white shadow-2xl shadow-black/30">
                <Check size={54} strokeWidth={2.7} />
                <span className="sr-only">{selectionConfirmation}</span>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function BoardSelect({
  value,
  onChange,
  options,
}: {
  value: PostCategory;
  onChange: (value: PostCategory) => void;
  options: readonly PostCategory[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const detail = boardDetails[value];
  const Icon = detail.icon;
  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2 block text-sm font-semibold">게시판</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 text-left ${open ? "border-[#007aff] bg-white ring-4 ring-blue-500/10" : "border-[var(--border)] bg-[#f5f5f7]"}`}
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${detail.color}`}
        >
          <Icon size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm">{value}</strong>
          <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
            {detail.description}
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`text-[#8e8e93] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="게시판 선택"
          className="ios-pop absolute inset-x-0 top-[calc(100%+.45rem)] z-30 rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl shadow-black/15"
        >
          {options.map((item) => {
            const itemDetail = boardDetails[item];
            const ItemIcon = itemDetail.icon;
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={value === item}
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${value === item ? "bg-[#e5f1ff] text-[#007aff]" : "hover:bg-[#f2f2f7]"}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${itemDetail.color}`}
                >
                  <ItemIcon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{item}</strong>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                    {itemDetail.description}
                  </span>
                </span>
                {value === item && <Check size={17} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
