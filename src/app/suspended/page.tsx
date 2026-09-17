import type { Metadata } from "next";
import { SuspendedAccount } from "@/components/auth/suspended-account";

export const metadata: Metadata = {
  title: "계정 이용 제한 | DongpyeongON",
};

export default function SuspendedPage() {
  return <SuspendedAccount />;
}
