import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import Providers from "@/components/providers";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wealth Tracker",
  description: "Personal finance tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 animate-fade-in">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}