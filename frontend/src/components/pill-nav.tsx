"use client";

/**
 * Shared pill-shaped glassmorphism navigation component.
 * Used by both the public site header and the dashboard header.
 */
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";

interface PillNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface PillNavProps {
  items: PillNavItem[];
  logoSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  mobileExtra?: React.ReactNode;
  autoHide?: boolean;
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
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

export default function PillNav({
  items,
  logoSlot,
  actionsSlot,
  mobileExtra,
}: PillNavProps) {
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

  return (
    <>
      {/* Logo slot — positioned absolutely left */}
      {logoSlot && (
        <div className="absolute -left-2 top-3 sm:top-1/2 sm:translate-y-[calc(-50%+6px)] sm:-left-4">
          {logoSlot}
        </div>
      )}

      {/* Pill Nav — glassmorphism, hidden on mobile */}
      <nav className="mx-auto hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-[color:var(--theme-surface)]/60 px-3 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-700 sm:gap-2 sm:px-5 translate-x-4 sm:translate-x-8">
        {items.map(({ href, label }) => (
          <NavLink
            key={href}
            href={href}
            active={pathname === href}
          >
            {label}
          </NavLink>
        ))}

        {actionsSlot && (
          <>
            <div className="mx-1 h-4 w-px bg-white/10 sm:mx-2" />
            {actionsSlot}
          </>
        )}
      </nav>

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
                {items.map(({ href, label }) => (
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
                {mobileExtra && (
                  <>
                    <div className="my-1 h-px bg-white/10" />
                    {mobileExtra}
                  </>
                )}
              </nav>
            </div>
          </>
        )}
      </div>
    </>
  );
}
