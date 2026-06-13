"use client";

/**
 * Global site header shown on public pages.
 * Pill-shaped glassmorphism navbar inspired by Landas.
 * Hides itself when the user is inside dashboard routes.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ThemeChanger from "@/components/theme-changer";
import PillNav from "@/components/pill-nav";
import { useScrollHide } from "@/hooks/use-scroll-hide";

export default function SiteHeader() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isHome = pathname === "/";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isVisible, setHovered } = useScrollHide();

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("tanglaw-token"));
    const handler = () => setIsAuthenticated(!!localStorage.getItem("tanglaw-token"));
    window.addEventListener("storage", handler);
    window.addEventListener("tanglaw-auth-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("tanglaw-auth-change", handler);
    };
  }, []);

  // Reset scroll state on route change
  useEffect(() => {
    setHovered(false);
  }, [pathname, setHovered]);

  if (isDashboard) {
    return null;
  }

  const logoSlot = (
    <div
      className={`transition-all duration-700 ${
        !isHome
          ? "pointer-events-auto translate-x-0 opacity-100"
          : "pointer-events-none -translate-x-6 opacity-0"
      }`}
    >
      <Link href="/" className="flex items-center gap-2" aria-label="Go to home">
        <div className="h-9 w-9 rounded-full border border-white/10 bg-[color:var(--theme-surface)] shadow-lg shadow-black/20 flex items-center justify-center">
          <Image
            src="/assets/owel-head.webp"
            alt="Owel Logo"
            width={30}
            height={30}
            className="object-cover"
          />
        </div>
        <span className="font-display text-xl font-black tracking-[0.12em] text-[color:var(--theme-typography-main)]">
          TANGLAW
        </span>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">
          Beta
        </span>
      </Link>
    </div>
  );

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const actionsSlot = isAuthenticated ? (
    <Link
      href="/dashboard"
      className={`group relative rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-500 sm:px-4 ${
        pathname?.startsWith("/dashboard")
          ? "bg-primary/15 text-primary"
          : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
      }`}
    >
      Dashboard
      <span
        className={`absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 rounded-full bg-primary/40 transition-all duration-500 ${
          pathname?.startsWith("/dashboard") ? "w-3/5 opacity-100" : "w-0 opacity-0 group-hover:w-2/5 group-hover:opacity-60"
        }`}
      />
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className={`group relative rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-500 sm:px-4 ${
          pathname === "/login"
            ? "bg-primary/15 text-primary"
            : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
        }`}
      >
        Log In
        <span
          className={`absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 rounded-full bg-primary/40 transition-all duration-500 ${
            pathname === "/login" ? "w-3/5 opacity-100" : "w-0 opacity-0 group-hover:w-2/5 group-hover:opacity-60"
          }`}
        />
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-primary/90 px-4 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-white shadow-[0_0_16px_rgba(27,64,121,0.2)] transition-all duration-500 hover:bg-primary hover:shadow-[0_0_20px_rgba(27,64,121,0.3)]"
      >
        Sign Up
      </Link>
    </>
  );

  const mobileExtra = isAuthenticated ? (
    <Link
      href="/dashboard"
      className={`rounded-full px-4 py-2.5 transition-all duration-300 ${
        pathname?.startsWith("/dashboard")
          ? "bg-primary/15 text-primary"
          : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
      }`}
    >
      Dashboard
    </Link>
  ) : (
    <>
      <Link
        href="/login"
        className="rounded-full px-4 py-2.5 text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)] transition-all duration-300"
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-primary/90 px-4 py-2.5 text-center text-white transition-all duration-300 hover:bg-primary"
      >
        Sign Up
      </Link>
    </>
  );

  return (
    <>
      {/* Invisible trigger zone at top — reveals navbar on hover when hidden */}
      {!isVisible && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] h-20"
          onMouseEnter={() => setHovered(true)}
          aria-hidden="true"
        />
      )}

      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 pt-4 sm:px-6 sm:pt-5 transition-all duration-700 ease-out ${
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
    </>
  );
}
