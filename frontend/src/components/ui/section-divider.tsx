"use client";

/**
 * Reusable section dividers for visual rhythm between page sections.
 * Three variants: wave (SVG), gradient, and fade.
 */
import React from "react";

interface SectionDividerProps {
  variant: "wave" | "gradient" | "fade";
  flip?: boolean;
  colorFrom?: string;
  colorTo?: string;
}

function SectionDivider({
  variant,
  flip = false,
  colorFrom = "var(--theme-canvas)",
  colorTo = "var(--theme-surface)",
}: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div
        className={`relative w-full overflow-hidden leading-[0] ${flip ? "rotate-180" : ""}`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block w-full h-16 sm:h-20 md:h-24"
        >
          <path
            d="M0,64 C180,120 360,0 540,64 C720,128 900,16 1080,80 C1260,144 1380,48 1440,64 L1440,120 L0,120 Z"
            fill={colorTo}
          />
        </svg>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        className="w-full h-12 sm:h-16 md:h-20"
        style={{
          background: `linear-gradient(to bottom, ${colorFrom}, ${colorTo})`,
        }}
        aria-hidden="true"
      />
    );
  }

  // fade
  return (
    <div
      className="w-full h-16 sm:h-20"
      style={{
        background: `linear-gradient(to bottom, transparent, ${colorTo})`,
      }}
      aria-hidden="true"
    />
  );
}

export { SectionDivider };
export type { SectionDividerProps };
