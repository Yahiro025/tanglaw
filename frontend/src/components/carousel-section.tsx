"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Target, ClipboardCheck, Bot, LayoutGrid, BarChart3 } from "lucide-react";
import { GlowingText } from "../../components/ui/glowing-text";

const PILLARS = [
  {
    number: "01",
    title: "Guided Scholarship Matching",
    description: "TANGLAW turns raw grant criteria into student-friendly matches and decision prompts.",
    Icon: Target,
  },
  {
    number: "02",
    title: "Adaptive Readiness Check",
    description: "Interactive drills help students identify strengths, gaps, and high-impact review areas.",
    Icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "AI Navigation Companion",
    description: "Owel answers eligibility questions, simplifies terms, and recommends next steps.",
    Icon: Bot,
  },
  {
    number: "04",
    title: "Smart Scholarship Directory",
    description: "Filter grants by institution, funder type, and requirement intensity in one interface.",
    Icon: LayoutGrid,
  },
  {
    number: "05",
    title: "Review Engine & Analytics",
    description: "Practice modules and completion metrics keep learners motivated and accountable.",
    Icon: BarChart3,
  },
];

const PILLAR_NUM_GRADIENTS = [
  "from-[color:var(--theme-accent-periwinkle)] via-[color:var(--theme-typography-main)] to-[color:var(--theme-accent-periwinkle)]",
  "from-[color:var(--theme-typography-main)] via-[color:var(--theme-accent-periwinkle)] to-[color:var(--theme-typography-main)]",
  "from-[color:var(--theme-accent-periwinkle)] via-[color:var(--theme-typography-main)] to-[color:var(--theme-accent-periwinkle)]",
  "from-[color:var(--theme-typography-main)] via-[color:var(--theme-accent-periwinkle)] to-[color:var(--theme-typography-main)]",
  "from-[color:var(--theme-accent-periwinkle)] via-[color:var(--theme-typography-main)] to-[color:var(--theme-accent-periwinkle)]",
];

