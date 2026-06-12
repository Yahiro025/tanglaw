'use client';

import React, { useLayoutEffect, useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ISourceOptions } from '@tsparticles/engine';

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

const darkColors = ['#ffffff', '#ffd700', '#a78bfa'];
const lightColors = ['#0f172a', '#1d4ed8', '#7C3AED'];

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
  const pathname = usePathname();

  // ParticlesProvider handles engine init internally; we just guard visibility

  // ─── Visibility-based pause (WS-1 triple-guard pattern) ──────────────────
  const [isVisible, setIsVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTestMode = typeof window !== 'undefined' && (window as any).__TEST_MODE__;

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    // In test mode, keep particles visible and skip performance guards
    if (isTestMode) return;

    const container = containerRef.current;
    if (!container) return;

    // IntersectionObserver: pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          resetIdleTimer();
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    // Tab visibility
    const handleVisibility = () => {
      if (document.hidden) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
        resetIdleTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Idle detection: reset on user activity
    const handleActivity = () => {
      setIsVisible(true);
      resetIdleTimer();
    };
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });

    // Start idle timer
    resetIdleTimer();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, isTestMode]);

  // ─── tsParticles options (useMemo for performance) ───────────────────────
  const options = useMemo<ISourceOptions>(() => ({
    particles: {
      number: {
        value: countDesktop,
      },
      color: { value: isDark ? darkColors : lightColors },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: isDark ? 1.0 : 0.95 },
      },
      size: {
        value: { min: size + 1, max: size + 4 },
      },
      links: { enable: false },
      move: {
        enable: true,
        speed: 1.2,
        direction: 'top',
        random: true,
        straight: false,
        outModes: { default: 'out' },
      },
    },
    interactivity: {
      detectsOn: 'window',
      events: {
        onHover: {
          enable: false,
          mode: 'repulse',
        },
        onClick: {
          enable: false,
          mode: 'push',
        },
        resize: true,
      },
      modes: {
        repulse: {
          distance: 120,
          duration: 0.4,
        },
        push: {
          quantity: 4,
        },
      },
    },
    detectRetina: true,
    responsive: [
      {
        maxWidth: 1024,
        options: { particles: { number: { value: countTablet } } },
      },
      {
        maxWidth: 768,
        options: { particles: { number: { value: countMobile } } },
      },
    ],
  }), [isDark, countDesktop, countTablet, countMobile, size]);

  // ─── CSS glow variable ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    applyCanvasGlow(
      isDark
        ? 'drop-shadow(0 0 12px rgba(255,235,200,0.80)) drop-shadow(0 0 40px rgba(255,235,200,0.45)) drop-shadow(0 0 80px rgba(255,215,0,0.20))'
        : 'drop-shadow(0 0 14px rgba(29,78,216,0.75)) drop-shadow(0 0 40px rgba(124,58,237,0.35)) drop-shadow(0 0 80px rgba(29,78,216,0.15))'
    );
  }, [isDark]);

  // Skip rendering on dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 w-full h-full pointer-events-none z-[1] transition-opacity duration-700',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        filter: `var(${GLOW_CSS_VAR})`,
      }}
    >
      {isVisible && (
        <ParticlesProvider init={loadSlim}>
          <Particles
            id="tanglaw-particles"
            options={options}
            className="w-full h-full block"
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </ParticlesProvider>
      )}
    </div>
  );
};

export default ParticlesBackground;
