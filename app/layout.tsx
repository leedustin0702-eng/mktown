import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 💡 여기서 탭 이름과 설명, 파비콘(로고)을 설정합니다!
export const metadata: Metadata = {
  title: "민교의 놀이터",
  description: "김민교 및 FCO 스트리머 전적 검색 사이트",
  icons: {
    icon: "/logo.png", // 👈 탭에 뜰 로고 이미지 경로
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko" // 💡 (꿀팁) 접근성을 위해 en을 ko(한국어)로 살짝 바꿨습니다!
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}