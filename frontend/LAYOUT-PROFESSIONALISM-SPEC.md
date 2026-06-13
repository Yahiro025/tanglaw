# TANGLAW Layout Professionalism — Implementation Spec

> **Status:** Finalized (Ready for Implementation)
> **Date:** June 13, 2026
> **Scope:** Layout, visual polish, and UX consistency improvements across the entire TANGLAW frontend
> **Tech stack constraints:** Next.js 16 App Router, React 19, Tailwind CSS v4, Framer Motion, lucide-react icons

---

## Executive Summary

This spec defines 6 hypotheses (H3–H8) for upgrading TANGLAW's visual professionalism from "strong student project" to "production-grade web app." Each hypothesis identifies a specific layout weakness, proposes a concrete solution, lists affected files, and defines acceptance criteria.

---

## H3: Feature Card Visual Richness

**Hypothesis:** IF the 3 homepage feature cards get icons, gradient accent borders, and hover micro-interactions, THEN the value proposition will be communicated faster and the page will feel more premium.

### Current State
- **File:** `frontend/src/app/home-client.tsx` (lines ~9–13)
- Feature cards are plain text only: a title and a description string
- Rendered via `FeatureCard` component imported from `../../components/ui/landing-animations`
- No icons, no illustrations, no visual hierarchy beyond typography
- The cards use `FeatureCard` which accepts `title`, `description`, `delay`, and `direction` props

### Proposed Solution

#### 3a. Add icons to each feature card
```tsx
const FEATURES = [
  {
    title: "Scholarship Discovery",
    description: "Browse grant opportunities, filter by academic standing, location, and program requirements.",
    icon: Search,        // lucide-react Search icon
    accent: "periwinkle", // theme accent color key
  },
  {
    title: "AI Guidance",
    description: "Get contextual answers from Owel, the intelligent companion built to simplify requirements and eligibility.",
    icon: Bot,           // lucide-react Bot icon
    accent: "rose",      // theme accent color key
  },
  {
    title: "Exam Readiness",
    description: "Track your preparation with interactive mock drills and analytics designed for scholarship performance.",
    icon: BookOpen,      // lucide-react BookOpen icon
    accent: "muted",     // theme accent color key
  },
];
```

#### 3b. Card visual upgrade
Each card should have:
1. **Icon container** — 48×48 rounded-2xl box with the theme accent as background tint (e.g. `bg-accent-periwinkle/10`) and the icon in the accent color
2. **Gradient left border** — A 3px left border using `border-l-2` with a gradient from the accent color to transparent
3. **Hover state** — `group` class for children, on hover: `translate-y-[-2px]`, `shadow-lg`, border opacity increase
4. **Stagger animation** — Keep existing `delay` prop, use Framer Motion `whileInView` instead of CSS animation for consistency

#### 3c. Updated `FeatureCard` component signature
```tsx
interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "periwinkle" | "rose" | "muted";
  delay: number;
  direction: "up" | "down" | "left" | "right";
}
```

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/app/home-client.tsx` | Update `FEATURES` array with icon/accent props |
| `frontend/src/components/ui/landing-animations.tsx` | Upgrade `FeatureCard` to render icon container, gradient border, hover effects |

### Acceptance Criteria
- [ ] Each card displays an icon in a tinted container above the title
- [ ] Cards have a visible left accent border
- [ ] Hover state lifts the card and deepens the shadow
- [ ] Animations use Framer Motion `whileInView` (not CSS `animate-stagger-*`)
- [ ] Responsive: cards stack vertically on mobile, 3-col grid on md+

---

## H4: Section Visual Rhythm

**Hypothesis:** IF clear visual separators (gradient dividers, alternating section backgrounds, or wave SVG separators) are added between sections, THEN the page will have better visual hierarchy and the "content blob" effect will be eliminated.

### Current State
- **Files:** `frontend/src/app/home-client.tsx`, `frontend/src/app/about/about-client.tsx`
- Landing page sections (hero → features) flow into each other with no visual break
- The body has a subtle radial gradient in `globals.css` but individual sections don't differentiate
- About page uses `ScrollReveal` wrappers but sections share identical background treatment
- No wave/divider SVGs exist in the codebase

### Proposed Solution

#### 4a. Create a reusable `SectionDivider` component
```tsx
// frontend/src/components/ui/section-divider.tsx
interface SectionDividerProps {
  variant: "wave" | "gradient" | "fade";
  flip?: boolean;       // flip horizontally for alternating waves
  colorFrom?: string;   // CSS color for gradient start (default: theme canvas)
  colorTo?: string;     // CSS color for gradient end (default: theme surface)
}
```

Three variants:
1. **`wave`** — SVG wave path (inline, no external asset) with fill matching the next section's background
2. **`gradient`** — A `<div>` with `bg-gradient-to-b` from canvas to surface, height 80–120px
3. **`fade`** — Simple opacity fade using a CSS mask or gradient overlay

#### 4b. Apply to landing page sections
```tsx
// In home-client.tsx — between hero and features section:
<SectionDivider variant="wave" />

