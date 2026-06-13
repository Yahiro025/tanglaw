"use client";

/**
 * Layout wrapper for dashboard pages.
 * Applies secure guard, header navigation, and embedded chatbot UI.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";
import NextAuthProvider from "@/components/NextAuthProvider";
import ThemeChanger from "@/components/theme-changer";
import PillNav from "@/components/pill-nav";
import { useScrollHide } from "@/hooks/use-scroll-hide";

const EtheralShadow = dynamic(
  () => import("../../../components/ui/etheral-shadow").then((mod) => mod.EtheralShadow),
  { ssr: false }
);
const OwelChatbot = dynamic(() => import("@/components/owel-chatbot"), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-6 right-6 z-40 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/20 animate-pulse" />
  ),
});

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const { isVisible, setHovered } = useScrollHide();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/scholarships", label: "Scholarships" },
    { href: "/dashboard/readiness", label: "Readiness" },
  ];

  const actionsSlot = (
    <>
      <ThemeChanger />
      <button
        onClick={handleSignOut}
        className="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-[color:var(--theme-typography-secondary)] transition-all duration-500 hover:bg-white/5 hover:text-[color:var(--theme-typography-main)] sm:px-4"
      >
        Logout
      </button>
    </>
  );

  const mobileExtra = (
    <>
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2.5 text-white transition-all duration-300 hover:bg-primary"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </>
  );

  const logoSlot = (
    <div className="hidden sm:block">
      <Link href="/dashboard" className="flex items-center gap-2" aria-label="Go to dashboard">
        <div className="h-8 w-8 shrink-0 rounded-full border border-white/10 bg-[color:var(--theme-surface)] shadow-lg shadow-black/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <span className="font-display text-lg font-black uppercase tracking-[0.12em] text-[color:var(--theme-typography-main)] sm:text-xl whitespace-nowrap">
          Dashboard
        </span>
      </Link>
    </div>
  );

  return (
    <NextAuthProvider>
    <AuthGuard>
      <div className="h-screen overflow-y-auto hide-scrollbar bg-base-light text-text-primary flex flex-col">
          <EtheralShadow
            animation={{ scale: 60, speed: 80 }}
            noise={{ opacity: 0.8, scale: 1.0 }}
            sizing="cover"
            lightColor="rgba(200, 230, 175, 0.85)"
          />

        {/* Invisible trigger zone — reveals navbar on hover when hidden */}
        {!isVisible && (
          <div
            className="fixed top-0 left-0 right-0 z-[60] h-20"
            onMouseEnter={() => setHovered(true)}
            aria-hidden="true"
          />
        )}

        <header
          className={`relative z-50 flex items-center justify-center px-4 pt-4 sm:px-6 sm:pt-5 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative flex w-full max-w-4xl items-center">
            <PillNav
              items={navItems}
              logoSlot={logoSlot}
              actionsSlot={actionsSlot}
              mobileExtra={mobileExtra}
            />
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 w-full flex-1"> {children} </main>
        {/* Floating chatbot: hidden on /dashboard (has its own CTA + modal), visible on other pages */}
        {pathname !== "/dashboard" && <OwelChatbot />}

        <footer className="relative z-10 bg-[color:var(--theme-component-backdrop)] border-t border-white/5 py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="text-center md:text-left">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--theme-typography-secondary)] font-black">
                TANGLAW RESEARCH PROJECT © 2026
              </p>
              <p className="text-[10px] text-[color:var(--theme-typography-secondary)] mt-1">
                Science, Technology, and Society (BSCS 1-2)
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-[10px] text-[color:var(--theme-typography-secondary)] uppercase tracking-[0.28em] font-semibold">
              <Link href="/about" className="hover:text-[color:var(--theme-typography-main)]">
                The Minds Behind Us
              </Link>
              <span className="text-white/20">|</span>
              <a href="https://pup.edu.ph" target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--theme-typography-main)]">
                PUP Manila
              </a>
            </div>
          </div>
        </footer>
      </div>
    </AuthGuard>
    </NextAuthProvider>
  );
}
