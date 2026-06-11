/**
 * Root layout for the Next.js application.
 * Configures fonts, metadata, global styles, and shared page chrome.
 */
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { DynamicNatureCanvas, DynamicParticlesBackground } from "@/components/dynamic-backgrounds";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import NextAuthProvider from "@/components/NextAuthProvider";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "900"],
  preload: true,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["700", "900"],
  preload: true,
});

export const metadata: Metadata = {
  title: "TANGLAW | AI-Powered Scholarship Navigation",
  description:
    "TANGLAW is an AI-first scholarship navigator for Filipino learners, combining readiness checks, grant discovery, and guidance into a single academic dashboard.",
  icons: {
    icon: [{ url: "/assets/owel-head.png", type: "image/png" }],
    shortcut: "/assets/owel-head.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col bg-base-light text-text-primary">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <DynamicParticlesBackground />
        <DynamicNatureCanvas />

        <NextAuthProvider>
          <SiteHeader />
          <main className="flex-grow flex flex-col">{children}</main>
          <SiteFooter />
        </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