export default function CarouselSection() {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseUntilRef = useRef(0);
  const isProgrammaticScroll = useRef(false);

  const getCardWidth = useCallback(() => {
    if (typeof window === "undefined") return 576;
    return window.innerWidth < 640 ? window.innerWidth - 48 : 576;
  }, []);

  const scrollTo = useCallback((index: number) => {
    if (!carouselRef.current) return;
    isProgrammaticScroll.current = true;
    const cardW = getCardWidth();
    const gap = 24;
    carouselRef.current.scrollTo({
      left: index * (cardW + gap),
      behavior: "smooth",
    });
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, [getCardWidth]);

  const nextSlide = useCallback(() => {
    const next = (activeIndexRef.current + 1) % PILLARS.length;
    scrollTo(next);
  }, [scrollTo]);

  const prevSlide = useCallback(() => {
    const prev = (activeIndexRef.current - 1 + PILLARS.length) % PILLARS.length;
    scrollTo(prev);
  }, [scrollTo]);

  const handleScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft } = carouselRef.current;
    const cardW = getCardWidth();
    const gap = 24;
    const idx = Math.round(scrollLeft / (cardW + gap));
    if (idx !== activeIndexRef.current && idx >= 0 && idx < PILLARS.length) {
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    }
  }, [getCardWidth]);

  const pauseAutoPlay = useCallback(() => {
    pauseUntilRef.current = Date.now() + 8000;
  }, []);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      if (Date.now() >= pauseUntilRef.current) {
        nextSlide();
      }
    }, 4000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [nextSlide]);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      handleScroll();
      if (!isProgrammaticScroll.current) {
        pauseAutoPlay();
      }
      isProgrammaticScroll.current = false;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [handleScroll, pauseAutoPlay]);

  return (
    <section className="mb-24 relative">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
        className="text-center mb-10"
      >
        <p className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--theme-typography-secondary)] font-black">Our solution</p>
        <h2 className="mt-4 text-2xl sm:text-3xl font-black text-[color:var(--theme-typography-main)]"><GlowingText glowType="primary">The five pillars of TANGLAW</GlowingText></h2>
      </motion.div>

      <div className="relative">
        <div
          ref={carouselRef}
          role="list"
          aria-label="The five pillars of TANGLAW"
          className="hide-scrollbar flex gap-6 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth pb-4 px-6 sm:px-0"
          style={{ overscrollBehaviorX: "contain" }}
        >
          {PILLARS.map((pillar, index) => (
            <div
              key={pillar.number}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { pauseAutoPlay(); scrollTo(index); }}}
              onClick={() => { pauseAutoPlay(); scrollTo(index); }}
              className={`
                relative flex-shrink-0 w-[calc(100vw-3rem)] sm:w-[36rem] snap-center
                rounded-3xl border p-6 sm:p-8 md:p-10
                shadow-2xl backdrop-blur-sm
                transition-all duration-500 cursor-pointer
                ${index === activeIndex
                  ? "border-[color:var(--theme-borders-system)]/20 scale-100 opacity-100 bg-[color:var(--theme-surface)]/90"
                  : "border-[color:var(--theme-borders-system)]/5 scale-[0.95] opacity-50 bg-[color:var(--theme-surface)]/60"
                }
              `}
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color:var(--theme-accent-periwinkle)]/5 blur-3xl" />
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[color:var(--theme-accent-periwinkle)]/10 blur-2xl" />

              <div className="relative z-10">
                <div className="mb-4 sm:mb-6 flex items-end justify-between">
                  <span
                    className={`font-display text-6xl sm:text-7xl md:text-8xl font-black italic leading-none bg-gradient-to-br ${PILLAR_NUM_GRADIENTS[index]} bg-clip-text text-transparent`}
                    style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                  >
                    {pillar.number}
                  </span>
                  <div className="mb-1 sm:mb-2 flex h-16 w-16 items-center justify-center rounded-2xl border border-[color:var(--theme-borders-system)]/10 bg-[color:var(--theme-accent-periwinkle)]/8 text-[color:var(--theme-accent-periwinkle)]/70">
                    <pillar.Icon className="h-8 w-8" />
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[color:var(--theme-typography-main)] leading-snug">
                  {pillar.title}
                </h3>

                <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-relaxed text-[color:var(--theme-text-body)]" style={{ textAlign: "justify" }}>
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          onClick={() => { pauseAutoPlay(); prevSlide(); }}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--theme-borders-system)]/10 bg-[color:var(--theme-surface)]/60 text-[color:var(--theme-typography-main)]/40 shadow-lg backdrop-blur-sm transition-all duration-500 hover:border-[color:var(--theme-borders-system)]/25 hover:bg-[color:var(--theme-surface)]/80 hover:text-[color:var(--theme-typography-main)]/80"
          aria-label="Previous pillar"
        >
          <ChevronLeft className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-0.5" />
        </button>

        <div className="flex items-center gap-2">
          {PILLARS.map((_, index) => (
            <button
              key={index}
              onClick={() => { pauseAutoPlay(); scrollTo(index); }}
              className={`rounded-full transition-all duration-500 ${
                index === activeIndex
                  ? "h-2.5 w-8 bg-[color:var(--theme-typography-main)]/60"
                  : "h-2 w-2 bg-[color:var(--theme-borders-system)]/15 hover:bg-[color:var(--theme-borders-system)]/30"
              }`}
              aria-label={`Go to pillar ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => { pauseAutoPlay(); nextSlide(); }}
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--theme-borders-system)]/10 bg-[color:var(--theme-surface)]/60 text-[color:var(--theme-typography-main)]/40 shadow-lg backdrop-blur-sm transition-all duration-500 hover:border-[color:var(--theme-borders-system)]/25 hover:bg-[color:var(--theme-surface)]/80 hover:text-[color:var(--theme-typography-main)]/80"
          aria-label="Next pillar"
        >
          <ChevronRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}
