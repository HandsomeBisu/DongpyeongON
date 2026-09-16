import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = { title: "로그인 | DongpyeongON" };

export default function LoginPage() {
  return <LoginPanel/>;
}
