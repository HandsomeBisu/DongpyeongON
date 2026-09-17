import type { Metadata } from "next";
import { HomeCommunity } from "@/components/community/home-community";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "전체 게시물 | DongpyeongON",
  description: "동평중학교 커뮤니티의 전체 게시물을 확인하세요.",
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <SiteHeader active="/community" />
      <main className="page-enter mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <HomeCommunity />
      </main>
    </div>
  );
}
