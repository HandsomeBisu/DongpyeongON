"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { UserRole } from "@/types/domain";

type UserRow = { uid: string; displayName: string; email: string; role: UserRole };

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("관리자 권한을 확인하고 있어요.");

  useEffect(() => {
    if (!user) return;
    authenticatedFetch(user, "/api/admin/users").then(async (response) => {
      if (!response.ok) { setMessage(response.status === 423 ? "사용자 관리 비밀번호 인증이 필요해요." : response.status === 403 ? "관리자만 접근할 수 있습니다." : "사용자 목록을 불러오지 못했습니다."); return; }
      setUsers((await response.json()).users); setMessage("");
    }).catch(() => setMessage("Firebase Admin 설정을 확인해 주세요."));
  }, [user]);

  async function changeRole(uid: string, role: UserRole) {
    if (!user) return;
    const response = await authenticatedFetch(user, `/api/admin/users/${uid}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    if (response.ok) { setUsers((rows) => rows.map((row) => row.uid === uid ? { ...row, role } : row)); setMessage("역할을 변경했습니다. 대상 사용자는 다시 로그인해야 적용됩니다."); }
    else setMessage("역할을 변경하지 못했습니다.");
  }

  return <><SiteHeader/><main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10"><Link href="/admin" className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"><ArrowLeft size={16}/>관리자 홈</Link><div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[#007aff]">사용자 관리</p><h1 className="mt-1 text-3xl font-bold tracking-tight">사용자 권한 관리</h1><p className="mt-2 text-[var(--muted)]">동평ON 구성원의 역할과 접근 권한을 관리합니다.</p></div><span className="hidden size-12 place-items-center rounded-2xl bg-[#e5f1ff] text-[#007aff] sm:grid"><ShieldCheck size={24}/></span></div><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><section className="ios-card overflow-hidden">{message && <p className="border-b border-[var(--border)] bg-amber-50 px-5 py-4 text-sm text-amber-800">{message}</p>}<div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-[#f5f5f7] text-xs uppercase tracking-wide text-[var(--muted)]"><tr><th className="p-4">이름</th><th className="p-4">이메일</th><th className="p-4">역할</th></tr></thead><tbody>{users.map((row) => <tr key={row.uid} className="border-t border-[var(--border)]"><td className="p-4 font-semibold">{row.displayName}</td><td className="p-4 text-sm text-[var(--muted)]">{row.email}</td><td className="p-4"><select value={row.role} onChange={(event) => void changeRole(row.uid, event.target.value as UserRole)} className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-2 text-sm"><option value="student">학생</option><option value="teacher">교사</option><option value="admin">관리자</option></select></td></tr>)}</tbody></table>{users.length === 0 && <div className="grid min-h-52 place-items-center text-sm text-[var(--muted)]">표시할 사용자가 없어요.</div>}</div></section><aside className="ios-card h-fit p-5"><div className="flex items-center gap-2"><Users size={21}/><h2 className="font-bold">역할 안내</h2></div><div className="mt-4 space-y-4 text-sm"><div><strong>학생</strong><p className="mt-1 text-[var(--muted)]">게시물과 신청 기능을 이용합니다.</p></div><div><strong>교사</strong><p className="mt-1 text-[var(--muted)]">콘텐츠와 신문고를 관리합니다.</p></div><div><strong>관리자</strong><p className="mt-1 text-[var(--muted)]">사용자 권한을 포함해 전체를 관리합니다.</p></div></div></aside></div></main></>;
}
