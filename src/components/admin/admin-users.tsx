"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { adminFetch } from "@/lib/admin-fetch";
import type { UserRole } from "@/types/domain";

type UserRow = {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
                      <strong className="block">{row.displayName}</strong>
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
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((row) => (
                        <tr
                          key={row.uid}
                          className="border-t border-[var(--border)]"
                        >
                          <td className="p-4 font-semibold">
                            {row.displayName}
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
    </>
  );
}
