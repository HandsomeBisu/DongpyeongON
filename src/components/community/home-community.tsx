"use client";

import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleHelp,
  LoaderCircle,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Plus,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth/auth-provider";
import { MarkdownEditor } from "@/components/community/markdown-editor";
import { markdownToPlainText } from "@/lib/markdown";
import {
  POST_CATEGORIES,
  createPost,
  formatPostDate,
  postInputSchema,
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
};

export function HomeCommunity() {
  const { user, profile, loading: authLoading, configured } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [board, setBoard] = useState<PostCategory>(POST_CATEGORIES[0]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectionConfirmation, setSelectionConfirmation] = useState("");
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!composerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) setComposerOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [composerOpen, saving]);

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
    const form = event.currentTarget;
    const data = new FormData(form);
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
      await createPost(parsed.data, {
        uid: user.uid,
        displayName: profile?.name || user.displayName,
      });
      form.reset();
      setComposerOpen(false);
    } catch {
      setError("게시물을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  const visiblePosts = posts.filter((post) => post.category === board);
  let emptyMessage = "";
  if (!configured) emptyMessage = "커뮤니티 연결 정보를 확인해 주세요.";
  else if (authLoading) emptyMessage = "게시물을 불러오고 있어요.";
  else if (!user) emptyMessage = "로그인하면 동평의 이야기를 볼 수 있어요.";
  else if (loadedFor !== user.uid) emptyMessage = "게시물을 불러오고 있어요.";
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

        {error && !composerOpen && (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="ios-card overflow-hidden">
          {emptyMessage ? (
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
                  href={`/community/${post.id}`}
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
                        <span className="font-semibold text-[var(--foreground)]">
                          {post.authorNickname}
                        </span>
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

      {user ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setComposerOpen(true);
          }}
          aria-label="새 게시물 작성"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-[60] grid size-14 place-items-center rounded-full bg-[#007aff] text-white shadow-xl shadow-blue-500/30 transition hover:scale-105 hover:bg-[#0674df] md:bottom-7 md:right-7"
        >
          <Plus size={27} strokeWidth={2.5} />
        </button>
      ) : (
        <Link
          href="/login"
          aria-label="로그인하고 새 게시물 작성"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-[60] grid size-14 place-items-center rounded-full bg-[#007aff] text-white shadow-xl shadow-blue-500/30 transition hover:scale-105 md:bottom-7 md:right-7"
        >
          <Plus size={27} strokeWidth={2.5} />
        </Link>
      )}

      {composerOpen && user
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] grid place-items-start overflow-y-auto bg-black/30 p-4 backdrop-blur-sm sm:place-items-center sm:p-6"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !saving)
                  setComposerOpen(false);
              }}
            >
              <form
                onSubmit={submit}
                className="ios-pop w-full max-w-2xl rounded-[28px] bg-white p-5 shadow-2xl sm:my-auto sm:p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#007aff]">
                      새 글
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-[-.03em]">
                      이야기를 나눠보세요.
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label="닫기"
                    disabled={saving}
                    onClick={() => setComposerOpen(false)}
                    className="grid size-9 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)] hover:bg-[#e5e5ea] disabled:opacity-40"
                  >
                    <X size={17} />
                  </button>
                </div>
                <div className="mt-6 grid gap-4">
                  <BoardSelect value={board} onChange={selectBoard} />
                  <input
                    name="title"
                    required
                    maxLength={80}
                    placeholder="제목"
                    className="h-14 rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 text-base font-semibold outline-none focus:border-[#007aff] focus:ring-4 focus:ring-blue-500/10"
                  />
                  <MarkdownEditor
                    name="content"
                    rows={9}
                    placeholder="내용을 입력하세요."
                  />
                </div>
                {error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setComposerOpen(false)}
                    className="h-11 rounded-full px-5 text-sm font-semibold text-[var(--muted)] hover:bg-[#f2f2f7] disabled:opacity-40"
                  >
                    취소
                  </button>
                  <button
                    disabled={saving}
                    className="flex h-11 min-w-24 items-center justify-center rounded-full bg-[#007aff] px-5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#0674df] disabled:opacity-50"
                  >
                    {saving ? (
                      <LoaderCircle size={18} className="animate-spin" />
                    ) : (
                      "게시하기"
                    )}
                  </button>
                </div>
              </form>
            </div>,
            document.body,
          )
        : null}

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
}: {
  value: PostCategory;
  onChange: (value: PostCategory) => void;
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
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 text-left transition ${open ? "border-[#007aff] bg-white ring-4 ring-blue-500/10" : "border-[var(--border)] bg-[#f5f5f7]"}`}
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
          {POST_CATEGORIES.map((item) => {
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
