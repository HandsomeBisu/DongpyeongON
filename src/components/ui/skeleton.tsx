type SkeletonProps = {
  className?: string;
  dark?: boolean;
};

export function Skeleton({ className = "", dark = false }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton block ${dark ? "skeleton-dark" : ""} ${className}`}
    />
  );
}

export function ListSkeleton({
  rows = 3,
  className = "",
  dark = false,
}: SkeletonProps & { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="콘텐츠 로딩 중"
      className={`divide-y divide-[var(--border)] ${className}`}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4 sm:px-6">
          <Skeleton dark={dark} className="size-11 shrink-0 rounded-[14px]" />
          <div className="min-w-0 flex-1">
            <Skeleton dark={dark} className="h-3 w-24 rounded-full" />
            <Skeleton dark={dark} className="mt-2.5 h-4 w-3/4 rounded-full" />
            <Skeleton dark={dark} className="mt-2 h-3 w-2/5 rounded-full" />
          </div>
        </div>
      ))}
      <span className="sr-only">콘텐츠를 불러오는 중입니다.</span>
    </div>
  );
}

export function DetailSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="본문 로딩 중"
      className={`ios-card p-5 sm:p-8 ${className}`}
    >
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="mt-6 h-8 w-4/5 rounded-xl" />
      <Skeleton className="mt-3 h-4 w-36 rounded-full" />
      <div className="mt-8 space-y-3 border-t border-[var(--border)] pt-8">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-11/12 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
        <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
      </div>
      <span className="sr-only">본문을 불러오는 중입니다.</span>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  className = "",
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="목록 로딩 중"
      className={`divide-y divide-[var(--border)] ${className}`}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-5 p-5 sm:grid-cols-[minmax(0,1.6fr)_minmax(8rem,1fr)_7rem]"
        >
          <div>
            <Skeleton className="h-4 w-3/4 rounded-full" />
            <Skeleton className="mt-2 h-3 w-2/5 rounded-full" />
          </div>
          <Skeleton className="hidden h-4 w-2/3 rounded-full sm:block" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <span className="sr-only">목록을 불러오는 중입니다.</span>
    </div>
  );
}

export function PageSkeleton({ className = "" }: { className?: string }) {
  return (
    <main
      role="status"
      aria-label="페이지 로딩 중"
      className={`mx-auto min-h-[70dvh] w-full max-w-5xl px-5 py-10 ${className}`}
    >
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="mt-3 h-9 w-52 rounded-xl" />
      <div className="ios-card mt-7 p-5 sm:p-8">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="mt-5 h-5 w-44 rounded-full" />
        <Skeleton className="mt-3 h-4 w-64 max-w-full rounded-full" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      <span className="sr-only">페이지를 불러오는 중입니다.</span>
    </main>
  );
}
