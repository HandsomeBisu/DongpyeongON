import type { Metadata } from "next";
import { CorrectNamePanel } from "@/components/auth/correct-name-panel";

export const metadata: Metadata = {
  title: "이름 수정 | DongpyeongON",
};

export default function CorrectNamePage() {
  return <CorrectNamePanel />;
}
