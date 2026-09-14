"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  Bold,
  Code2,
  Eye,
  Italic,
  Link2,
  PenLine,
  Strikethrough,
  Underline,
} from "lucide-react";
import { MarkdownContent } from "@/components/community/markdown-content";

type Selection = {
  start: number;
  end: number;
  left: number;
  top: number;
};

type MarkdownEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
};

const formats = [
  { label: "굵게", icon: Bold, before: "**", after: "**" },
  { label: "기울임", icon: Italic, before: "*", after: "*" },
  { label: "밑줄", icon: Underline, before: "<u>", after: "</u>" },
  { label: "취소선", icon: Strikethrough, before: "~~", after: "~~" },
  { label: "인라인 코드", icon: Code2, before: "`", after: "`" },
] as const;

export function MarkdownEditor({
  name,
  defaultValue = "",
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = editorRef.current?.form;
    if (!form) return;
    const reset = () => {
      setValue(defaultValue);
      setSelection(null);
      setPreview(false);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue]);

  function showSelection(clientX?: number, clientY?: number) {
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      const container = containerRef.current;
      if (
        !editor ||
        !container ||
        editor.selectionStart === editor.selectionEnd
      ) {
        setSelection(null);
        return;
      }

      const bounds = container.getBoundingClientRect();
      const left =
        clientX === undefined
          ? bounds.width / 2
          : Math.min(Math.max(clientX - bounds.left, 130), bounds.width - 130);
      const top =
        clientY === undefined ? 12 : Math.max(clientY - bounds.top - 52, 12);

      setSelection({
        start: editor.selectionStart,
        end: editor.selectionEnd,
        left,
        top,
      });
    });
  }

  function handleMouseUp(event: ReactMouseEvent<HTMLTextAreaElement>) {
    showSelection(event.clientX, event.clientY);
  }

  function applyFormat(before: string, after: string) {
    if (!selection) return;
    const selectedText = value.slice(selection.start, selection.end);
    const nextValue = `${value.slice(0, selection.start)}${before}${selectedText}${after}${value.slice(selection.end)}`;
    const nextStart = selection.start + before.length;

    setValue(nextValue);
    setSelection(null);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(
        nextStart,
        nextStart + selectedText.length,
      );
    });
  }

  function applyLink() {
    if (!selection) return;
    const selectedText = value.slice(selection.start, selection.end);
    const replacement = `[${selectedText}](https://)`;
    const nextValue = `${value.slice(0, selection.start)}${replacement}${value.slice(selection.end)}`;
    const urlStart = selection.start + selectedText.length + 3;

    setValue(nextValue);
    setSelection(null);
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(urlStart, urlStart + 8);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[#f5f5f7] focus-within:border-[#007aff] focus-within:ring-4 focus-within:ring-blue-500/10">
      <div className="flex justify-end bg-white/75 px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setPreview((current) => !current);
            setSelection(null);
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]"
        >
          {preview ? <PenLine size={14} /> : <Eye size={14} />}
          {preview ? "계속 쓰기" : "미리보기"}
        </button>
      </div>

      <div ref={containerRef} className="relative">
        {preview ? (
          <div className="min-h-64 bg-white p-4 sm:p-5">
            {value.trim() ? (
              <MarkdownContent content={value} />
            ) : (
              <p className="text-sm text-[var(--muted)]">
                미리 볼 내용이 없어요.
              </p>
            )}
            <textarea name={name} value={value} readOnly hidden />
          </div>
        ) : (
          <textarea
            ref={editorRef}
            name={name}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setSelection(null);
            }}
            onMouseUp={handleMouseUp}
            onKeyUp={(event) => {
              if (event.shiftKey) showSelection();
            }}
            onTouchEnd={() => showSelection()}
            onBlur={(event) => {
              if (
                !event.currentTarget.parentElement?.contains(
                  event.relatedTarget,
                )
              )
                setSelection(null);
            }}
            required
            minLength={5}
            maxLength={5000}
            rows={rows}
            placeholder={placeholder}
            className="block w-full resize-y bg-transparent p-4 font-[inherit] leading-7 outline-none placeholder:text-[#8e8e93] sm:p-5"
          />
        )}

        {selection && !preview && (
          <div
            role="toolbar"
            aria-label="선택한 텍스트 서식"
            className="ios-pop absolute z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-[13px] bg-[#1c1c1e] p-1.5 text-white shadow-2xl shadow-black/25"
            style={{ left: selection.left, top: selection.top }}
            onMouseDown={(event) => event.preventDefault()}
          >
            {formats.map(({ label, icon: Icon, before, after }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => applyFormat(before, after)}
                className="grid size-8 place-items-center rounded-[9px] hover:bg-white/15"
              >
                <Icon size={16} strokeWidth={2.2} />
              </button>
            ))}
            <span className="mx-0.5 h-5 w-px bg-white/20" />
            <button
              type="button"
              aria-label="링크"
              title="링크"
              onClick={applyLink}
              className="grid size-8 place-items-center rounded-[9px] hover:bg-white/15"
            >
              <Link2 size={16} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