// Between features and footer (or any next section):
<SectionDivider variant="gradient" colorFrom="var(--theme-surface)" colorTo="var(--theme-canvas)" />
```

#### 4c. Apply to About page
- Add `SectionDivider variant="gradient"` between the "Barriers to Brilliance" section and the Pillars carousel
- Add `SectionDivider variant="wave" flip` before the Team section

#### 4d. Alternating section backgrounds (subtle)
For the About page, alternate between:
- `bg-[color:var(--theme-canvas)]` (default)
- `bg-[color:var(--theme-surface)]/40` (subtle tint)

Apply every other section with the tinted background to create visual rhythm.

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/components/ui/section-divider.tsx` | **New file** — reusable divider component |
| `frontend/src/app/home-client.tsx` | Insert dividers between hero → features |
| `frontend/src/app/about/about-client.tsx` | Insert dividers between major sections, alternate backgrounds |
| `frontend/src/app/contact/page.tsx` | Insert divider before the form section |

### Acceptance Criteria
- [ ] No two adjacent sections share identical background treatment without a visual separator
- [ ] Wave dividers render as inline SVGs (no external image requests)
- [ ] Dividers are responsive (full-width, height scales with viewport)
- [ ] Alternating backgrounds use at most 2 levels (canvas vs subtle surface tint)
- [ ] Dividers don't create layout shift or overflow issues on mobile

---

## H5: Unified Dashboard Navigation

**Hypothesis:** IF the near-duplicate dashboard navigation code is unified into a single shared component, THEN the nav will be more consistent, divergent bugs will be eliminated, and the dashboard will feel more polished.

### Current State
- **Files:**
  - `frontend/src/components/site-header.tsx` — public page header with pill nav (Home, About, Contact, Dashboard/Login/Signup)
  - `frontend/src/app/dashboard/layout.tsx` — dashboard page header with pill nav (Overview, Scholarships, Readiness)
- Both files independently implement:
  - Scroll-based auto-hide/show behavior (`scrolledAway`, `atTop`, `hovered` state)
  - Invisible trigger zone at top of viewport for reveal
  - Glassmorphism pill nav with `rounded-full`, `backdrop-blur-xl`, `border-white/10`, `bg-surface/60`
  - `NavLink` pattern: uppercase label with active underline indicator
  - Mobile hamburger menu with identical dropdown styling
  - ThemeChanger integration
- The nav styling is ~90% identical but maintained in two separate 200+ line components

### Proposed Solution

#### 5a. Create shared `PillNav` component
```tsx
// frontend/src/components/pill-nav.tsx
interface PillNavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface PillNavProps {
  items: PillNavItem[];
  /** Left-side logo/wordmark slot */
  logoSlot?: React.ReactNode;
  /** Right-side actions slot (ThemeChanger, Logout, etc.) */
  actionsSlot?: React.ReactNode;
  /** Whether to auto-hide on scroll */
  autoHide?: boolean;
  /** Whether this is the dashboard variant (no fixed positioning) */
  isDashboard?: boolean;
}
```

