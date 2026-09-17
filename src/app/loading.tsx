import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      <PageSkeleton />
    </div>
  );
}
