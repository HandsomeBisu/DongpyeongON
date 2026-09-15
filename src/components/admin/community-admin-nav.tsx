"use client";

import Link from "next/link";
import { FileText, ShieldAlert } from "lucide-react";

const items = [
  { href: "/admin/community", label: "게시물·공지", icon: FileText },
  { href: "/admin/community/reports", label: "신고 처리", icon: ShieldAlert },
];

export function CommunityAdminNav({ active }: { active: string }) {
  return (
    <nav
      aria-label="커뮤니티 관리 카테고리"
      className="mb-7 grid grid-cols-2 rounded-2xl bg-[#e9e9ed] p-1.5"
    >
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold ${active === href ? "bg-white text-[#007aff] shadow-sm" : "text-[var(--muted)]"}`}
        >
          <Icon size={17} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
