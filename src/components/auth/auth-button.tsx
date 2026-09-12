"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./auth-provider";

export function AuthButton() {
  const { user, loading, configured, error, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!configured) return <span className="hidden rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] sm:block">오프라인 모드</span>;
  if (!user && !loading) return <Link href="/login" className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6]">로그인</Link>;
  return <div className="flex flex-col items-end gap-1"><button type="button" disabled={loading || busy} onClick={async () => { setBusy(true); try { await signOut(); } finally { setBusy(false); } }} className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6] disabled:opacity-50">{loading || busy ? "확인 중…" : user?.displayName || "내 계정"}</button>{error && <span className="max-w-64 text-right text-xs text-red-600">{error}</span>}</div>;
}
