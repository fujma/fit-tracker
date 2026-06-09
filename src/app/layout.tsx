import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitTracker - 健康管理アプリ",
  description: "体重・筋トレ・有酸素運動を管理する健康管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar />
          {/* Main content */}
          <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
            <div className="max-w-7xl mx-auto p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
