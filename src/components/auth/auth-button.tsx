"use client";
import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "./auth-provider";

export function AuthButton() {
  const { user, profile, loading, configured, error, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!configured) return <span className="hidden rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] sm:block">오프라인 모드</span>;
  if (!user && !loading) return <Link href="/login" className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6]">로그인</Link>;
  return <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-1"><Link href="/mypage" className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6]">{loading ? "확인 중…" : profile?.name || user?.displayName || "내 계정"}</Link><button type="button" aria-label="로그아웃" title="로그아웃" disabled={loading || busy} onClick={async () => { setBusy(true); try { await signOut(); } finally { setBusy(false); } }} className="grid size-9 place-items-center rounded-full text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] disabled:opacity-50"><LogOut size={16}/></button></div>{error && <span className="max-w-64 text-right text-xs text-red-600">{error}</span>}</div>;
}
