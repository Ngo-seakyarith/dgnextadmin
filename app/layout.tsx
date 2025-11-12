import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import RegisterPush from "@/app/components/RegisterPush"; // ← new

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DGNext Admin",
  description: "Real-world AI. Real Impact",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} antialiased`} suppressHydrationWarning>
        <RegisterPush /> {/* ← invisible, registers push token */}
        {children}
      </body>
    </html>
  );
}