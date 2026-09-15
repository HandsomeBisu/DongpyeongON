import { notFound } from "next/navigation";
import { AnnouncementDetail } from "@/components/announcements/announcement-detail";

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ announcementId: string }>;
}) {
  const { announcementId } = await params;
  if (!/^[A-Za-z0-9]{20}$/.test(announcementId)) notFound();
  return <AnnouncementDetail announcementId={announcementId} />;
}
