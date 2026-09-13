import Link from "next/link";
import { ArrowLeft, Clock3, MessagesSquare } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { COMMUNITY_ENABLED } from "@/lib/community-availability";

export default function CommunityLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (COMMUNITY_ENABLED) return children;

  return <><SiteHeader active="/community"/><main className="page-enter mx-auto min-h-[calc(100vh-74px)] max-w-4xl px-5 py-8 sm:px-8 sm:py-12"><Link href="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-black/5"><ArrowLeft size={16}/>홈으로 돌아가기</Link><section className="ios-card mt-6 overflow-hidden p-6 text-center sm:p-10"><span className="mx-auto grid size-16 place-items-center rounded-[22px] bg-[#e5f1ff] text-[#007aff] shadow-sm"><MessagesSquare size={30}/></span><p className="mt-6 text-xs font-bold tracking-[.14em] text-[#007aff]">COMMUNITY PAUSED</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">커뮤니티가 잠시 쉬어가고 있어요.</h1><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">더 안정적인 커뮤니티를 준비하고 있습니다.<br className="hidden sm:block"/> 이용이 다시 시작되면 이곳에서 안내해 드릴게요.</p><div className="mx-auto mt-7 flex max-w-xl items-start gap-3 rounded-2xl bg-[#f2f2f7] p-4 text-left"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#8e8e93] shadow-sm"><Clock3 size={18}/></span><div><strong className="text-sm">현재 이용할 수 없는 기능</strong><p className="mt-1 text-xs leading-5 text-[var(--muted)]">게시물 열람 및 작성, 댓글, 좋아요 기능을 잠시 사용할 수 없습니다.</p></div></div></section></main></>;
}