#### 5b. Shared scroll behavior hook
Extract the auto-hide logic into a custom hook:
```tsx
// frontend/src/hooks/use-scroll-hide.ts
export function useScrollHide(options?: { hideThreshold?: number; showThreshold?: number }) {
  // Returns: { isVisible, isAtTop }
  // Manages: scroll listener, hover state, lastScrollY ref
}
```

#### 5c. Refactor both consumers
- `site-header.tsx` → Uses `PillNav` with public items + auth-dependent actions
- `dashboard/layout.tsx` → Uses `PillNav` with dashboard items + logout action
- Remove ~150 lines of duplicated scroll/nav/hamburger logic from each file

#### 5d. Shared mobile menu
Extract the mobile dropdown into `PillNav`'s internal state, so both headers use the exact same hamburger animation, backdrop, and dropdown styling.

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/components/pill-nav.tsx` | **New file** — shared pill navigation component |
| `frontend/src/hooks/use-scroll-hide.ts` | **New file** — shared scroll visibility hook |
| `frontend/src/components/site-header.tsx` | Refactor to use `PillNav`, remove duplicated logic |
| `frontend/src/app/dashboard/layout.tsx` | Refactor to use `PillNav`, remove duplicated logic |

### Acceptance Criteria
- [ ] Both public header and dashboard header render from the same `PillNav` component
- [ ] Scroll auto-hide behavior is identical on both headers
- [ ] Mobile hamburger menu styling is identical on both headers
- [ ] No visual regressions — nav looks the same or better than before
- [ ] Both files reduced by at least 100 lines each
- [ ] All existing functionality preserved (auth-dependent links, theme toggle, logout)

---

## H6: Page Transition Animations

**Hypothesis:** IF consistent route transition animations using Framer Motion's `AnimatePresence` are added, THEN navigation between pages will feel smoother and more app-like.

### Current State
- **Files:** `frontend/src/app/layout.tsx`, individual page files
- No route transition animations exist — pages snap-cut on navigation
- `ScrollReveal` handles within-page scroll animations (Framer Motion `whileInView`)
- `AnimatePresence` is used in `readiness-form.tsx` for view state transitions (setup → active → feedback)
- The root layout has no wrapping `AnimatePresence`

### Proposed Solution

#### 6a. Create `PageTransition` wrapper component
```tsx
// frontend/src/components/ui/page-transition.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.21, 1.02, 0.43, 1.01],
  duration: 0.3,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="flex-grow flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

#### 6b. Wrap in root layout
```tsx
// In layout.tsx — replace:
<main className="flex-grow flex flex-col">{children}</main>

// With:
<main className="flex-grow flex flex-col">
  <PageTransition>{children}</PageTransition>
</main>
```

#### 6c. Performance consideration
- `AnimatePresence` with `mode="wait"` ensures the exit animation completes before the enter animation starts
- Animation is lightweight (opacity + 8px translateY) — negligible performance impact
- Must wrap the client-side router context, so the component must be a Client Component

