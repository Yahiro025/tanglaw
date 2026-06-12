"use client";

import React from "react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/scroll-reveal";
import { EtheralShadow } from "./etheral-shadow";
import { OwelMascot } from "./owel-mascot";

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
      ? "inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.24em] text-white shadow-2xl shadow-black/20 transition-all duration-300 hover:bg-primary-hover cursor-pointer shadow-[var(--theme-glow-primary)]"
      : "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3 text-sm font-bold uppercase tracking-[0.24em] text-[color:var(--theme-typography-main)] shadow-2xl shadow-black/15 transition duration-200 hover:bg-white/10 cursor-pointer";

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
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
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
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        whileInView={{ y: [0, -20, 0] }}
        viewport={{ once: false }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-10 w-full"
      >
        <OwelMascot />
      </motion.div>
    </div>
  );
}

export const FeatureCard = React.memo(function FeatureCard({
  title,
  description,
  delay,
  direction,
}: {
  title: string;
  description: string;
  delay: number;
  direction: "up";
}) {
  return (
    <ScrollReveal delay={delay} direction={direction}>
      <article className="rounded-[2rem] border border-white/10 bg-[color:var(--theme-surface)] p-6 shadow-xl shadow-black/20 backdrop-blur-sm h-full hover:border-white/20 transition-all duration-300">
        <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--theme-typography-secondary)] font-bold">
          {title}
        </p>
        <p className="mt-4 text-sm leading-7 text-[color:var(--theme-text-body)]">{description}</p>
      </article>
    </ScrollReveal>
  );
});
