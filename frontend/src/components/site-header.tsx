"use client";

/**
 * Global site header shown on public pages.
 * Pill-shaped glassmorphism navbar inspired by Landas.
 * Hides itself when the user is inside dashboard routes.
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import ThemeChanger from "@/components/theme-changer";

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`group relative rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase transition-all duration-500 sm:px-4 ${
        active
          ? "bg-primary/15 text-primary"
          : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
      }`}
    >
      {children}
      <span
        className={`absolute -bottom-0.5 left-1/2 h-px -translate-x-1/2 rounded-full bg-primary/40 transition-all duration-500 ${
          active ? "w-3/5 opacity-100" : "w-0 opacity-0 group-hover:w-2/5 group-hover:opacity-60"
        }`}
      />
    </Link>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const isHome = pathname === "/";
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledAway, setScrolledAway] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Visibility: show at top or on hover; other pages also visible unless scrolled away
  const isVisible = hovered || atTop || (!isHome && !scrolledAway);

  useEffect(() => {
    if (isDashboard) return;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setAtTop(currentY < 30);
      if (currentY > 60 && currentY > lastScrollY.current) {
        setScrolledAway(true);
      } else if (currentY < lastScrollY.current) {
        if (currentY < 30) setScrolledAway(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDashboard]);

  useEffect(() => {
    setScrolledAway(false);
    setMenuOpen(false);
    setAtTop(true);
    lastScrollY.current = 0;
  }, [pathname]);

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

  if (isDashboard) {
    return null;
  }

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
        className={`fixed top-0 left-0 right-0 z-50 flex items-start justify-center px-4 pt-4 sm:px-6 sm:pt-5 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* TANGLAW logo + wordmark — fixed at viewport top-left on non-home pages */}
        <div
          className={`fixed left-4 sm:left-6 top-4 sm:top-5 z-50 transition-all duration-700 ${
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

        {/* Pill Nav — glassmorphism, centered */}
        <div className="flex w-full max-w-4xl items-center justify-center">
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[color:var(--theme-surface)]/60 px-3 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-700 sm:gap-2 sm:px-5">
            <NavLink href="/" active={pathname === "/"}>
              Home
            </NavLink>
            <NavLink href="/about" active={pathname === "/about"}>
              About
            </NavLink>
            <NavLink href="/contact" active={pathname === "/contact"}>
              Contact
            </NavLink>

            <div className="mx-1 h-4 w-px bg-white/10 sm:mx-2" />

            {isAuthenticated ? (
              <NavLink href="/dashboard" active={pathname?.startsWith("/dashboard") ?? false}>
                Dashboard
              </NavLink>
            ) : (
              <>
                <NavLink href="/login" active={pathname === "/login"}>
                  Log In
                </NavLink>
                <Link
                  href="/signup"
                  className="rounded-full bg-primary/90 px-4 py-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-white shadow-[0_0_16px_rgba(27,64,121,0.2)] transition-all duration-500 hover:bg-primary hover:shadow-[0_0_20px_rgba(27,64,121,0.3)]"
                >
                  Sign Up
                </Link>
              </>
            )}

            <div className="mx-1 h-4 w-px bg-white/10 sm:mx-2" />

            <ThemeChanger />
          </nav>
        </div>

        {/* Mobile hamburger */}
        <div className="absolute right-3 top-3 sm:right-5 sm:top-4 md:hidden" ref={menuRef}>
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
              <div className="absolute top-12 right-0 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[color:var(--theme-surface)]/80 backdrop-blur-xl shadow-2xl shadow-black/30 origin-top transition-all duration-150">
                <nav className="flex flex-col gap-1 p-3 text-[11px] uppercase tracking-[0.18em] font-semibold">
                  <Link
                    href="/"
                    className={`rounded-full px-4 py-2.5 transition-all duration-300 ${
                      pathname === "/"
                        ? "bg-primary/15 text-primary"
                        : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/about"
                    className={`rounded-full px-4 py-2.5 transition-all duration-300 ${
                      pathname === "/about"
                        ? "bg-primary/15 text-primary"
                        : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className={`rounded-full px-4 py-2.5 transition-all duration-300 ${
                      pathname === "/contact"
                        ? "bg-primary/15 text-primary"
                        : "text-[color:var(--theme-typography-secondary)] hover:bg-white/5 hover:text-[color:var(--theme-typography-main)]"
                    }`}
                  >
                    Contact
                  </Link>
                  {isAuthenticated ? (
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
                      <div className="my-1 h-px bg-white/10" />
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
                  )}
                </nav>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}
