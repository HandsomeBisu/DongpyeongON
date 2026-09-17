"use client";
import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedName } from "@/components/verified-name";
import { useAuth } from "./auth-provider";

export function AuthButton() {
  const { user, profile, loading, configured, error, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!configured)
    return (
      <span className="hidden rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] sm:block">
        오프라인 모드
      </span>
    );
  if (!user && !loading)
    return (
      <Link
        href="/login"
        className="rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6]"
      >
        로그인
      </Link>
    );
  if (loading)
    return (
      <span role="status" aria-label="계정 정보 로딩 중">
        <Skeleton className="h-9 w-24 rounded-full" />
      </span>
    );
  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        <Link
          href="/mypage"
          className="max-w-28 rounded-full bg-[#007aff] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:scale-[1.03] hover:bg-[#0066d6] sm:max-w-40 sm:px-4"
        >
          <VerifiedName
            name={profile?.name || user?.displayName || "내 계정"}
            userId={user?.uid}
          />
        </Link>
        <button
          type="button"
          aria-label="로그아웃"
          title="로그아웃"
          disabled={loading || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await signOut();
            } finally {
              setBusy(false);
            }
          }}
          className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] disabled:opacity-50"
        >
          <LogOut size={16} />
        </button>
      </div>
      {error && (
        <span className="max-w-64 text-right text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
