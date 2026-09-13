"use client";

import { Check, ChevronDown, LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/user-profile";

type Draft = {
  name: string;
  grade: number | null;
  classNumber: number | null;
  studentNumber: number | null;
};

type StudentProfileFormProps = {
  initialValue?: Partial<StudentProfileInput>;
  submitLabel: string;
  onSubmit: (value: StudentProfileInput) => Promise<void>;
};

export function StudentProfileForm({ initialValue, submitLabel, onSubmit }: StudentProfileFormProps) {
  const [draft, setDraft] = useState<Draft>({
    name: initialValue?.name ?? "",
    grade: initialValue?.grade ?? null,
    classNumber: initialValue?.classNumber ?? null,
    studentNumber: initialValue?.studentNumber ?? null,
  });
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
  }, []);

  function confirmSelection(message: string) {
    setConfirmation(message);
    if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
    confirmationTimer.current = setTimeout(() => setConfirmation(""), 680);
  }

  function choose(field: "grade" | "classNumber" | "studentNumber", value: number, suffix: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
    confirmSelection(`${value}${suffix} 선택됨`);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.grade === null || draft.classNumber === null || draft.studentNumber === null) {
      setError("학년, 반, 번호를 모두 선택해 주세요.");
      return;
    }
    const parsed = studentProfileSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "학생 정보를 모두 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(parsed.data);
    } catch {
      setError("학생 정보를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">이름</span>
          <span className="flex h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 focus-within:border-[#007aff] focus-within:ring-4 focus-within:ring-blue-500/10">
            <UserRound size={18} className="text-[#8e8e93]" />
            <input
              value={draft.name}
              onChange={(event) => { setDraft((current) => ({ ...current, name: event.target.value })); setError(""); }}
              required
              minLength={2}
              maxLength={20}
              autoComplete="name"
              placeholder="학교에서 사용하는 이름"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#aaaab2]"
            />
          </span>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PrettySelect label="학년" value={draft.grade} suffix="학년" options={[1, 2, 3]} onChange={(value) => choose("grade", value, "학년")} />
          <PrettySelect label="반" value={draft.classNumber} suffix="반" options={[1, 2, 3, 4, 5, 6]} onChange={(value) => choose("classNumber", value, "반")} />
          <PrettySelect label="번호" value={draft.studentNumber} suffix="번" options={Array.from({ length: 30 }, (_, index) => index + 1)} onChange={(value) => choose("studentNumber", value, "번")} />
        </div>

        {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-center text-xs leading-5 text-red-700">{error}</p>}

        <button
          disabled={saving}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#007aff] text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01] hover:bg-[#0066d6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <LoaderCircle className="size-5 animate-spin" /> : submitLabel}
        </button>
      </form>

      {confirmation ? createPortal(
        <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-black/10 backdrop-blur-[2px]">
          <div className="selection-success grid size-28 place-items-center rounded-full bg-[#1c1c1e] text-white shadow-2xl shadow-black/30">
            <Check size={54} strokeWidth={2.7} />
            <span className="sr-only">{confirmation}</span>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}

function PrettySelect({ label, value, suffix, options, onChange }: { label: string; value: number | null; suffix: string; options: number[]; onChange: (value: number) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left text-sm font-semibold ${open ? "border-[#007aff] bg-white ring-4 ring-blue-500/10" : "border-[var(--border)] bg-[#f5f5f7]"}`}
      >
        <span className={value === null ? "text-[#9a9aa0]" : "text-[var(--foreground)]"}>{value === null ? "선택" : `${value}${suffix}`}</span>
        <ChevronDown size={17} className={`text-[#8e8e93] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div role="listbox" aria-label={`${label} 선택`} className="ios-pop absolute inset-x-0 top-[calc(100%+.45rem)] z-30 max-h-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-2xl shadow-black/15">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={() => { onChange(option); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium ${value === option ? "bg-[#e5f1ff] text-[#007aff]" : "hover:bg-[#f2f2f7]"}`}
            >
              {option}{suffix}
              {value === option && <Check size={16} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
