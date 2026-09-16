import type { Metadata } from "next";
import { WaitingRoom } from "@/components/queue/waiting-room";

export const metadata: Metadata = {
  title: "입장 대기 | DongpyeongON",
  robots: { index: false, follow: false },
};

export default function WaitingPage() {
  return <WaitingRoom />;
}
