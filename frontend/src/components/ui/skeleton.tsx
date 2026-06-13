"use client";

/**
 * Unified skeleton loading system for TANGLAW.
 * Replaces ad-hoc animate-pulse divs with consistent, themed loading states.
 */

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text" | "card";
}

function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const base = "animate-pulse bg-[color:var(--theme-surface)]/60";
  const shapes: Record<string, string> = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded-md h-4",
    card: "rounded-[2rem]",
  };
  return <div className={`${base} ${shapes[variant]} ${className}`} />;
}

export { Skeleton };

/* ── Page-specific skeleton compositions ──────────────────────────── */

export function ScholarshipCardSkeleton() {
  return (
    <div className="bg-[color:var(--theme-surface)]/80 border-2 border-[color:var(--theme-accent-muted)]/40 rounded-[2rem] p-6 h-64 animate-pulse" />
  );
}

export function AboutPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" className="w-48 h-3" />
      <Skeleton variant="text" className="w-full h-8" />
      <Skeleton variant="text" className="w-3/4 h-4" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton variant="card" className="h-64" />
        <Skeleton variant="card" className="h-64" />
      </div>
    </div>
  );
}

export function ReadinessSetupSkeleton() {
  return (
    <div className="h-[600px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />
  );
}

export function ReadinessQuestionSkeleton() {
  return (
    <div className="h-[400px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />
  );
}

export function ReadinessFeedbackSkeleton() {
  return (
    <div className="h-[500px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />
  );
}

export function DashboardNavSkeleton() {
  return (
    <Skeleton variant="circle" className="h-14 w-14 sm:h-16 sm:w-16" />
  );
}
