import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const siteName = "DongpyeongON";
const siteDescription = "동평중학교의 이야기를 함께 기록하는 공간";

export const metadata: Metadata = {
  metadataBase: new URL("https://dpon.dpsteam.kr"),
  title: siteName,
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    url: "/",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://assets.dpsteam.kr/dpon/dpon.png",
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteName,
    description: siteDescription,
    images: ["https://assets.dpsteam.kr/dpon/dpon.png"],
  },
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