#### 6d. Dashboard exclusion
The dashboard layout has its own `AuthGuard` wrapper. The `PageTransition` should NOT animate dashboard route changes (they're SPA-like within the dashboard). Solution: only wrap public pages, or check pathname prefix.

```tsx
// In layout.tsx, conditionally apply:
const isDashboard = pathname?.startsWith("/dashboard");

// In the main tag:
{isDashboard ? children : <PageTransition>{children}</PageTransition>}
```

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/components/ui/page-transition.tsx` | **New file** — route transition wrapper |
| `frontend/src/app/layout.tsx` | Import and wrap `{children}` with `PageTransition` |

### Acceptance Criteria
- [ ] Navigating between public pages (Home ↔ About ↔ Contact) triggers a smooth fade+slide animation
- [ ] Dashboard route changes are NOT animated (instant switch)
- [ ] Animation duration ≤ 300ms — feels snappy, not sluggish
- [ ] No layout shift or content flashing during transitions
- [ ] Works with browser back/forward buttons

---

## H7: Loading Skeleton Consistency

**Hypothesis:** IF a unified skeleton loading system replaces the current ad-hoc `animate-pulse` divs, THEN perceived performance and polish will improve.

### Current State
- **Files with ad-hoc skeletons:**
  - `frontend/src/app/about/page.tsx` — `animate-pulse` rounded divs for header loading state
  - `frontend/src/app/dashboard/layout.tsx` — Owel chatbot loading: `h-14 w-14 animate-pulse rounded-full`
  - `frontend/src/components/readiness-form.tsx` — 3 different loading states for ReadinessSetup, ReadinessQuestion, ReadinessFeedback (all `animate-pulse rounded-[2rem]`)
  - `frontend/src/components/scholarship-browser.tsx` — 4 skeleton cards: `animate-pulse rounded-[2rem] p-6 h-64`
- No shared skeleton component exists
- Each page invents its own skeleton shape
- Inconsistent sizing (some use `rounded-[2rem]`, others `rounded-full`)

### Proposed Solution

#### 7a. Create `Skeleton` primitive component
```tsx
// frontend/src/components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string;
  /** Predefined shape variant */
  variant?: "rect" | "circle" | "text" | "card";
  /** Width (Tailwind class or number) */
  width?: string;
  /** Height (Tailwind class or number) */
  height?: string;
}
```

Base styling:
```
animate-pulse rounded-xl bg-[color:var(--theme-surface)]/60
```

#### 7b. Create page-specific skeleton compositions
```tsx
// frontend/src/components/ui/skeletons.tsx

export function ScholarshipCardSkeleton() { ... }
export function AboutPageSkeleton() { ... }
export function ReadinessSetupSkeleton() { ... }
export function DashboardNavSkeleton() { ... }
```

Each uses the `Skeleton` primitive to compose realistic loading shapes that match the actual content layout.

#### 7c. Replace all ad-hoc skeleton instances
| Current Location | Replace With |
|---|---|
| `about/page.tsx` loading prop | `<AboutPageSkeleton />` |
| `dashboard/layout.tsx` Owel loading | `<Skeleton variant="circle" className="h-14 w-14 sm:h-16 sm:w-16" />` |
| `readiness-form.tsx` 3 loading states | `<ReadinessSetupSkeleton />`, `<ReadinessQuestionSkeleton />`, `<ReadinessFeedbackSkeleton />` |
| `scholarship-browser.tsx` card skeletons | `<ScholarshipCardSkeleton />` × 4 |

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/components/ui/skeleton.tsx` | **New file** — base Skeleton primitive |
| `frontend/src/components/ui/skeletons.tsx` | **New file** — page-specific skeleton compositions |
| `frontend/src/app/about/page.tsx` | Replace inline pulse divs |
| `frontend/src/app/dashboard/layout.tsx` | Replace Owel loading placeholder |
| `frontend/src/components/readiness-form.tsx` | Replace 3 loading states |
| `frontend/src/components/scholarship-browser.tsx` | Replace 4 card skeletons |

### Acceptance Criteria
- [ ] Single `Skeleton` component used across all loading states
- [ ] Skeleton shapes visually match the content they replace (same dimensions, same border radius)
- [ ] Consistent pulse animation speed across all skeletons
- [ ] No layout shift when real content replaces skeleton
- [ ] Skeletons respect the current theme (light/dark)

---

## H8: Typography Rhythm Standardization

**Hypothesis:** IF the inconsistent spacing between headings, paragraphs, and sections is standardized into a consistent spacing scale, THEN the overall layout will feel more deliberate and professional.

