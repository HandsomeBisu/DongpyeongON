import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "동평ON",
  description: "동평중학교의 이야기를 함께 기록하는 공간",
  icons: {
    icon: "https://assets.dpsteam.kr/dpon/dpon-symbol.png",
    apple: "https://assets.dpsteam.kr/dpon/dpon-symbol.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <OnboardingGuard>
            {children}
            <SiteFooter />
          </OnboardingGuard>
          <AnnouncementPopup />
        </AuthProvider>
      </body>
    </html>
  );
}
