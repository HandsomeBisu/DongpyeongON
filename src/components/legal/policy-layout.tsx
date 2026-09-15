import { FileText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

export function PolicyLayout({
  eyebrow,
  title,
  description,
  effectiveDate,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <SiteHeader />
      <main className="page-enter mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-7 px-1 sm:mb-9">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#e5f1ff] text-[#007aff]">
              <FileText size={21} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-[.12em] text-[#007aff]">
                {eyebrow}
              </p>
              <h1 className="mt-1 text-[28px] font-bold tracking-[-.04em] sm:text-4xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="mt-5 break-keep text-sm leading-6 text-[var(--muted)] sm:text-base">
            {description}
          </p>
          <p className="mt-2 text-xs text-[#8e8e93]">시행일: {effectiveDate}</p>
        </header>
        <article className="policy-document ios-card p-5 sm:p-9">
          {children}
        </article>
      </main>
    </div>
  );
}
