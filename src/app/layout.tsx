import type { Metadata } from "next";
import { UsernameGate } from "@/components/user/username-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "刷题系统 - Exam Practice System",
  description: "轻量级在线刷题系统，支持套题练习与答题记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="sun">
      <body>
        <UsernameGate>{children}</UsernameGate>
      </body>
    </html>
  );
}
