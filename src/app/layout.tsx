import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const siteName = "DongpyeongON";
const siteDescription = "DPON | 동평중학교 커뮤니티";

export const metadata: Metadata = {
  metadataBase: new URL("https://dpon.dpsteam.kr"),
  title: siteName,
  description: siteDescription,
  applicationName: siteName,
  verification: {
    google: "3uZKnTVvx3Ph0D6Vo4U28878OPMOsWngJB_aFweUdzc",
  },
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
        <AppShell waitingRoomEnabled={process.env.WAITING_ROOM_ENABLED === "true"}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
