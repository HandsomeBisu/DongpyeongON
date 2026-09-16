export type SiteAnnouncement = {
  id: string;
  title: string;
  content: string;
  showPopup: boolean;
  showBanner: boolean;
  createdAt: string | null;
  kind?: "site" | "student_council";
  href?: string;
  expiresAt?: string | null;
};

let pendingRequest: Promise<SiteAnnouncement[]> | null = null;

export function fetchAnnouncements() {
  if (!pendingRequest) {
    pendingRequest = fetch("/api/announcements")
      .then(async (response) => {
        if (!response.ok) throw new Error("ANNOUNCEMENTS_FETCH_FAILED");
        return (
          (await response.json()) as { announcements: SiteAnnouncement[] }
        ).announcements;
      })
      .catch((error) => {
        pendingRequest = null;
        throw error;
      });
  }
  return pendingRequest;
}
