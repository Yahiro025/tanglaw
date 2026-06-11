'use client';

import React, { useLayoutEffect, useRef, useCallback } from 'react';
import Script from 'next/script';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    particlesJS: any;
  }
}

interface ParticlesBackgroundProps {
  size?: number;
  countDesktop?: number;
  countTablet?: number;
  countMobile?: number;
  className?: string;
}

const GLOW_CSS_VAR = '--particles-glow-filter';

function applyCanvasGlow(glowFilter: string) {
  document.documentElement.style.setProperty(GLOW_CSS_VAR, glowFilter);
}

const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  size = 4,
  countDesktop = 70,
  countTablet = 50,
  countMobile = 30,
  className,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);

  // TANGLAW BRAND COLORS
  // Dark Mode (Deep Navy background): Glowing White, Star Gold, Soft Owel Purple
  const darkColors = ['#ffffff', '#ffd700', '#a78bfa'];
  // Light Mode (Verdant Sage background): Deep Navy, Royal Blue, Vivid Violet
  const lightColors = ['#0f172a', '#1d4ed8', '#7C3AED'];

  const initParticles = useCallback(() => {
    const container = containerRef.current;
    if (!container || !window.particlesJS) return;

    window.particlesJS(container.id, {
      particles: {
        number: {
          value:
            window.innerWidth > 1024
              ? countDesktop
              : window.innerWidth > 768
                ? countTablet
                : countMobile,
        },
        color: { value: isDark ? darkColors : lightColors },
        shape: { type: 'circle' },
        opacity: {
          value: isDark ? 1.0 : 0.95,
          random: true,
        },
        size: {
          value: size + 2,
          random: true,
        },
        line_linked: { enable: false },
        move: {
          enable: true,
          speed: 1.2,
          direction: 'top',
          random: true,
          straight: false,
          out_mode: 'out',
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
      },
      retina_detect: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update CSS variable for canvas glow synchronously — enhanced for maximum luminosity
    applyCanvasGlow(
      isDark
        ? 'drop-shadow(0 0 12px rgba(255,235,200,0.80)) drop-shadow(0 0 40px rgba(255,235,200,0.45)) drop-shadow(0 0 80px rgba(255,215,0,0.20))'
        : 'drop-shadow(0 0 14px rgba(29,78,216,0.75)) drop-shadow(0 0 40px rgba(124,58,237,0.35)) drop-shadow(0 0 80px rgba(29,78,216,0.15))'
    );

    // Clean up existing canvas to prevent stacking when theme changes
    container.innerHTML = '';

    // If particlesJS is already loaded, init immediately
    if (window.particlesJS) {
      initParticles();
    }

    return () => {
      // Cleanup handled by particles.js itself
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, size, countDesktop, countTablet, countMobile]);

  return (
    <div
      id="tanglaw-particles"
      ref={containerRef}
      className={cn(
        "fixed inset-0 w-full h-full pointer-events-none z-[1] transition-opacity duration-700",
        className
      )}
      style={{
        filter: `var(${GLOW_CSS_VAR})`,
      }}
    >
      <Script
        src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        strategy="lazyOnload"
        onLoad={() => initParticles()}
      />
    </div>
  );
};

export default ParticlesBackground;
