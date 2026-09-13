"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { adminFetch } from "@/lib/admin-fetch";
import type { ContentStatus } from "@/types/domain";

type AdminPost = { id: string; title: string; category: string; authorNickname: string; status: ContentStatus; likeCount: number; commentCount: number; createdAt: string | null };

const statuses: Array<{ value: ContentStatus; label: string }> = [
  { value: "published", label: "공개" },
  { value: "hidden", label: "숨김" },
  { value: "deleted", label: "삭제됨" },
];

export function AdminCommunity() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [message, setMessage] = useState("게시물을 불러오고 있어요.");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/posts").then(async (response) => {
      if (!response.ok) { setMessage(response.status === 423 ? "커뮤니티 관리 비밀번호 인증이 필요해요." : "게시물을 불러오지 못했어요."); return; }
      setPosts((await response.json()).posts); setMessage("");
    }).catch(() => setMessage("게시물을 불러오지 못했어요."));
  }, []);

  async function changeStatus(id: string, status: ContentStatus) {
    setBusy(id);
    const response = await adminFetch(`/api/admin/posts/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    if (response.ok) { setPosts((items) => items.map((item) => item.id === id ? { ...item, status } : item)); setMessage("게시물 상태를 변경했어요."); }
    else setMessage("게시물 상태를 변경하지 못했어요.");
    setBusy("");
  }

  return <><SiteHeader/><main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10"><Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"><ArrowLeft size={16}/>관리자 홈</Link><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#af52de]">커뮤니티 관리</p><h1 className="mt-1 text-3xl font-bold tracking-tight">게시물 관리</h1><p className="mt-2 text-[var(--muted)]">커뮤니티 게시물의 공개 상태를 관리해요.</p></div><span className="hidden size-12 place-items-center rounded-2xl bg-[#f3eafa] text-[#af52de] sm:grid"><MessagesSquare size={24}/></span></div>{message && <p className={`mb-4 rounded-2xl px-4 py-3 text-sm ${message.includes("변경했어요") ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}>{message}</p>}<section className="ios-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#f5f5f7] text-xs text-[var(--muted)]"><tr><th className="p-4">게시물</th><th className="p-4">작성자</th><th className="p-4">반응</th><th className="p-4">상태</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id} className="border-t border-[var(--border)]"><td className="p-4"><div className="flex items-center gap-2"><strong className="max-w-sm truncate">{post.title}</strong><Link href={`/community/${post.id}`} target="_blank" aria-label="게시물 열기" className="text-[#007aff]"><ExternalLink size={14}/></Link></div><p className="mt-1 text-xs text-[var(--muted)]">{post.category} · {formatDate(post.createdAt)}</p></td><td className="p-4 text-sm">{post.authorNickname}</td><td className="p-4 text-sm text-[var(--muted)]">좋아요 {post.likeCount} · 댓글 {post.commentCount}</td><td className="p-4"><select aria-label={`${post.title} 상태`} value={post.status} disabled={busy === post.id} onChange={(event) => void changeStatus(post.id, event.target.value as ContentStatus)} className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-3 py-2 text-sm font-semibold">{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></td></tr>)}</tbody></table>{!posts.length && <div className="grid min-h-60 place-items-center text-sm text-[var(--muted)]">관리할 게시물이 없어요.</div>}</div></section></main></>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value)) : "방금 전";
}
