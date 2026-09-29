"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { PageSkeleton } from "@/components/ui/skeleton";
import { studentProfileSchema } from "@/lib/user-profile";

export function CorrectNamePanel() {
  const { user, profile } = useAuth();
  if (!user || !profile) return <PageSkeleton className="pt-20" />;
  return <CorrectNameForm key={user.uid} initialName={profile.name} getToken={() => user.getIdToken()} />;
}

function CorrectNameForm({ initialName, getToken }: { initialName: string; getToken: () => Promise<string> }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = studentProfileSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "이름을 확인해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/account/correct-name", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
        body: JSON.stringify({ name: parsed.data }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "이름을 저장하지 못했어요.");
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이름을 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f5f5f7] px-5 py-10">
      <div className="w-full max-w-lg">
        <BrandLogo />
        <section className="page-enter mt-6 rounded-[30px] bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.10)] sm:p-9">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#e5f1ff] text-[#007aff]"><UserRound size={27} /></span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight">올바른 이름으로 수정해 주세요</h1>
          <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)]">학교에서 사용하는 실제 이름을 입력해 주세요. 저장하면 이름 때문에 적용된 이용 제한이 해제됩니다.</p>
          <form onSubmit={(event) => void submit(event)} className="mt-7">
            <label htmlFor="correct-name" className="block text-sm font-bold">이름</label>
            <input id="correct-name" name="name" value={name} onChange={(event) => { setName(event.target.value); setSaved(false); setError(""); }} autoComplete="name" minLength={2} maxLength={20} required className="mt-2 h-13 w-full rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 text-base outline-none focus:border-[#007aff]" />
            {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {saved && <p role="status" className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800"><CheckCircle2 size={17} />이름을 저장하고 이용 제한을 해제했어요.</p>}
            <button type="submit" disabled={saving || saved} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#007aff] text-sm font-bold text-white disabled:opacity-50">{saving ? <LoaderCircle size={19} className="animate-spin" /> : "이름 저장하기"}</button>
          </form>
          <Link href="/suspended" className="mt-4 block text-center text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">이용 제한 안내로 돌아가기</Link>
        </section>
      </div>
    </main>
  );
}
