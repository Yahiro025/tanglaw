"use client";

/**
 * Layout wrapper for dashboard pages.
 * Applies secure guard, header navigation, and embedded chatbot UI.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogOut, Sparkles, Menu, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";
import ThemeChanger from "@/components/theme-changer";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Logout error:", error);
    }
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="h-screen overflow-y-auto hide-scrollbar bg-base-light text-text-primary flex flex-col">
          <EtheralShadow
            animation={{ scale: 60, speed: 80 }}
            noise={{ opacity: 0.8, scale: 1.0 }}
            sizing="cover"
            lightColor="rgba(200, 230, 175, 0.85)"
          />
        <header className="relative z-50 flex items-center justify-center px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="relative flex w-full max-w-4xl items-center">
            {/* DASHBOARD wordmark */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 sm:-left-4">
              <Link href="/dashboard" className="inline-flex items-center gap-2 font-display text-lg font-black uppercase tracking-[0.18em] sm:text-xl bg-gradient-to-r from-primary via-[color:var(--theme-accent-periwinkle)] to-primary bg-clip-text text-transparent">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Dashboard
              </Link>
            </div>

            {/* Pill Nav — glassmorphism */}
            <nav className="mx-auto flex items-center gap-1 rounded-full border border-white/10 bg-[color:var(--theme-surface)]/60 px-3 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl sm:gap-2 sm:px-5 translate-x-4 sm:translate-x-8">
              {[
                { href: "/dashboard", label: "Overview" },
                { href: "/dashboard/scholarships", label: "Scholarships" },
                { href: "/dashboard/readiness", label: "Readiness" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`group relative rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-500 sm:px-4 ${
                    pathname === href
                      ? "bg-primary/15 text-primary"
                      : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
                  }`}
                >
                  {label}
                  <span
                    className={`absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 rounded-full bg-primary/40 transition-all duration-500 ${
                      pathname === href ? "w-3/5 opacity-100" : "w-0 opacity-0 group-hover:w-2/5 group-hover:opacity-60"
                    }`}
                  />
                </Link>
              ))}

              <div className="mx-1 h-4 w-px bg-white/10 sm:mx-2" />

              <ThemeChanger />

              <button
                onClick={handleSignOut}
                className="rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-[color:var(--theme-typography-secondary)] transition-all duration-500 hover:bg-white/5 hover:text-[color:var(--theme-typography-main)] sm:px-4"
              >
                Logout
              </button>
            </nav>
          </div>

          {/* Mobile hamburger */}
          <div className="absolute right-4 top-4 sm:right-6 sm:top-5 sm:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center justify-center h-10 w-10 rounded-full border border-white/10 bg-[color:var(--theme-surface)]/60 backdrop-blur-xl shadow-lg transition-all duration-500 hover:bg-[color:var(--theme-surface)]/80"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="h-5 w-5 text-[color:var(--theme-typography-main)]" />
              ) : (
                <Menu className="h-5 w-5 text-[color:var(--theme-typography-main)]" />
              )}
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/35 transition-opacity duration-150"
                  style={{ top: "100%" }}
                  onClick={() => setMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute top-14 right-0 z-50 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--theme-surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/30 origin-top transition-all duration-150">
                  <nav className="flex flex-col gap-1 p-3 text-[11px] uppercase tracking-[0.18em] font-semibold">
                    {[
                      { href: "/dashboard", label: "Overview" },
                      { href: "/dashboard/scholarships", label: "Scholarships" },
                      { href: "/dashboard/readiness", label: "Readiness" },
                    ].map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`rounded-full px-4 py-2.5 transition-all duration-300 ${
                          pathname === href
                            ? "bg-primary/15 text-primary"
                            : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                    <div className="my-1 h-px bg-white/10" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 rounded-full bg-primary/90 px-4 py-2.5 text-white transition-all duration-300 hover:bg-primary"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </nav>
                </div>
              </>
            )}
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
  );
}
