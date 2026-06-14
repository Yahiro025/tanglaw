'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlowingTextProps {
  children: React.ReactNode;
  className?: string;
  glowType?: 'primary' | 'secondary' | 'accent';
}

const glowClasses = {
  primary: 'glow-primary',
  secondary: 'glow-secondary',
  accent: 'glow-accent',
};

export function GlowingText({ children, className, glowType = 'primary' }: GlowingTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      className={cn('animate-glow-pulse', glowClasses[glowType], !isInView && 'animate-glow-pause', className)}
    >
      {children}
    </span>
  );
}
