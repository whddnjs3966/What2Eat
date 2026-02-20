import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "오늘 메뉴 — What2Eat | 오늘 뭐 먹지?",
  description:
    "간단한 취향 선택만으로 오늘의 완벽한 메뉴를 추천받으세요. 아침, 점심, 저녁, 야식까지 — 당신의 메뉴 결정 도우미.",
  keywords: ["오늘 뭐 먹지", "메뉴 추천", "음식 추천", "What2Eat", "점심 메뉴"],
  openGraph: {
    title: "오늘 메뉴 — What2Eat",
    description: "간단한 선택으로 오늘의 완벽한 메뉴를 찾아보세요!",
    type: "website",
    locale: "ko_KR",
    url: "https://what2eat.kr",
    siteName: "What2Eat",
  },
  metadataBase: new URL("https://what2eat.kr"),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
