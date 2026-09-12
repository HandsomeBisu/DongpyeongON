"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { MessageCircle, PenLine, Search } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { POST_CATEGORIES, createPost, formatPostDate, postInputSchema, subscribeToPosts, type CommunityPost } from "@/lib/posts";

export function CommunityBoard() {
  const { user, loading: authLoading, configured } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!configured || !user) return;
    return subscribeToPosts((items) => { setPosts(items); setLoadedFor(user.uid); setError(null); }, () => { setError("게시물을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."); setLoadedFor(user.uid); });
  }, [configured, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!user) return;
    const form = event.currentTarget; const data = new FormData(form);
    const parsed = postInputSchema.safeParse({ title: data.get("title"), content: data.get("content"), category: data.get("category") });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "입력 내용을 확인해 주세요.");
    setSaving(true);
    try { await createPost(parsed.data, user); form.reset(); setOpen(false); }
    catch { setError("게시물을 등록하지 못했어요."); }
    finally { setSaving(false); }
  }

  let state = "";
  if (!configured) state = "Firebase를 연결하면 새로운 이야기를 만나볼 수 있어요.";
  else if (authLoading) state = "내 커뮤니티를 불러오는 중이에요.";
  else if (!user) state = "로그인하고 동평의 이야기에 참여해 보세요.";
  else if (loadedFor !== user.uid) state = "새로운 이야기를 불러오는 중이에요.";
  else if (!posts.length) state = "아직 게시물이 없어요. 첫 이야기를 들려주세요.";

  return <><SiteHeader active="/community"/><main className="page-enter mx-auto max-w-6xl px-5 py-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#007aff]">동평 커뮤니티</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">우리들의 이야기</h1><p className="mt-2 text-[var(--muted)]">학교생활의 소식과 생각을 자유롭게 나눠요.</p></div>{user && <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-full bg-[#007aff] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/15 hover:scale-[1.03]"><PenLine size={16}/>{open ? "작성 취소" : "글쓰기"}</button>}</div>

  <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_280px]"><section>{open && user && <form onSubmit={submit} className="ios-card mb-5 grid gap-4 p-5 sm:p-6"><div className="flex items-center gap-2 text-lg font-bold"><span className="grid size-9 place-items-center rounded-[11px] bg-[#007aff] text-white"><PenLine size={18}/></span>새 게시물</div><select name="category" className="rounded-xl border border-[var(--border)] bg-[#f2f2f7] p-3 outline-none focus:border-[#007aff]">{POST_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><input name="title" required maxLength={80} placeholder="제목을 입력하세요" className="rounded-xl border border-[var(--border)] bg-[#f2f2f7] p-3 outline-none focus:border-[#007aff]"/><textarea name="content" required minLength={5} maxLength={5000} rows={7} placeholder="무슨 이야기를 나누고 싶나요?" className="rounded-xl border border-[var(--border)] bg-[#f2f2f7] p-3 outline-none focus:border-[#007aff]"/><button disabled={saving} className="justify-self-end rounded-full bg-[#007aff] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "게시 중…" : "게시하기"}</button></form>}{error && <p className="mb-5 rounded-2xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}{state ? <div className="ios-card grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-[#e5f1ff] text-[#007aff]"><MessageCircle size={26}/></span><p className="mt-4 text-[var(--muted)]">{state}</p></div></div> : <div className="space-y-3">{posts.map((post) => <Link key={post.id} href={`/community/${post.id}`} className="ios-card ios-card-interactive stagger-item block p-5"><div className="flex items-center gap-2 text-xs text-[var(--muted)]"><span className="rounded-full bg-[#e5f1ff] px-2.5 py-1 font-medium text-[#007aff]">{post.category}</span><span>{post.authorNickname}</span><span>·</span><time>{formatPostDate(post.createdAt)}</time></div><h2 className="mt-3 text-lg font-bold">{post.title}</h2><p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">{post.content}</p><div className="mt-4 text-xs text-[var(--muted)]">댓글 {post.commentCount} · 좋아요 {post.likeCount}</div></Link>)}</div>}</section>

  <aside className="space-y-4"><div className="ios-card p-4"><div className="flex items-center gap-2 rounded-xl bg-[#f2f2f7] px-3 py-2.5 text-sm text-[var(--muted)]"><Search size={16}/>게시물 검색</div></div><div className="ios-card overflow-hidden"><h2 className="border-b border-[var(--border)] px-4 py-3 text-sm font-bold">게시판</h2>{POST_CATEGORIES.map((item,index) => <div key={item} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-sm last:border-0"><span className={`size-2 rounded-full ${["bg-[#007aff]","bg-[#34c759]","bg-[#ff9f0a]","bg-[#af52de]"][index]}`}/>{item}</div>)}</div><div className="ios-card p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--foreground)]">함께 지켜요</strong><p className="mt-2">따뜻한 말 한마디가 더 좋은 커뮤니티를 만들어요.</p></div></aside></div></main></>;
}
