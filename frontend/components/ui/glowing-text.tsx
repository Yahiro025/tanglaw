'use client';

import React from 'react';
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
  return (
    <span
      className={cn('animate-glow-pulse', glowClasses[glowType], className)}
    >
      {children}
    </span>
  );
}