### Current State
- **Files with spacing inconsistencies:**
  - `home-client.tsx`: hero uses `space-y-8`, feature grid uses `gap-6`, section padding varies `pb-20` to `pb-24`
  - `about-client.tsx`: mission section uses `mb-20`, barriers uses `mb-10`, team uses `space-y-10`
  - `contact/page.tsx`: header uses `mb-14`, form uses `space-y-5`
  - `site-footer.tsx`: uses `py-8`
  - `dashboard/layout.tsx`: main uses `py-6 lg:py-8`
- Heading sizes vary: `text-4xl` to `text-8xl` for h1, `text-2xl` to `text-3xl` for h2
- No consistent vertical rhythm between heading and its following paragraph
- Line-height varies: some `leading-7`, others `leading-8`, some `leading-relaxed`

### Proposed Solution

#### 8a. Define the spacing scale in `globals.css`
```css
/* ── Typography Rhythm Scale ── */
@theme {
  /* Section spacing */
  --space-section-gap: 5rem;      /* 80px — between major sections */
  --space-section-padding-y: 5rem; /* 80px — top/bottom padding of sections */

  /* Component spacing */
  --space-component-gap: 1.5rem;  /* 24px — between cards/elements in a grid */
  --space-element-gap: 1rem;      /* 16px — between related elements */

  /* Text spacing */
  --space-heading-to-body: 0.75rem; /* 12px — gap between heading and first paragraph */
  --space-paragraph: 1rem;          /* 16px — gap between paragraphs */

  /* Typography sizes (enforced scale) */
  --text-display: 4rem;    /* 64px — hero titles only */
  --text-h1: 2.5rem;       /* 40px — page titles */
  --text-h2: 2rem;         /* 32px — section headings */
  --text-h3: 1.5rem;       /* 24px — card/sub-section headings */
  --text-body: 1rem;       /* 16px — body text */
  --text-caption: 0.875rem; /* 14px — captions/labels */
  --text-xs: 0.75rem;      /* 12px — eyebrow labels, badges */
}
```

#### 8b. Standardize section spacing
All major page sections should use:
- **Section gap:** `mb-20` (80px) between sections
- **Section padding:** `py-20` (80px top/bottom) for full-width sections
- **Inner card padding:** `p-8` (32px) for cards within sections

#### 8c. Standardize heading-to-body relationship
Every heading should be followed by its body text with consistent spacing:
```tsx
// Pattern:
<div className="space-y-3">  {/* 12px gap = --space-heading-to-body */}
  <h2 className="text-[length:var(--text-h2)] font-black ...">Section Title</h2>
  <p className="text-[length:var(--text-body)] leading-relaxed ...">Body text</p>
</div>
```

#### 8d. Standardize line heights
| Text type | Line height | Tailwind |
|---|---|---|
| Display / H1 | 1.1 | `leading-none` |
| H2 / H3 | 1.25 | `leading-tight` |
| Body text | 1.625 | `leading-relaxed` |
| Captions | 1.5 | `leading-normal` |
| Eyebrow labels | 1.2 | `leading-none` |

#### 8e. Apply across all pages
Audit and update:
- `home-client.tsx` — hero section, feature cards
- `about-client.tsx` — mission, barriers, pillars, team sections
- `contact/page.tsx` — header, form, info panel
- `site-footer.tsx` — footer text
- `dashboard/layout.tsx` — dashboard main content area
- `scholarship-browser.tsx` — filter panel, card grid
- `owel-chatbot.tsx` — chat panel typography

### Affected Files
| File | Change |
|------|--------|
| `frontend/src/app/globals.css` | Add typography rhythm CSS custom properties |
| `frontend/src/app/home-client.tsx` | Standardize section spacing and heading sizes |
| `frontend/src/app/about/about-client.tsx` | Standardize section spacing and heading sizes |
| `frontend/src/app/contact/page.tsx` | Standardize section spacing and heading sizes |
| `frontend/src/components/site-footer.tsx` | Align to spacing scale |
| `frontend/src/components/scholarship-browser.tsx` | Standardize card/grid spacing |

