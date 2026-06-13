"use client";

import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import ScrollReveal from "@/components/scroll-reveal";
import { EtheralShadow } from "./etheral-shadow";
import { type LucideIcon } from "lucide-react";

const OwelMascot = dynamic(
  () => import("./owel-mascot").then((mod) => mod.OwelMascot),
  { ssr: false, loading: () => <div className="w-full aspect-square max-w-[520px] animate-pulse rounded-full bg-white/10" /> }
);

export function LandingBackground() {
  return (
    <EtheralShadow
      animation={{ scale: 60, speed: 80 }}
      noise={{ opacity: 0.8, scale: 1.0 }}
      sizing="cover"
      lightColor="rgba(200, 230, 175, 0.85)"
    />
  );
}

export function HeroButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  const baseClass =
    variant === "primary"
      ?      "inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.24em] text-white shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-primary-hover cursor-pointer shadow-[var(--theme-glow-primary)]"
      : "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--theme-typography-main)] shadow-2xl shadow-black/15 transition duration-300 hover:bg-white/10 cursor-pointer";

  return (
    <motion.button whileHover={{ scale: 1.03 }} onClick={onClick} className={baseClass}>
      {children}
    </motion.button>
  );
}

export function MascotWithGlow() {
  return (
    <div className="relative flex items-center justify-center w-full">
      {/* Animated glow halo behind mascot */}
      <motion.div
        className="absolute w-[85%] aspect-square rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(184,201,232,0.35) 0%, rgba(184,201,232,0.12) 40%, transparent 70%)",
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
        whileInView={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
        viewport={{ once: false, margin: "-200px" }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Inner bright core glow */}
      <motion.div
        className="absolute w-[50%] aspect-square rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)",
          filter: "blur(30px)",
          willChange: "transform, opacity",
        }}
        whileInView={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
        viewport={{ once: false, margin: "-200px" }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        whileInView={{ y: [0, -20, 0] }}
        viewport={{ once: false }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full"
      >
        <OwelMascot />
      </motion.div>
    </div>
  );
}

const ACCENT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  periwinkle: {
    bg: "bg-[color:var(--theme-accent-periwinkle)]/10",
    text: "text-[color:var(--theme-accent-periwinkle)]",
    border: "border-l-[color:var(--theme-accent-periwinkle)]",
  },
  rose: {
    bg: "bg-[color:var(--theme-accent-rose)]/10",
    text: "text-[color:var(--theme-accent-rose)]",
    border: "border-l-[color:var(--theme-accent-rose)]",
  },
  muted: {
    bg: "bg-[color:var(--theme-accent-muted)]/10",
    text: "text-[color:var(--theme-accent-muted)]",
    border: "border-l-[color:var(--theme-accent-muted)]",
  },
};

export const FeatureCard = React.memo(function FeatureCard({
  title,
  description,
  icon,
  accent = "periwinkle",
  delay,
  direction,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  accent?: "periwinkle" | "rose" | "muted";
  delay: number;
  direction: "up";
}) {
  const colors = ACCENT_COLORS[accent] ?? ACCENT_COLORS.periwinkle;
  const Icon = icon;

  return (
    <ScrollReveal delay={delay} direction={direction}>
      <motion.article
        whileHover={{ y: -2, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`group relative overflow-hidden rounded-[2rem] border border-white/10 border-l-2 ${colors.border} bg-[color:var(--theme-surface)] p-6 shadow-xl shadow-black/20 backdrop-blur-sm h-full hover:border-white/20 transition-colors duration-500`}
      >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-8 -bottom-8 h-20 w-20 rounded-full bg-[color:var(--theme-accent-periwinkle)]/5 blur-2xl" />
        <div className="relative z-10">
          {Icon && (
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colors.bg}`}>
              <Icon className={`h-6 w-6 ${colors.text}`} />
            </div>
          )}
          <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--theme-typography-secondary)] font-bold">
            {title}
          </p>
          <p className="mt-4 text-sm leading-7 text-[color:var(--theme-text-body)]">{description}</p>
        </div>
      </motion.article>
    </ScrollReveal>
  );
});
