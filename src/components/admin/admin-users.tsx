"use client";

import Link from "next/link";
import { ArrowLeft, Ban, Clock3, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { VerifiedName } from "@/components/verified-name";
import { adminFetch } from "@/lib/admin-fetch";
import type { UserRole } from "@/types/domain";
import type { AccountSuspension } from "@/lib/account-suspension";

type UserRow = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  suspension: AccountSuspension | null;
  verified: boolean;
};

function localDateTimeValue(time: number) {
  const date = new Date(time);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function formatDateTime(time: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(time);
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [suspensionTarget, setSuspensionTarget] = useState<UserRow | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [suspensionReferenceTime, setSuspensionReferenceTime] = useState(0);
  const [savingSuspension, setSavingSuspension] = useState(false);
  const [suspensionError, setSuspensionError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/users")
      .then(async (response) => {
        if (!response.ok) {
          setMessage(
            response.status === 423
              ? "사용자 관리 비밀번호 인증이 필요해요."
              : "사용자 목록을 불러오지 못했습니다.",
          );
          return;
        }
        setUsers((await response.json()).users);
        setMessage("");
      })
      .catch(() => setMessage("Firebase Admin 설정을 확인해 주세요."))
      .finally(() => setLoading(false));
  }, []);

  async function changeRole(uid: string, role: UserRole) {
    const response = await adminFetch(`/api/admin/users/${uid}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (response.ok) {
      setUsers((rows) =>
        rows.map((row) => (row.uid === uid ? { ...row, role } : row)),
      );
      setMessage(
        "역할을 변경했습니다. 대상 사용자는 다시 로그인해야 적용됩니다.",
      );
    } else setMessage("역할을 변경하지 못했습니다.");
  }

  async function changeVerification(uid: string, verified: boolean) {
    const response = await adminFetch(`/api/admin/users/${uid}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ verified }),
    });
    if (response.ok) {
      setUsers((rows) =>
        rows.map((row) => (row.uid === uid ? { ...row, verified } : row)),
      );
      setMessage(
        verified ? "인증 마크를 부여했습니다." : "인증 마크를 회수했습니다.",
      );
    } else setMessage("인증 마크 설정을 변경하지 못했습니다.");
  }

  function openSuspension(row: UserRow) {
    const openedAt = Date.now();
    setSuspensionTarget(row);
    setSuspensionReferenceTime(openedAt);
    setReason(row.suspension?.reason ?? "");
    setSuspensionError("");
    setEndsAt(
      localDateTimeValue(row.suspension?.endsAt ?? openedAt + 86_400_000),
    );
    setMessage("");
  }

  function setQuickDuration(milliseconds: number) {
    setEndsAt(localDateTimeValue(suspensionReferenceTime + milliseconds));
  }

  async function saveSuspension() {
    if (!suspensionTarget) return;
    const end = new Date(endsAt);
    if (reason.trim().length < 2) {
      setSuspensionError("이용 정지 사유를 2자 이상 입력해 주세요.");
      return;
    }
    if (!endsAt || end.getTime() <= Date.now()) {
      setSuspensionError("현재보다 이후인 정지 종료 시간을 선택해 주세요.");
      return;
    }
    setSuspensionError("");
    setSavingSuspension(true);
    try {
      const response = await adminFetch(
        `/api/admin/users/${suspensionTarget.uid}/suspension`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action: "suspend",
            reason: reason.trim(),
            endsAt: end.toISOString(),
          }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        suspension?: AccountSuspension;
      };
      if (!response.ok || !payload.suspension)
        throw new Error(
          payload.error || "계정 이용 정지를 적용하지 못했습니다.",
        );
      setUsers((rows) =>
        rows.map((row) =>
          row.uid === suspensionTarget.uid
            ? { ...row, suspension: payload.suspension ?? null }
            : row,
        ),
      );
      setMessage(
        suspensionTarget.suspension
          ? `${suspensionTarget.displayName}님의 정지 내용을 변경했습니다.`
          : `${suspensionTarget.displayName}님의 계정 이용을 정지했습니다.`,
      );
      setSuspensionTarget(null);
    } catch (caught) {
      setSuspensionError(
        caught instanceof Error && caught.message
          ? caught.message
          : "계정 이용 정지를 적용하지 못했습니다.",
      );
    } finally {
      setSavingSuspension(false);
    }
  }

  async function releaseSuspension() {
    if (!suspensionTarget) return;
    setSuspensionError("");
    setSavingSuspension(true);
    try {
      const response = await adminFetch(
        `/api/admin/users/${suspensionTarget.uid}/suspension`,
        { method: "DELETE" },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "이용 정지를 해제하지 못했습니다.");
      setUsers((rows) =>
        rows.map((row) =>
          row.uid === suspensionTarget.uid ? { ...row, suspension: null } : row,
        ),
      );
      setMessage(
        `${suspensionTarget.displayName}님의 이용 정지를 해제했습니다.`,
      );
      setSuspensionTarget(null);
    } catch (caught) {
      setSuspensionError(
        caught instanceof Error && caught.message
          ? caught.message
          : "이용 정지를 해제하지 못했습니다.",
      );
    } finally {
      setSavingSuspension(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-enter mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"
        >
          <ArrowLeft size={16} />
          관리자 홈
        </Link>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#007aff]">사용자 관리</p>
            <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-3xl">
              사용자 권한 관리
            </h1>
            <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)] sm:text-base">
              DongpyeongON 구성원의 역할과 접근 권한을 관리합니다.
            </p>
          </div>
          <span className="hidden size-12 place-items-center rounded-2xl bg-[#e5f1ff] text-[#007aff] sm:grid">
            <ShieldCheck size={24} />
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="ios-card overflow-hidden">
            {message && (
              <p className="border-b border-[var(--border)] bg-amber-50 px-5 py-4 text-sm text-amber-800">
                {message}
              </p>
            )}
            {loading ? (
              <TableSkeleton rows={5} />
            ) : (
              <>
                <div className="divide-y divide-[var(--border)] md:hidden">
                  {users.map((row) => (
                    <article key={row.uid} className="p-5">
                      <strong className="block">
                        <VerifiedName
                          name={row.displayName}
                          verified={row.verified}
                        />
                      </strong>
                      <p className="mt-1 break-all text-sm leading-5 text-[var(--muted)]">
                        {row.email}
                      </p>
                      <label className="mt-4 flex items-center justify-between gap-4 text-sm font-semibold">
                        역할
                        <select
                          value={row.role}
                          onChange={(event) =>
                            void changeRole(
                              row.uid,
                              event.target.value as UserRole,
                            )
                          }
                          className="h-11 min-w-28 rounded-xl border border-[var(--border)] bg-[#f5f5f7] px-3 text-sm"
                        >
                          <option value="general">일반</option>
                          <option value="student_council">학생회</option>
                          <option value="admin">관리자</option>
                        </select>
                      </label>
                      <div className="mt-3 flex items-center justify-between gap-4 text-sm font-semibold">
                        인증 마크
                        <button
                          type="button"
                          aria-pressed={row.verified}
                          onClick={() =>
                            void changeVerification(row.uid, !row.verified)
                          }
                          className={`h-10 rounded-xl px-3 text-xs font-bold transition active:scale-95 ${row.verified ? "bg-[#e5f1ff] text-[#007aff]" : "bg-[#f5f5f7] text-[var(--muted)]"}`}
                        >
                          {row.verified ? "부여됨 · 회수" : "인증 마크 부여"}
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                        <span
                          className={`text-xs font-bold ${row.suspension ? "text-[#ff3b30]" : "text-[var(--muted)]"}`}
                        >
                          {row.suspension
                            ? `${formatDateTime(row.suspension.endsAt)}까지 정지`
                            : "이용 가능"}
                        </span>
                        <button
                          type="button"
                          onClick={() => openSuspension(row)}
                          className="rounded-xl bg-[#f5f5f7] px-3 py-2 text-xs font-bold transition active:scale-95"
                        >
                          정지 관리
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="bg-[#f5f5f7] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <tr>
                        <th className="p-4">이름</th>
                        <th className="p-4">이메일</th>
                        <th className="p-4">역할</th>
                        <th className="p-4">인증</th>
                        <th className="p-4">계정 상태</th>
                        <th className="p-4 text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((row) => (
                        <tr
                          key={row.uid}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="p-4 font-semibold">
                            <VerifiedName
                              name={row.displayName}
                              verified={row.verified}
                            />
                          </td>
                          <td className="p-4 text-sm text-[var(--muted)]">
                            {row.email}
                          </td>
                          <td className="p-4">
                            <select
                              value={row.role}
                              onChange={(event) =>
                                void changeRole(
                                  row.uid,
                                  event.target.value as UserRole,
                                )
                              }
                              className="rounded-xl border border-[var(--border)] bg-[#f5f5f7] p-2 text-sm"
                            >
                              <option value="general">일반</option>
                              <option value="student_council">학생회</option>
                              <option value="admin">관리자</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              aria-pressed={row.verified}
                              onClick={() =>
                                void changeVerification(row.uid, !row.verified)
                              }
                              className={`rounded-xl px-3 py-2 text-xs font-bold transition active:scale-95 ${row.verified ? "bg-[#e5f1ff] text-[#007aff]" : "bg-[#f5f5f7] text-[var(--muted)]"}`}
                            >
                              {row.verified ? "회수" : "부여"}
                            </button>
                          </td>
                          <td className="p-4 text-sm">
                            {row.suspension ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-bold text-[#ff3b30]">
                                <Ban size={14} /> 이용 정지
                              </span>
                            ) : (
                              <span className="text-[var(--muted)]">
                                이용 가능
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => openSuspension(row)}
                              className="rounded-xl bg-[#f5f5f7] px-3 py-2 text-sm font-bold transition hover:bg-[#e8e8ed] active:scale-95"
                            >
                              정지 관리
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && !message && (
                  <div className="grid min-h-52 place-items-center px-5 text-center text-sm text-[var(--muted)]">
                    표시할 사용자가 없어요.
                  </div>
                )}
              </>
            )}
          </section>
          <aside className="ios-card h-fit p-5">
            <div className="flex items-center gap-2">
              <Users size={21} />
              <h2 className="font-bold">역할 안내</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <strong>일반</strong>
                <p className="mt-1 text-[var(--muted)]">
                  게시물과 신청 기능을 이용합니다.
                </p>
              </div>
              <div>
                <strong>학생회</strong>
                <p className="mt-1 text-[var(--muted)]">
                  학생회 공지를 작성하고 일반 기능을 이용합니다.
                </p>
              </div>
              <div>
                <strong>관리자</strong>
                <p className="mt-1 text-[var(--muted)]">
                  사용자 권한을 포함해 전체를 관리합니다.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {suspensionTarget && (
        <div
          className="fixed inset-0 z-[130] grid place-items-center overflow-y-auto bg-black/35 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspension-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingSuspension)
              setSuspensionTarget(null);
          }}
        >
          <section className="page-enter my-auto w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#ff3b30]">
                  계정 이용 정지
                </p>
                <h2
                  id="suspension-title"
                  className="mt-1 text-2xl font-bold tracking-tight"
                >
                  <VerifiedName
                    name={suspensionTarget.displayName}
                    verified={suspensionTarget.verified}
                  />
                </h2>
                <p className="mt-1 break-all text-sm text-[var(--muted)]">
                  {suspensionTarget.email}
                </p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                disabled={savingSuspension}
                onClick={() => setSuspensionTarget(null)}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-[var(--muted)]"
              >
                <X size={18} />
              </button>
            </div>

            {suspensionTarget.suspension && (
              <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                <strong className="flex items-center gap-2">
                  <Ban size={16} /> 현재 이용이 정지되어 있습니다.
                </strong>
                <p className="mt-1.5 leading-5">
                  {formatDateTime(suspensionTarget.suspension.endsAt)}까지
                </p>
              </div>
            )}

            <label
              className="mt-6 block text-sm font-bold"
              htmlFor="suspension-reason"
            >
              정지 사유
            </label>
            <textarea
              id="suspension-reason"
              value={reason}
              maxLength={500}
              rows={4}
              onChange={(event) => setReason(event.target.value)}
              placeholder="사용자에게 표시할 구체적인 사유를 입력해 주세요."
              className="mt-2 w-full resize-none rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#007aff] focus:bg-white"
            />

            <div className="mt-5 flex items-center gap-2 text-sm font-bold">
              <Clock3 size={17} /> 빠른 기간 선택
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                ["1시간", 3_600_000],
                ["1일", 86_400_000],
                ["3일", 259_200_000],
                ["7일", 604_800_000],
                ["30일", 2_592_000_000],
              ].map(([label, duration]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setQuickDuration(duration as number)}
                  className="rounded-xl bg-[#f2f2f7] px-2 py-2.5 text-xs font-bold transition hover:bg-[#e5f1ff] hover:text-[#007aff] active:scale-95"
                >
                  {label}
                </button>
              ))}
            </div>

            <label
              className="mt-5 block text-sm font-bold"
              htmlFor="suspension-end"
            >
              종료 일시 직접 선택
            </label>
            <input
              id="suspension-end"
              type="datetime-local"
              value={endsAt}
              min={localDateTimeValue(suspensionReferenceTime + 60_000)}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-2 h-12 w-full rounded-2xl border border-[var(--border)] bg-[#f5f5f7] px-4 text-sm font-semibold outline-none focus:border-[#007aff] focus:bg-white"
            />

            {suspensionError && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {suspensionError}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row">
              {suspensionTarget.suspension && (
                <button
                  type="button"
                  disabled={savingSuspension}
                  onClick={() => void releaseSuspension()}
                  className="h-12 flex-1 rounded-2xl border border-[#ff3b30]/25 bg-red-50 text-sm font-bold text-[#ff3b30] transition active:scale-[0.98] disabled:opacity-50"
                >
                  정지 해제
                </button>
              )}
              <button
                type="button"
                disabled={savingSuspension}
                onClick={() => void saveSuspension()}
                className="h-12 flex-1 rounded-2xl bg-[#1d1d1f] text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {savingSuspension
                  ? "처리 중..."
                  : suspensionTarget.suspension
                    ? "정지 내용 변경"
                    : "이용 정지 적용"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
