"use client";

import Link from "next/link";
import {
  Activity,
  Clock3,
  Flame,
  Home,
  Inbox,
  LogIn,
  Megaphone,
  MessageCircle,
  Music2,
  Plus,
  Radio,
  Search,
  Utensils,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AnnouncementBanner } from "@/components/announcements/announcement-banner";
import { AuthButton } from "@/components/auth/auth-button";
import { useAuth } from "@/components/auth/auth-provider";
import { BrandLogo } from "@/components/brand-logo";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { markdownToPlainText } from "@/lib/markdown";
import {
  formatPostDate,
  subscribeToPosts,
  type CommunityPost,
} from "@/lib/posts";

const ranges = ["1시간", "1일", "7일", "30일"];

const mobileLinks = [
  { href: "/", label: "홈", icon: Home },
  { href: "/#community", label: "커뮤니티", icon: MessageCircle },
  { href: "/suggestions", label: "신문고", icon: Inbox },
  { href: "/music", label: "신청곡", icon: Music2 },
];

type MealInfo = {
  date: string;
  menu: string[];
  calories: string | null;
};

type TimetableInfo = {
  date: string;
  grade: number;
  classNumber: number;
  periods: Array<{ period: number; subject: string }>;
};

export default function HomePage() {
  const [range, setRange] = useState("1시간");
  const [openedAt] = useState(() => Date.now());
  const { user, profile, loading, configured } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [meal, setMeal] = useState<MealInfo | null>();
  const [mealError, setMealError] = useState("");
  const [timetable, setTimetable] = useState<
    (TimetableInfo & { uid: string }) | null
  >(null);
  const [timetableError, setTimetableError] = useState<{
    uid: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!configured || !user) return;
    return subscribeToPosts(
      (items) => {
        setPosts(items);
        setPostsLoaded(true);
      },
      () => setPostsLoaded(true),
    );
  }, [configured, user]);

  useEffect(() => {
    let active = true;
    fetch("/api/school/meal")
      .then(async (response) => {
        const result = (await response.json().catch(() => ({}))) as {
          meal?: MealInfo | null;
          error?: string;
        };
        if (!response.ok) throw new Error(result.error);
        if (active) setMeal(result.meal ?? null);
      })
      .catch((caught) => {
        if (!active) return;
        setMeal(null);
        setMealError(
          caught instanceof Error && caught.message
            ? caught.message
            : "급식 정보를 불러오지 못했어요.",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    authenticatedFetch(user, "/api/school/timetable")
      .then(async (response) => {
        const result = (await response.json().catch(() => ({}))) as {
          timetable?: TimetableInfo;
          error?: string;
        };
        if (!response.ok || !result.timetable)
          throw new Error(result.error || "시간표를 불러오지 못했어요.");
        if (active) {
          setTimetable({ ...result.timetable, uid: user.uid });
          setTimetableError(null);
        }
      })
      .catch((caught) => {
        if (!active) return;
        setTimetableError({
          uid: user.uid,
          message:
            caught instanceof Error && caught.message
              ? caught.message
              : "시간표를 불러오지 못했어요.",
        });
      });
    return () => {
      active = false;
    };
  }, [user]);

  const latestPosts = posts.slice(0, 5);
  const realtimePosts = [...posts]
    .sort(
      (left, right) =>
        right.likeCount * 2 +
        right.commentCount -
        (left.likeCount * 2 + left.commentCount),
    )
    .slice(0, 3);
  const rangeHours: Record<string, number> = {
    "1시간": 1,
    "1일": 24,
    "7일": 24 * 7,
    "30일": 24 * 30,
  };
  const cutoff = openedAt - rangeHours[range] * 60 * 60 * 1000;
  const hotPosts = [...posts]
    .filter((post) => !post.createdAt || post.createdAt.toMillis() >= cutoff)
    .sort(
      (left, right) =>
        right.likeCount * 2 +
        right.commentCount -
        (left.likeCount * 2 + left.commentCount),
    )
    .slice(0, 5);
  const councilPosts = posts
    .filter((post) => post.category === "학생회 공지")
    .slice(0, 3);
  const loadingMessage = !configured
    ? "커뮤니티 연결 정보를 확인해 주세요."
    : loading || (user && !postsLoaded)
      ? "게시물을 불러오고 있어요."
      : !user
        ? "로그인하면 게시물을 확인할 수 있어요."
        : "등록된 게시물이 없어요.";
  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-[#f5f5f7]">
      <header className="glass-bar sticky top-0 z-40 max-w-full overflow-hidden">
        <div className="mx-auto flex h-[74px] min-w-0 max-w-6xl items-center gap-2 px-3 sm:gap-5 sm:px-5">
          <div className="mr-auto min-w-0 sm:mr-10">
            <BrandLogo />
          </div>
          <label className="hidden h-11 max-w-md flex-1 items-center gap-2.5 rounded-xl border border-black/10 bg-white px-4 text-[var(--muted)] shadow-sm transition focus-within:border-[#007aff]/40 focus-within:shadow-[0_0_0_4px_rgba(0,122,255,.09)] sm:flex">
            <Search size={17} />
            <input
              aria-label="검색"
              placeholder="무엇을 찾으시나요?"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9aa0]"
            />
          </label>
          <div className="ml-auto flex min-w-0 shrink items-center gap-1 sm:gap-4">
            <Link
              href="/suggestions"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] lg:flex"
            >
              <Inbox size={17} className="text-[#007aff]" />
              동평신문고
            </Link>
            <Link
              href="/music"
              className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-black/5 hover:text-[var(--foreground)] lg:flex"
            >
              <Radio size={17} className="text-[#ff2d55]" />
              점심시간 노래방송
            </Link>
            <span className="hidden h-5 w-px bg-black/10 lg:block" />
            <NotificationCenter />
            <span className="hidden h-5 w-px bg-black/10 sm:block" />
            <AuthButton />
          </div>
        </div>
      </header>

      <AnnouncementBanner />

      <main className="page-enter mx-auto grid min-w-0 max-w-6xl gap-8 px-4 py-8 sm:px-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:py-10">
        <div className="min-w-0 space-y-10">
          <DashboardSection icon={<Activity size={25} />} title="실시간 인기글">
            <PostPanel
              posts={realtimePosts}
              emptyText={loadingMessage}
              className="min-h-[190px]"
            />
          </DashboardSection>

          <DashboardSection
            icon={<Flame size={24} />}
            title="HOT 게시글"
            trailing={
              <div className="grid w-full grid-cols-4 rounded-xl bg-[#e9e9ed] p-1 sm:flex sm:w-auto">
                {ranges.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRange(item)}
                    className={`rounded-[9px] px-2 py-2 text-xs font-medium sm:px-3 sm:py-1.5 ${range === item ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            }
          >
            <PostPanel
              posts={hotPosts}
              emptyText={
                posts.length
                  ? `${range} 동안 인기 게시글이 없어요.`
                  : loadingMessage
              }
              className="min-h-[260px]"
            />
          </DashboardSection>

          <DashboardSection
            icon={<Clock3 size={24} />}
            title="최신 게시글"
            trailing={
              <Link
                href="/#community"
                className="text-sm font-medium text-[#007aff]"
              >
                전체 보기
              </Link>
            }
          >
            <div id="community" className="scroll-mt-28">
              <PostPanel
                posts={latestPosts}
                emptyText={loadingMessage}
                className="min-h-[180px]"
              />
            </div>
          </DashboardSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-[130px]">
          <SideCard
            icon={<Utensils size={22} />}
            title="오늘의 급식"
            badge="점심"
          >
            {meal === undefined ? (
              <SchoolCardMessage text="오늘의 급식을 불러오고 있어요." />
            ) : mealError ? (
              <SchoolCardMessage text={mealError} />
            ) : meal ? (
              <div className="overflow-hidden rounded-2xl bg-[#f5f5f7] shadow-inner">
                <ul className="divide-y divide-black/[.05] px-4 py-2">
                  {meal.menu.map((item) => (
                    <li key={item} className="flex items-center gap-2 py-2.5 text-sm">
                      <span className="size-1.5 shrink-0 rounded-full bg-[#ff9500]" />
                      <span className="min-w-0 break-keep">{item}</span>
                    </li>
                  ))}
                </ul>
                {meal.calories && (
                  <p className="border-t border-black/[.06] px-4 py-2.5 text-right text-[11px] font-medium text-[var(--muted)]">
                    {meal.calories}
                  </p>
                )}
              </div>
            ) : (
              <SchoolCardMessage text="오늘은 등록된 점심 급식이 없어요." />
            )}
          </SideCard>
          <SideCard
            icon={<Clock3 size={22} />}
            title="오늘 시간표"
            badge={
              profile?.grade && profile.classNumber
                ? `${profile.grade}학년 ${profile.classNumber}반`
                : undefined
            }
          >
            {!user ? (
              <div className="grid min-h-[150px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center">
                <div>
                  <p className="text-sm leading-6 text-[var(--muted)]">
                    우리 반 시간표를 확인하려면
                    <br />
                    먼저 로그인해 주세요.
                  </p>
                  <Link
                    href="/login"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#007aff] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:scale-[1.03]"
                  >
                    <LogIn size={15} />
                    로그인하기
                  </Link>
                </div>
              </div>
            ) : timetableError?.uid === user.uid ? (
              <SchoolCardMessage text={timetableError.message} />
            ) : timetable?.uid !== user.uid ? (
              <SchoolCardMessage text="우리 반 시간표를 불러오고 있어요." />
            ) : timetable.periods.length ? (
              <ol className="divide-y divide-black/[.05] overflow-hidden rounded-2xl bg-[#f5f5f7] px-3 py-1 shadow-inner">
                {timetable.periods.map((item) => (
                  <li key={item.period} className="flex items-center gap-3 px-1 py-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[#007aff] shadow-sm">
                      {item.period}
                    </span>
                    <strong className="min-w-0 break-keep text-sm">{item.subject}</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <SchoolCardMessage text="오늘은 등록된 시간표가 없어요." />
            )}
          </SideCard>
          <SideCard icon={<Megaphone size={22} />} title="학교/학생회 공지">
            {councilPosts.length ? (
              <div className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-[#f5f5f7]">
                {councilPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block px-4 py-3.5 hover:bg-black/[.03]"
                  >
                    <strong className="block truncate text-sm">
                      {post.title}
                    </strong>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      {formatPostDate(post.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-[130px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center text-sm text-[var(--muted)]">
                {loadingMessage}
              </div>
            )}
          </SideCard>
        </aside>
      </main>

      <Link
        href="/post/new"
        aria-label="새 게시물 작성"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-[60] grid size-14 place-items-center rounded-full bg-[#007aff] text-white shadow-xl shadow-blue-500/30 transition hover:scale-105 hover:bg-[#0674df] md:bottom-7 md:right-7"
      >
        <Plus size={27} strokeWidth={2.5} />
      </Link>

      <nav
        aria-label="모바일 메뉴"
        className="glass-bar fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-b-0 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1 md:hidden"
      >
        {mobileLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium ${href === "/" ? "text-[#007aff]" : "text-[var(--muted)]"}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function DashboardSection({
  icon,
  title,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex min-h-10 flex-wrap items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-2xl font-bold tracking-[-0.03em]">{title}</h2>
        {trailing && (
          <div className="w-full max-w-full sm:ml-auto sm:w-auto">
            {trailing}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({
  text,
  action,
  href,
  className = "",
}: {
  text: string;
  action?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={`ios-card grid place-items-center p-8 text-center ${className}`}
    >
      <div>
        <p className="text-sm text-[var(--muted)]">{text}</p>
        {action && href && (
          <Link
            href={href}
            className="mt-3 inline-block text-sm font-semibold text-[#007aff] hover:opacity-70"
          >
            {action} →
          </Link>
        )}
      </div>
    </div>
  );
}

function PostPanel({
  posts,
  emptyText,
  className = "",
}: {
  posts: CommunityPost[];
  emptyText: string;
  className?: string;
}) {
  if (!posts.length)
    return (
      <EmptyPanel
        className={className}
        text={emptyText}
        action="게시물 작성하기"
        href="/post/new"
      />
    );
  return (
    <div
      className={`ios-card divide-y divide-[var(--border)] overflow-hidden ${className}`}
    >
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="group block px-5 py-4 hover:bg-[#f8f8fa] sm:px-6"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span className="rounded-full bg-[#f2f2f7] px-2 py-1 font-semibold">
              {post.category}
            </span>
            <span>{post.authorNickname}</span>
            <span>·</span>
            <time>{formatPostDate(post.createdAt)}</time>
          </div>
          <h3 className="mt-2 truncate font-bold group-hover:text-[#007aff]">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-[var(--muted)]">
            {markdownToPlainText(post.content)}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            좋아요 {post.likeCount} · 댓글 {post.commentCount}
          </p>
        </Link>
      ))}
    </div>
  );
}

function SideCard({
  icon,
  title,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="ios-card stagger-item p-5">
      <div className="mb-5 flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-xl font-bold tracking-[-0.025em]">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-lg border border-black/8 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function SchoolCardMessage({ text }: { text: string }) {
  return (
    <div className="grid min-h-[150px] place-items-center rounded-2xl bg-[#f5f5f7] p-5 text-center text-sm leading-6 text-[var(--muted)] shadow-inner">
      <p className="break-keep">{text}</p>
    </div>
  );
}
