"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FilePenLine,
  LoaderCircle,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { CommunityAdminNav } from "@/components/admin/community-admin-nav";
import { SiteHeader } from "@/components/site-header";
import { adminFetch } from "@/lib/admin-fetch";

type ReportAction = "delete" | "edit" | "dismiss";
type AdminReport = {
  id: string;
  targetType: "post" | "comment";
  postId: string;
  commentId: string | null;
  targetTitle: string;
  targetContent: string;
  reporterId: string;
  reason: string;
  detail: string;
  status: "pending" | "resolved";
  action: ReportAction | null;
  resolutionReason: string;
  createdAt: string | null;
  resolvedAt: string | null;
};

const actionLabels: Record<ReportAction, string> = {
  delete: "콘텐츠 삭제",
  edit: "내용 강제 수정",
  dismiss: "조치 없이 종결",
};

export function AdminReports() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [view, setView] = useState<"pending" | "resolved">("pending");
  const [selected, setSelected] = useState<AdminReport | null>(null);
  const [action, setAction] = useState<ReportAction>("dismiss");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("신고를 불러오고 있어요.");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/reports");
      const result = (await response.json().catch(() => ({}))) as {
        reports?: AdminReport[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setReports(result.reports ?? []);
      setMessage("");
    } catch (caught) {
      setMessage(
        caught instanceof Error && caught.message
          ? caught.message
          : "신고를 불러오지 못했어요.",
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function start(report: AdminReport, nextAction: ReportAction) {
    setSelected(report);
    setAction(nextAction);
    setContent(report.targetContent);
    setMessage("");
  }

  async function resolve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await adminFetch(`/api/admin/reports/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          content: action === "edit" ? content : undefined,
          resolutionReason: data.get("resolutionReason"),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setSelected(null);
      setView("resolved");
      await load();
      setMessage("신고를 처리하고 신고자에게 결과를 알렸어요.");
    } catch (caught) {
      setMessage(
        caught instanceof Error && caught.message
          ? caught.message
          : "신고를 처리하지 못했어요.",
      );
    } finally {
      setBusy(false);
    }
  }

  const visible = reports.filter((report) => report.status === view);
  const pendingCount = reports.filter((report) => report.status === "pending").length;

  return (
    <>
      <SiteHeader />
      <main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} /> 관리자 홈
        </Link>
        <CommunityAdminNav active="/admin/community/reports" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#ff3b30]">커뮤니티 관리</p>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-3xl">신고 처리</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              신고 내용을 확인하고 조치 사유와 처리 이력을 남겨요.
            </p>
          </div>
          <span className="hidden size-12 place-items-center rounded-2xl bg-red-50 text-red-600 sm:grid">
            <ShieldAlert size={24} />
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#e9e9ed] p-1.5 sm:max-w-sm">
          <button
            type="button"
            onClick={() => setView("pending")}
            className={`h-11 rounded-xl text-sm font-bold ${view === "pending" ? "bg-white text-[#ff3b30] shadow-sm" : "text-[var(--muted)]"}`}
          >
            대기 중 {pendingCount}
          </button>
          <button
            type="button"
            onClick={() => setView("resolved")}
            className={`h-11 rounded-xl text-sm font-bold ${view === "resolved" ? "bg-white text-[#34c759] shadow-sm" : "text-[var(--muted)]"}`}
          >
            처리 완료 {reports.length - pendingCount}
          </button>
        </div>
        {message && (
          <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-[var(--muted)] shadow-sm">
            {message}
          </p>
        )}
        <section className="mt-5 space-y-3">
          {visible.map((report) => (
            <article key={report.id} className="ios-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${report.targetType === "post" ? "bg-[#e9f3ff] text-[#007aff]" : "bg-[#f3eafa] text-[#af52de]"}`}>
                  {report.targetType === "post" ? "게시물" : "댓글"}
                </span>
                <strong>{report.reason}</strong>
                <time className="text-xs text-[var(--muted)]">{formatDate(report.createdAt)}</time>
              </div>
              <h2 className="mt-3 break-words text-lg font-bold">{report.targetTitle}</h2>
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap rounded-2xl bg-[#f5f5f7] p-4 text-sm leading-6 text-[var(--muted)]">
                {report.targetContent}
              </p>
              {report.detail && (
                <p className="mt-3 text-sm leading-6"><strong>신고자 설명:</strong> {report.detail}</p>
              )}
              {report.status === "pending" ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                  <Link
                    href={`/post/${report.postId}`}
                    target="_blank"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-bold"
                  >
                    <ExternalLink size={14} /> 게시물로 이동
                  </Link>
                  <button onClick={() => start(report, "edit")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#edf5ff] px-4 text-xs font-bold text-[#007aff]">
                    <FilePenLine size={14} /> 내용 강제 수정
                  </button>
                  <button onClick={() => start(report, "delete")} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-red-50 px-4 text-xs font-bold text-red-600">
                    <Trash2 size={14} /> {report.targetType === "post" ? "게시물" : "댓글"} 삭제
                  </button>
                  <button onClick={() => start(report, "dismiss")} className="h-10 rounded-full bg-[#f2f2f7] px-4 text-xs font-bold text-[var(--muted)]">
                    조치 없이 종결
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm leading-6 text-green-800">
                  <p className="flex items-center gap-1.5 font-bold"><CheckCircle2 size={16} /> {report.action ? actionLabels[report.action] : "처리 완료"}</p>
                  <p className="mt-1">{report.resolutionReason}</p>
                  <time className="mt-1 block text-xs text-green-700/70">{formatDate(report.resolvedAt)}</time>
                </div>
              )}
            </article>
          ))}
          {!visible.length && !message && (
            <div className="ios-card grid min-h-60 place-items-center text-sm text-[var(--muted)]">
              {view === "pending" ? "대기 중인 신고가 없어요." : "처리된 신고가 없어요."}
            </div>
          )}
        </section>
      </main>
      {selected && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/30 p-5 backdrop-blur-sm">
          <form onSubmit={resolve} className="ios-pop my-auto w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[#ff3b30]">신고 처리</p>
                <h2 className="mt-1 text-xl font-bold">{actionLabels[action]}</h2>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setSelected(null)} className="grid size-9 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)]">
                <X size={17} />
              </button>
            </div>
            {action === "edit" && (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold">강제로 적용할 내용</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  required
                  maxLength={selected.targetType === "post" ? 5000 : 1000}
                  rows={8}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[#f5f5f7] p-4 leading-6 outline-none focus:border-[#007aff]"
                />
              </label>
            )}
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold">처리 사유</span>
              <textarea
                name="resolutionReason"
                required
                minLength={2}
                maxLength={500}
                rows={4}
                placeholder="신고자에게 전달할 처리 사유를 작성해 주세요."
                className="w-full rounded-2xl border border-[var(--border)] bg-[#f5f5f7] p-4 leading-6 outline-none focus:border-[#007aff]"
              />
            </label>
            <button disabled={busy} className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-bold text-white disabled:opacity-50 ${action === "delete" ? "bg-red-600" : "bg-[#007aff]"}`}>
              {busy ? <LoaderCircle size={18} className="animate-spin" /> : "처리 완료"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "방금 전";
}
