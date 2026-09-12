import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = { title: "이메일 인증 | 동평ON" };

export default function VerifyEmailPage() {
  return <VerifyEmailPanel/>;
}
