import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import ConditionalNavbar from "@/components/ConditionalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Airdrop Tracker",
  description: "Track and manage your crypto airdrop tasks",
  icons: {
    icon: "/images/mewoicon.svg",
    shortcut: "/images/mewoicon.svg",
    apple: "/images/mewoicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0b0f] text-white`}
      >
        {/* background accents */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
        </div>
        <I18nProvider>
          {/* navbar */}
          <ConditionalNavbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
