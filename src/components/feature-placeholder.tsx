import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Construction,
  Megaphone,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function FeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const active = title.includes("신문고") ? "/suggestions" : "/music";
  return (
    <>
      <SiteHeader active={active} />
      <main className="page-enter mx-auto max-w-6xl px-5 py-7 sm:py-10">
        <div className="mb-6">
          <p className="text-sm font-semibold text-[#007aff]">동평ON 서비스</p>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.035em] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 break-keep text-sm leading-6 text-[var(--muted)] sm:text-base">
            {description}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="ios-card grid min-h-[360px] place-items-center p-6 text-center sm:min-h-[430px] sm:p-8">
            <div>
              <span className="ios-pop mx-auto grid size-16 place-items-center rounded-[20px] bg-[#007aff] text-white shadow-lg shadow-blue-500/20">
                <Construction size={29} />
              </span>
              <h2 className="mt-6 break-keep text-[22px] font-bold sm:text-2xl">
                서비스를 준비하고 있어요
              </h2>
              <p className="mx-auto mt-3 max-w-md break-keep text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">
                더 편리하고 안전하게 사용할 수 있도록 마지막 기능을 정리하고
                있습니다.
              </p>
              <Link
                href="/"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#007aff] px-5 py-2.5 text-sm font-semibold text-white hover:scale-[1.03]"
              >
                메인으로 돌아가기
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
          <aside className="space-y-5">
            <section className="ios-card p-5">
              <div className="flex items-center gap-2">
                <Clock3 size={21} />
                <h2 className="text-lg font-bold">진행 상태</h2>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#34c759]" />
                  <span>화면 구성 완료</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-[#34c759]" />
                  <span>로그인 구조 준비</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="size-[18px] rounded-full border-2 border-[#007aff] border-t-transparent animate-spin" />
                  <span>데이터 연결 준비 중</span>
                </div>
              </div>
            </section>
            <section className="ios-card p-5">
              <div className="flex items-center gap-2">
                <Megaphone size={21} />
                <h2 className="text-lg font-bold">이용 안내</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                서비스가 열리면 학교 계정으로 로그인한 뒤 이용할 수 있어요.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