### Acceptance Criteria
- [ ] All section gaps are consistently `mb-20` (80px)
- [ ] All heading-to-body gaps use `space-y-3` (12px)
- [ ] Heading size scale is consistent: display (64px) → h1 (40px) → h2 (32px) → h3 (24px)
- [ ] Line heights follow the defined scale
- [ ] No arbitrary spacing values (everything derives from the scale)
- [ ] Visual audit: scrolling through any page should feel rhythmically consistent

---

## MiMo 2.5 Execution Plan

**Context for MiMo 2.5:** 
You are an advanced AI agent. To execute this spec flawlessly without hallucinating or breaking the build, follow these strict operational rules:
1. **Never guess line numbers.** Always use your file-reading or grep tools to inspect the target file before writing.
2. **Use precise edits.** Use targeted text replacement tools (`replace_file_content` or `multi_replace_file_content`) instead of completely rewriting files to conserve context and avoid truncation.
3. **One phase per turn.** Focus on one logical phase at a time to avoid context exhaustion and divergent bugs.
4. **Preserve boundaries.** Pay close attention to `"use client"` directives and existing imports. Do not accidentally delete unrelated imports when refactoring (especially in `site-header.tsx` and `layout.tsx`).

### Phase 1: Foundational Spacing (H8)
1. Read `frontend/src/app/globals.css`.
2. Append the `--space-*` and `--text-*` variables exactly as defined in 8a using a precise edit.
3. Read `frontend/src/app/home-client.tsx` and `about-client.tsx`. Identify arbitrary spacing (e.g., `mb-10`, `pb-24`) and replace them with `mb-20`, `space-y-3`, etc., matching the new scale.
4. *Verify:* Use `grep` to ensure no rogue `text-5xl` or `text-7xl` classes remain in the hero sections.

### Phase 2: Primitive Creation (H7 & H6)
1. Create `frontend/src/components/ui/skeleton.tsx`. It can be a simple functional component.
2. Create `frontend/src/components/ui/skeletons.tsx` and define the specific skeleton compositions for cards, headers, etc.
3. Create `frontend/src/components/ui/page-transition.tsx` (Must include `"use client"` and `AnimatePresence`).
4. Read `frontend/src/app/layout.tsx` and wrap the `{children}` with `PageTransition`. Use a precise replacement block. Do not break the HTML/body tags.

### Phase 3: Nav Unification (H5) - *High Risk*
*MiMo Note: This phase requires careful refactoring of stateful components. Do not rush.*
1. Read **both** `site-header.tsx` and `dashboard/layout.tsx` fully to understand the duplicated state.
2. Create `frontend/src/hooks/use-scroll-hide.ts`.
3. Create `frontend/src/components/pill-nav.tsx`.
4. Refactor `site-header.tsx` to consume `PillNav`. 
5. Refactor `dashboard/layout.tsx` to consume `PillNav`. Ensure the `Logout` action is mapped correctly to the `actionsSlot`.

### Phase 4: Visual Polish (H3 & H4)
1. Edit `home-client.tsx` to add `icon` properties to the `FEATURES` array. Make sure you import `Search`, `Bot`, `BookOpen` from `lucide-react`.
2. Update `FeatureCard` in `landing-animations.tsx`. Replace the CSS stagger with `<motion.div whileInView={{ ... }}>`. 
3. Create `section-divider.tsx` with the 3 variants. For the SVG wave, generate a clean inline path without external URLs.
4. Inject the `<SectionDivider>` components into the appropriate layout gaps.

---

## MiMo 2.5 Validation Checklist

Before declaring the task complete, MiMo 2.5 must verify structural integrity. If you have terminal access, run these commands. If not, explicitly ask the user to run them:

1. `npx tsc --noEmit` - Crucial to ensure no TypeScript interface mismatches were introduced during the `FeatureCard` or `PillNav` refactor.
2. `npm run lint` - Ensure no unused imports were left behind after refactoring.
3. `npm run build` - Ensure the Next.js build succeeds and no Client/Server component boundary rules were violated by the new wrappers.
