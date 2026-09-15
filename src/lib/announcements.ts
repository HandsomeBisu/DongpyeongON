export type SiteAnnouncement = {
  id: string;
  title: string;
  content: string;
  showPopup: boolean;
  showBanner: boolean;
  createdAt: string | null;
};

export async function fetchAnnouncements() {
  const response = await fetch("/api/announcements", { cache: "no-store" });
  if (!response.ok) throw new Error("ANNOUNCEMENTS_FETCH_FAILED");
  return ((await response.json()) as { announcements: SiteAnnouncement[] })
    .announcements;
}
