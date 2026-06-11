# TANGLAW Frontend Performance Optimization — Specification v2.0.0
## DeepSeek V4 Pro-Tailored Implementation Guide

> **TARGET MODEL:** DeepSeek V4 Pro (Codebuff primary). Falls back to deepseek-v4-flash.
> **CRITICAL:** Read the "DeepSeek-Specific Instructions" section before EVERY workstream. It contains anti-hallucination anchors that prevent the most common DeepSeek failure modes in this codebase.

---

## Meta

| Field | Value |
|------|-------|
| **Spec version** | 2.0.0 (DeepSeek V4 Pro-tailored) |
| **Created** | June 11, 2026 |
| **Based on** | Full audit of 29 TSX files, Next.js 16 build analysis, PageSpeed Insights, 3 rounds of user interviews, Context7 live-doc verification |
| **Primary goal** | Improve TBT/INP (interactivity) without removing any animation, UI element, or component |
| **Hard constraint** | **ZERO visual regressions** — every animation, every UI piece, every component survives |

---

## DeepSeek V4 Pro Model Profile

### Known Strengths
- **Multi-step reasoning:** Excels at long-chain instruction following when steps are clearly numbered
- **Inference from constraints:** Can handle "do X but not Y" style instructions well
- **Code editing with context:** Strong when given explicit file contents and told exactly which lines to modify

### Known Weaknesses (Avoid These Patterns)
| Weakness | Manifestation | Prevention |
|----------|--------------|------------|
| **API Hallucination** | Invents method names, config keys, or import paths that don't exist | Every workstream includes verified API signatures from Context7 |
| **Context Loss** | Ignores existing codebase patterns, writes standard boilerplate instead | "BEFORE EDITING, READ" section on every workstream |
| **Import Orphaning** | Changes implementation but forgets to update imports or downstream callers | "AFTER EDITING, VERIFY" checklist on every workstream |
| **Config key fabrication** | Inventing experimental config keys (e.g., `experimental.optimizeCss` does NOT exist in Next.js 16) | All config keys verified via `npx ctx7 docs` |
| **Type widening** | Replaces specific types with `any` or overly broad types | Explicit type signatures provided for all new functions |

### Mandatory Workflow Per Workstream
1. **BEFORE EDITING:** Run the Context7 fetch command shown in the workstream. Read the specified files fully.
2. **DURING EDITING:** Follow the "DO" / "DO NOT DO" lists exactly. Use `str_replace` for targeted edits.
3. **AFTER EDITING:** Run `npx tsc --noEmit` from `frontend/`. Fix any type errors BEFORE moving on.

---

## User Preferences (from 3 interview rounds)

| Decision | Chosen approach |
|----------|----------------|
| Performance priority | TBT/INP (interactivity) |
| Canvas animations (3 total) | **Visibility-based pause** — pause when tab hidden, off-screen, or idle 5s+ |
| Scholarship data (1,127 lines) | **Dynamic import with skeleton** |
| Component splitting | **Full refactor** — one logical component per file |
| Framer Motion (15 files) | **Viewport-only** — use `whileInView`, not `animate` |
| Question bank (250 items) | **Generate per-subject on-demand** |
| particles.js CDN | **Migrate to tsParticles** (npm packages, same visuals) |
| Google Fonts | **Self-host with next/font** — explicit weight subsets |
| Validation | **Full** — build, typecheck, Lighthouse, bundle analyzer |
| Next.js config | **Maximal** — all verified optimizations |

---

## API Corrections (Critical — Read Before Any Workstream)

The original spec contained API inaccuracies. Context7 live-doc verification corrected these:

| Original (WRONG) | Correct (VERIFIED) | Source |
|------------------|-------------------|--------|
| `modularizeImports: { "lucide-react": { transform: "..." } }` | **Already handled** by `experimental.optimizePackageImports: ["lucide-react"]` in next.config.ts. `modularizeImports` is **deprecated** in Next.js 16. | Context7 `/vercel/next.js` |
| `experimental.optimizeCss: true` | **Does NOT exist** in Next.js 16. Remove from plan. | Context7 `/vercel/next.js` |
| `poweredByHeader: false` | Not documented. Skip — negligible impact. | Context7 `/vercel/next.js` |
| tsParticles: install `tsparticles` + `@tsparticles/react` | Install **3 packages**: `@tsparticles/react`, `@tsparticles/engine`, `@tsparticles/slim` | tsParticles docs |
| tsParticles: `line_linked: { enable: false }` | Config key is **`links: { enable: false }`** | tsParticles migration guide |
| tsParticles: responsive handled automatically | Must use explicit **`responsive` array** in options | tsParticles docs |
| tsParticles: can render directly | **Must call `initParticlesEngine`** before component renders | tsParticles docs |

---

## Optimization Plan — 10 Workstreams (DeepSeek-Tailored)

---

### WS-1: Canvas Animation Pausing
**Priority:** CRITICAL | **Files:** 3 | **Depends on:** Nothing

#### BEFORE EDITING, READ:
- `frontend/src/components/nature-canvas.tsx` (lines 1-301, study the existing visibility + tab-pause pattern at lines ~165-195)
- `frontend/components/ui/particles-background.tsx` (lines 1-134)
- `frontend/components/ui/etheral-shadow.tsx` (lines 1-109)

#### Context7 Verification:
```bash
npx ctx7 docs /vercel/next.js "IntersectionObserver in useEffect cleanup pattern"
```

#### Changes (nature-canvas.tsx — STUDY the pattern, EXTEND it)

**DO:**
- Read lines 165-195 of nature-canvas.tsx — this is the reference implementation of the triple-guard pattern
- The pattern uses: `let isRunning = true` flag + `document.addEventListener("visibilitychange", ...)` + `new IntersectionObserver(...)` + checks `isRunning` before every `requestAnimationFrame` call
- Apply this EXACT pattern to particles-background.tsx and etheral-shadow.tsx

**DO NOT DO:**
- Do NOT change particle count (55), colors, sway behavior, or offscreen caching in NatureCanvas
- Do NOT change the tsParticles config colors, counts (70/50/30), or CSS drop-shadow filter
- Do NOT change the SVG feTurbulence, noise overlay, or mask-image in EtheralShadow
- Do NOT use `useMemo` for the observer — it must be inside `useEffect` with the canvas ref as dependency

#### Changes (particles-background.tsx — ADD the pause pattern)

**DO:**
- Add `const [isVisible, setIsVisible] = useState(true)` near the top
- Add a `useEffect` that creates an `IntersectionObserver` watching `containerRef.current` with `{ threshold: 0.01 }`
- Add a `visibilitychange` listener that sets `isVisible` to `!document.hidden`
- Add an idle timer: reset on mousemove/scroll/touchstart, pause after 5000ms
- Guard `initParticles()` call: only call when `isVisible` is true AND tsParticles has not already been initialized
- **IMPORTANT:** When `isVisible` becomes false, do NOT destroy the particles canvas — just stop calling initParticles. The canvas content freezes in place (acceptable).

**DO NOT DO:**
- Do NOT change the tsParticles options object (if WS-2 hasn't run yet, this file still uses particles.js)
- Do NOT remove the `cleanup()` return in useEffect — add the new listeners alongside it
- Do NOT use `useCallback` for the visibility handler — a regular function in useEffect is fine

#### Changes (etheral-shadow.tsx — ADD the pause pattern)

**DO:**
- Add a `useRef<HTMLDivElement>(null)` for the container div
- Add an `IntersectionObserver` in useEffect that pauses the SVG `<animate>` element by setting `animation-play-state: paused` via a CSS custom property
- Add `document.visibilitychange` listener
- The SVG feColorMatrix `<animate>` element is the main CPU consumer — target it specifically
- When not visible, set `animationPlayState: 'paused'` on the SVG element. When visible, set to `'running'`.

**DO NOT DO:**
- Do NOT remove the SVG filter or animation elements — only pause them
- Do NOT change the mask-image URL or noise overlay

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

**Expected savings:** TBT -150ms, memory -20MB idle

---

### WS-2: tsParticles Migration
**Priority:** HIGH | **Files:** 2 | **Depends on:** Nothing

#### BEFORE EDITING, READ:
- `frontend/components/ui/particles-background.tsx` (entire file)
- `frontend/package.json` (dependencies section)

#### Context7 Verification:
```bash
npx ctx7 library tsparticles "React component setup with @tsparticles/react initParticlesEngine loadSlim"
npx ctx7 docs /tsparticles/tsparticles "responsive breakpoint configuration for different particle counts"
```

#### Install Packages:
```bash
cd frontend && npm install @tsparticles/react @tsparticles/engine @tsparticles/slim
```
These are the **verified** package names. Do NOT install `tsparticles` (without @scope) or `react-particles` — those are different/legacy packages.

#### Changes (particles-background.tsx — REWRITE using tsParticles)

**DO:**
```typescript
// VERIFIED import structure (copy EXACTLY):
import { useMemo } from "react";
import Particles from "@tsparticles/react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";
```

- Add `const [engineReady, setEngineReady] = useState(false)` state
- Add a `useEffect` that calls `initParticlesEngine(async (engine: Engine) => { await loadSlim(engine); }).then(() => setEngineReady(true))` — this runs ONCE on mount
- Only render `<Particles>` when `engineReady` is true AND `isVisible` is true (from WS-1)
- Wrap the options object in `useMemo` with `[isDark]` dependency (theme changes trigger re-memo)
- Use the `responsive` array for breakpoint counts:

```typescript
// VERIFIED responsive config format:
responsive: [
  { maxWidth: 1024, options: { particles: { number: { value: 50 } } } },
  { maxWidth: 768, options: { particles: { number: { value: 30 } } } },
]
```

- Match EXACT visual config (verified migration mapping):
  - particles.js `shape.type: 'circle'` → tsParticles `shape: { type: "circle" }`
  - particles.js `opacity.random: true` → tsParticles `opacity: { value: { min: 0.1, max: 1 } }`
  - particles.js `line_linked.enable: false` → tsParticles `links: { enable: false }`
  - particles.js `move.direction: 'top'` → tsParticles `move: { direction: "top" }`
  - particles.js `move.speed: 1.2` → tsParticles `move: { speed: 1.2 }`
  - particles.js `move.out_mode: 'out'` → tsParticles `move: { outModes: { default: "out" } }`
  - particles.js `interactivity.events.onhover.enable: false` → tsParticles `interactivity: { events: { onHover: { enable: false } } }`
  - particles.js `retina_detect: true` → tsParticles `detectRetina: true` (top-level key, NOT inside particles)

- Apply EXACT same dark/light colors:
  - `isDark ? ['#ffffff', '#ffd700', '#a78bfa'] : ['#0f172a', '#1d4ed8', '#7C3AED']`
- Apply the EXACT same CSS drop-shadow filter via the `style` prop on the wrapping div (the CSS custom property `--particles-glow-filter` pattern)

**DO NOT DO:**
- Do NOT import from `"tsparticles"` or `"react-tsparticles"` — these are different packages
- Do NOT use `particlesJS()` or `window.particlesJS` — these are the old library
- Do NOT render `<Particles>` without checking `engineReady` — it will crash
- Do NOT put the options object directly in JSX — always use `useMemo` (otherwise infinite re-renders)
- Do NOT use `line_linked` in the config — tsParticles uses `links`
- Do NOT forget the `responsive` array — breakpoint counts won't work without it

#### Changes (package.json — NO manual edits)

Do NOT edit package.json directly. The `npm install` command above handles package.json updates.

#### Changes (dynamic-backgrounds.tsx — MINIMAL update)

The `DynamicParticlesBackground` already uses `dynamic(() => import("../../components/ui/particles-background"), { ssr: false })`. tsParticles works identically with this dynamic import pattern — the SSR guard is already correct. No changes needed here.

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

**Expected savings:** Eliminates CDN dependency, -15KB effective payload

---

### WS-3: Scholarship Data Dynamic Import
**Priority:** HIGH | **Files:** 1 | **Depends on:** Nothing (can run with Phase 1)

#### BEFORE EDITING, READ:
- `frontend/src/components/scholarship-browser.tsx` (lines 1-543, study: import on line 10, useState on lines 79-83, filteredScholarships useMemo on lines 111-136, and the return JSX from lines 143-530)
- `frontend/src/data/scholarships-data.ts` (lines 1-15: note the exported interface and const)

#### Context7 Verification:
```bash
npx ctx7 docs /vercel/next.js "dynamic import lazy loading component with loading skeleton fallback"
```

#### Changes (scholarship-browser.tsx — specific surgical edits)

**DO:**

**Step 1:** Remove the static import on line 10:
```
REMOVE: import { SCHOLARSHIPS_DATA, ScholarshipOpportunity } from "@/data/scholarships-data";
```

**Step 2:** Add a module-scoped cache variable and loader at the top (after imports, before component):
```typescript
// VERIFIED pattern — module-scoped cache prevents re-fetch:
let cachedScholarships: ScholarshipOpportunity[] | null = null;

async function loadScholarships(): Promise<ScholarshipOpportunity[]> {
  if (cachedScholarships) return cachedScholarships;
  const mod = await import("@/data/scholarships-data");
  cachedScholarships = mod.SCHOLARSHIPS_DATA;
  return cachedScholarships;
}
```

**Step 3:** Add type-only import for the interface (doesn't add to bundle):
```typescript
import type { ScholarshipOpportunity } from "@/data/scholarships-data";
```
Note: `import type` is erased at compile time — zero runtime cost.

**Step 4:** Add loading state near the existing useState declarations (around line 79):
```typescript
const [scholarships, setScholarships] = useState<ScholarshipOpportunity[]>([]);
const [isLoading, setIsLoading] = useState(true);
```
Replace the existing `const [scholarships] = useState<ScholarshipOpportunity[]>(SCHOLARSHIPS_DATA);` with the above.

**Step 5:** Add a useEffect to load data (after the last existing useEffect, around lines 100-110):
```typescript
useEffect(() => {
  let cancelled = false;
  loadScholarships().then(data => {
    if (!cancelled) {
      setScholarships(data);
      setIsLoading(false);
    }
  });
  return () => { cancelled = true; };
}, []);
```

**Step 6:** Add skeleton rendering. Find the JSX section that starts with `{filteredScholarships.length > 0 ? (` (around line 268). Wrap it: show 4 pulsing skeleton cards when `isLoading` is true, same grid layout:
```tsx
{isLoading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-[color:var(--theme-surface)]/80 border-2 border-accent-muted/40 rounded-[2rem] p-6 h-64 animate-pulse" />
    ))}
  </div>
) : filteredScholarships.length > 0 ? (
  // ... existing listing code
)}
```

**Step 7:** Update the "Showing X matching opportunities" text to handle loading state:
```tsx
Showing <span className="text-text-primary font-bold">{isLoading ? "..." : filteredScholarships.length}</span> matching opportunities
```

**DO NOT DO:**
- Do NOT change the `ScholarshipOpportunity` interface or any type definitions in scholarships-data.ts
- Do NOT change any filter logic (`filteredScholarships`, `matchesAcademicStream`, `getNumericIncomeLimit`)
- Do NOT change any card rendering JSX (the expand/collapse, tags, benefits, etc.)
- Do NOT remove the skeleton after data loads without checking `cancelled` flag (React strict mode double-mounts)
- Do NOT use `React.lazy()` or `next/dynamic` for this — those are for components, not data modules

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

**Expected savings:** -100KB+ from initial dashboard/scholarships chunk

---

### WS-4: Component File Splitting
**Priority:** HIGH | **Files:** 8 (4 new, 2 modified) | **Depends on:** WS-3 completed (scholarship-browser must already have dynamic data)

#### BEFORE EDITING, READ:
- `frontend/src/components/readiness-form.tsx` (full 973 lines — study the 3 view states: setup at lines ~228-362, active at lines ~364-673, feedback at lines ~675-925)
- `frontend/src/components/scholarship-browser.tsx` (full 543 lines — study: filter panel at lines ~150-240, card rendering at lines ~270-430, pagination at lines ~430-470)

#### Context7 Verification:
```bash
npx ctx7 docs /vercel/next.js "next dynamic import for code splitting large component"
```

#### DeepSeek Failure Mode Warning
**The #1 failure when splitting components is "Import Orphaning":** You move a function/type to a new file but forget to update imports in the old file, OR you update the parent but forget to export the child with the right signature. Always verify by running `npx tsc --noEmit` after EVERY file extraction, not just at the end.

#### Changes — ReadinessForm Split (4 files created, 1 modified)

**Step 1: Extract `readiness-setup.tsx`** (new file, ~280 lines)

Move these EXACT code blocks from readiness-form.tsx:
- `SUBJECTS` const (line ~20)
- `SubjectType` type alias (line ~23)  
- `handleSubjectChange` function (lines ~178-183)
- All JSX under `{view === "setup" && ...}` (lines ~228-362, the entire setup configuration layer)
- Props interface:
```typescript
// VERIFIED prop interface — copy exactly:
interface ReadinessSetupProps {
  selectedSubjects: SubjectType[];
  onSubjectChange: (subject: SubjectType) => void;
  itemCount: 10 | 15 | 20 | 25;
  onItemCountChange: (count: 10 | 15 | 20 | 25) => void;
  selectedDifficulty: "easy" | "medium" | "hard";
  onDifficultyChange: (diff: "easy" | "medium" | "hard") => void;
  onStartDiagnostics: () => void;
  onStartMockExam: () => void;
}
```
- File path: `frontend/src/components/readiness-setup.tsx` (sibling to readiness-form.tsx)

**Step 2: Extract `readiness-question.tsx`** (new file, ~120 lines)

Move these EXACT code blocks:
- All JSX under the diagnostics path in `{view === "active" && ...}` — specifically the "Option 1 Layout: Simple diagnostic focus card" (lines ~374-420)
- The single question display (question text, options with A/B/C/D letters, Next/Previous buttons, timer display)
- Props interface:
```typescript
interface ReadinessQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | undefined;
  onSelectOption: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  timeLeft: number;
  canGoNext: boolean;
  canGoPrev: boolean;
}
```

**Step 3: Extract `readiness-feedback.tsx`** (new file, ~250 lines)

Move these EXACT code blocks:
- All JSX under `{view === "feedback" && ...}` (lines ~675-925)
- `readinessDetails` useMemo (lines ~358-381) — copy the logic, keep in parent
- `studyRecommendations` useMemo (lines ~383-413)
- `subjectScores` useMemo + `SubjectType` score recording type
- Props interface:
```typescript
interface ReadinessFeedbackProps {
  score: number;
  total: number;
  scorePercentage: number;
  subjectScores: Record<SubjectType, { correct: number; total: number; answered: number }>;
  readinessDetails: { level: string; color: string; icon: JSX.Element; text: string };
  studyRecommendations: string[];
  onRestart: () => void;
}
```

**Step 4: Modify `readiness-form.tsx`** → thin orchestrator (~350 lines remaining)

**DO:**
- Import the 3 new components with `next/dynamic`:
```typescript
// VERIFIED dynamic import pattern:
import dynamic from "next/dynamic";

const ReadinessSetup = dynamic(() => import("./readiness-setup"), {
  loading: () => <SetupSkeleton />,
});
const ReadinessQuestion = dynamic(() => import("./readiness-question"), {
  loading: () => <QuestionSkeleton />,
});
const ReadinessFeedback = dynamic(() => import("./readiness-feedback"), {
  loading: () => <FeedbackSkeleton />,
});
```
- Each `<Skeleton />` is a simple div with the same dimensions as the target component:
  - SetupSkeleton: `<div className="h-[600px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />`
  - QuestionSkeleton: `<div className="h-[400px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />`
  - FeedbackSkeleton: `<div className="h-[500px] animate-pulse rounded-[2rem] bg-[color:var(--theme-surface)]" />`
- Keep all shared state (`view`, `selectedSubjects`, `itemCount`, `selectedDifficulty`, etc.) in the parent
- Keep all timer logic, score computation, and question generation in the parent
- Pass state down as props to each child component

**DO NOT DO:**
- Do NOT change any business logic — timer intervals, score calculation, question shuffling, answer selection
- Do NOT change any `useMemo` computations — move them to the orchestrator, don't rewrite them
- Do NOT change the `Question` interface or any type definitions
- Do NOT change the `generateMockQuestionBank` function (WS-6 handles that separately)
- Do NOT create new state variables — lift existing state up to the orchestrator

#### Changes — ScholarshipBrowser Split (3 files created, 1 modified)

**Step 5: Extract `scholarship-filter-panel.tsx`** (new file, ~150 lines)

Move these EXACT code blocks from scholarship-browser.tsx:
- All JSX inside `<aside className="w-full lg:w-80 flex-shrink-0 ...">` (lines ~150-240)
- Props interface:
```typescript
interface ScholarshipFilterPanelProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  incomeLimit: string;
  onIncomeChange: (value: string) => void;
  scholarshipType: string;
  onTypeChange: (value: string) => void;
  programType: string;
  onProgramChange: (value: string) => void;
  showMobileFilters: boolean;
  onToggleMobile: () => void;
  onReset: () => void;
}
```

**Step 6: Extract `scholarship-card.tsx`** (new file, ~200 lines)

Move these EXACT code blocks:
- The entire `<article key={s.name} ...>` block (lines ~285-430)
- `toggleCard` logic — pass as `onToggle: (name: string) => void`
- Props interface:
```typescript
interface ScholarshipCardProps {
  scholarship: ScholarshipOpportunity;
  isExpanded: boolean;
  onToggle: (name: string) => void;
}
```

**Step 7: Extract `scholarship-pagination.tsx`** (new file, ~50 lines)

Move:
- Pagination JSX (`{totalPages > 1 && (...)}` block, lines ~436-468)
- Props interface:
```typescript
interface ScholarshipPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

**Step 8: Modify `scholarship-browser.tsx`** → thin orchestrator (~300 lines remaining)

**DO:**
- Import the 3 new components
- Keep all state (searchTerm, incomeLimit, scholarshipType, programType, currentPage, expandedCards, showMobileFilters)
- Keep all business logic (debouncedSearch, filteredScholarships, pagination slicing, handleResetFilters, toggleCard)
- Pass state and handlers as props to child components

**DO NOT DO:**
- Do NOT move `getNumericIncomeLimit` or `matchesAcademicStream` — keep them in the orchestrator
- Do NOT move any state or useEffect hooks — they stay in the orchestrator
- Do NOT change any filter logic or debouncing

#### VERIFY AFTER (run after EACH file extraction):
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -40
```
Fix any errors before proceeding to the next extraction. The most common error is missing exports or wrong import paths.

**Expected savings:** Code splits each route into ~5 smaller chunks, faster initial parse

---

### WS-5: Framer Motion → whileInView
**Priority:** HIGH | **Files:** 15 | **Depends on:** Nothing (can run anytime)

#### Context7 Verification:
```bash
npx ctx7 docs /grx7/framer-motion "whileInView prop viewport once amount margin configuration"
```

#### DeepSeek Failure Mode Warning
**The #1 failure is replacing `animate` with `whileInView` but forgetting to add the `viewport` prop.** `whileInView` requires `viewport={{ once: true }}` to avoid re-triggering on every scroll. Without `viewport`, the animation may behave unexpectedly.

#### VERIFIED Framer Motion Pattern
```tsx
// BEFORE (60fps JS evaluation):
<motion.div animate={{ opacity: [0.92, 1, 0.92] }} transition={{ duration: 3, repeat: Infinity }} />

// AFTER (only evaluates when visible):
<motion.div
  whileInView={{ opacity: [0.92, 1, 0.92] }}
  viewport={{ once: false, margin: "-100px" }}
  transition={{ duration: 3, repeat: Infinity }}
/>
```

**Note on `once: false`:** For infinite animations (mascot float, glow pulse), keep `once: false` so they restart when scrolled back into view. For one-shot reveal animations (landing feature cards), use `once: true`.

#### File-by-File Changes

**`glowing-text.tsx` — REPLACE JS animation with CSS:**
- **DO:** Replace `<motion.span animate={{ opacity: [0.92, 1, 0.92] }}>` with:
  ```tsx
  <span className={cn("transition-all duration-700 ease-in-out animate-glow-pulse", className)} style={{ textShadow: getGlowStyles() }}>
  ```
- **DO:** Add to `globals.css`:
  ```css
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.92; }
    50% { opacity: 1; }
  }
  .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
  ```
- **DO NOT DO:** Do NOT remove the `mounted` state check or the `getGlowStyles()` function — they handle theme reactivity

**`landing-animations.tsx` — ADD viewport guards:**
- `MascotWithGlow`: The two glow halo `motion.div`s — change `animate` to `whileInView`, add `viewport={{ once: false, margin: "-200px" }}`
- The mascot float `motion.div` — change `animate={{ y: [0, -20, 0] }}` to `whileInView={{ y: [0, -20, 0] }}`, add `viewport={{ once: false }}`
- `HeroButton`: Keep `whileHover` — it's already conditional on user interaction. Do NOT change.
- `FeatureCard`: Already uses `ScrollReveal` which already uses `whileInView`. No change needed.

**`scroll-reveal.tsx` — ALREADY CORRECT.** Uses `whileInView` with `viewport={{ once: true, margin: "-100px" }}`. No changes needed.

**`readiness-form.tsx` (and its children after WS-4 split):**
- Find every `animate={{ opacity: 0, y: 16 }}` — replace with `initial={{ opacity: 0, y: 16 }}` + `whileInView={{ opacity: 1, y: 0 }}` + `viewport={{ once: true }}`
- Keep `AnimatePresence mode="wait"` — the view transitions (setup→active→feedback) NEED exit animations for UX
- Keep `exit={{ opacity: 0, y: -16 }}` — this is visually critical for the slide-out effect

**`scholarship-browser.tsx` (and children):**
- Keep `AnimatePresence` around the card body — the expand/collapse animation is visually critical
- Add `viewport={{ once: true }}` to the `motion.div` card body animation
- The `motion.div` arrow rotation on toggle button: keep as-is (triggered by user click, not continuous)

**`site-header.tsx` and `dashboard/layout.tsx` — mobile menus:**
- The `AnimatePresence` wrappers around the mobile dropdown: replace with CSS transitions
- **DO:**
  ```tsx
  // Replace AnimatePresence + motion.div with:
  <div className={`transition-all duration-200 ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3 pointer-events-none"}`}>
  ```
- **DO NOT DO:** Do NOT remove the backdrop overlay or the click-outside-to-close behavior

**`initialization-terminal.tsx`:** 
- Keep `AnimatePresence mode="wait"` — the step transitions need exit animations
- Keep `whileHover` on buttons — interactive, not continuous
- Do NOT change the progress bar animation (it's triggered by state change, not continuous)

**`about/page.tsx`, `dashboard/page.tsx`, `dashboard/scholarships/page.tsx`, `dashboard/reviewer/page.tsx`, `login/page.tsx`, `signup/page.tsx`:**
- Replace all `animate={{ opacity: 0, y: ... }}` with `initial={{ opacity: 0, y: ... }}` + `whileInView={{ opacity: 1, y: 0 }}` + `viewport={{ once: true }}`

#### VERIFY AFTER (run after ALL 15 files):
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```
Also visually inspect each page — animations should trigger on scroll-in, not on mount.

**Expected savings:** TBT -100ms, fewer layout recalculations

---

### WS-6: Question Bank On-Demand Generation
**Priority:** MEDIUM | **Files:** 1 | **Depends on:** WS-4 (component split should be done first)

#### BEFORE EDITING, READ:
- `frontend/src/components/readiness-form.tsx` — study `generateMockQuestionBank()` (lines ~25-155), the `useMemo` call (line 158), and how `masterQuestionBank` is used in `handleStartExam` (lines ~200-242)

#### Changes

**DO:**
- Rename `generateMockQuestionBank` → keep the function but extract per-subject logic:
```typescript
// VERIFIED function signature:
function generateSubjectQuestions(subject: SubjectType): Question[] {
  // Only generate the 50 questions for `subject`
  // Use the same algorithm as the original function's per-subject loop (lines ~120-155)
  // Return Question[] with IDs based on subject offset
}
```
- Add a cache ref:
```typescript
const questionCache = useRef<Map<SubjectType, Question[]>>(new Map());
```
- Create a `getQuestionsForSubject(subject: SubjectType): Question[]` function:
  1. Check `questionCache.current.get(subject)` — return cached if exists
  2. Call `generateSubjectQuestions(subject)` — generate 50 questions
  3. Store in cache: `questionCache.current.set(subject, questions)`
  4. Return questions
- Update `handleStartExam("diagnostics")`: generate filter pool by calling `getQuestionsForSubject()` for each selected subject, then flatten
- Update `handleStartExam("mock")`: call `getQuestionsForSubject()` for each subject as the user navigates to it (lazy)
- For the mock exam subject navigator sidebar: when user clicks a subject, call `getQuestionsForSubject(subject)` to populate that subject's block

**DO NOT DO:**
- Do NOT change the question generation algorithm — `sampleData` content, `Question` interface, answer generation logic all stay identical
- Do NOT change how questions are scored or displayed
- Do NOT change the `useMemo` for `score`, `scorePercentage`, `subjectScores`, `readinessDetails`, `studyRecommendations` — they work on `activeQuestions` which is the filtered subset
- Do NOT pre-generate all subjects at once — the goal is lazy per-subject generation

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

**Expected savings:** -80% main thread blocking on mount

---

### WS-7: Google Fonts Self-Hosted
**Priority:** MEDIUM | **Files:** 1 | **Depends on:** Nothing

#### BEFORE EDITING, READ:
- `frontend/src/app/layout.tsx` (lines 1-15: font definitions)

#### Context7 Verification:
```bash
npx ctx7 docs /vercel/next.js "next font google weight array subsets preload variable"
```

#### Changes (layout.tsx — modify font configs only)

**DO:**
- Replace the two font definitions with the VERIFIED pattern:
```typescript
// VERIFIED next/font/google config for Next.js 16:
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "900"],  // explicit weights = self-hosted
  preload: true,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["700", "900"],  // only bold weights needed for display font
  preload: true,
});
```
- Key behavior: When `weight` is specified, Next.js 16 **automatically self-hosts** the fonts at build time. No CDN call is made.

**DO NOT DO:**
- Do NOT add `axes` or `style` properties — they're not needed for Inter/Outfit
- Do NOT remove the `variable` property — it's used in the `<html>` className for CSS custom properties
- Do NOT remove `display: "swap"` — it prevents layout shift during font load
- Do NOT change the className template on `<html>` — it depends on these variables

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```

**Expected savings:** Eliminates font network round-trips, faster LCP

---

### WS-8: Next.js Config Optimizations
**Priority:** MEDIUM | **Files:** 1 (+ package.json) | **Depends on:** Nothing

#### BEFORE EDITING, READ:
- `frontend/next.config.ts` (entire file — 24 lines)

#### Context7 Verification:
```bash
npx ctx7 docs /vercel/next.js "next.config.ts TypeScript config output standalone experimental optimizePackageImports"
```

#### API Corrections from Context7 (CRITICAL — Read Before Editing)
| Config key in original spec | Status in Next.js 16 | Action |
|---------------------------|----------------------|--------|
| `modularizeImports` | **DEPRECATED** — superseded by `experimental.optimizePackageImports` | Do NOT add. Already configured. |
| `experimental.optimizeCss` | **DOES NOT EXIST** in Next.js 16 docs | Do NOT add. Will cause build error. |
| `poweredByHeader` | Not documented / may not exist | Skip — negligible impact. |
| `output: "standalone"` | **VERIFIED** — correct | Add to config. |

#### Changes (next.config.ts)

**DO:**
- Add `output: "standalone"` to the config object (this is a top-level key, NOT inside experimental):
```typescript
// VERIFIED: top-level config key
output: "standalone",
```
- The existing `experimental.optimizePackageImports: ["framer-motion", "lucide-react"]` is already correct and sufficient. Do NOT change it or add a `modularizeImports` block.
- **Fix the Cache-Control warning:** Remove the `/_next/static/(.*)` source block from the `headers()` function. Next.js 16 internally manages these headers. Keep only the `/assets/(.*)` block:
```typescript
async headers() {
  return [
    {
      source: "/assets/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
    // REMOVED: the /_next/static/(.*) block — Next.js handles this
  ];
},
```

**DO NOT DO:**
- Do NOT add `modularizeImports` — it's deprecated and will cause warnings
- Do NOT add `experimental.optimizeCss` — it doesn't exist and will break the build
- Do NOT add `poweredByHeader` — not verified to exist
- Do NOT remove `images.formats` or `images.deviceSizes` — they're useful optimizations
- Do NOT change the `optimizePackageImports` array — framer-motion and lucide-react are the correct entries

#### Changes (package.json — ADD build:analyze script)

**DO:**
- Install `@next/bundle-analyzer` as devDependency:
```bash
cd frontend && npm install -D @next/bundle-analyzer
```
- Add to package.json scripts (use str_replace, NOT write_file — only touch the scripts section):
```json
"analyze": "ANALYZE=true next build"
```

**DO NOT DO:**
- Do NOT rewrite the entire package.json — only add the one script line

#### VERIFY AFTER:
```bash
cd frontend && npm run build 2>&1 | tail -20
```
Check: build succeeds, no Cache-Control warning, no config warnings.

**Expected savings:** -15-30KB from lucide tree-shaking (already configured), CSS inlining for critical path (standalone output)

---

### WS-9: Icon Import Cleanup
**Priority:** LOW-MEDIUM | **Files:** 12 | **Depends on:** WS-4 (component split may reveal unused icons)

#### BEFORE EDITING, READ:
All files listed in the code search result that import from lucide-react (from the original audit). Specifically:
- `scholarship-browser.tsx` — 15 icons
- `readiness-form.tsx` — 12 icons
- `initialization-terminal.tsx` — 7 icons
- `owel-chatbot.tsx` — 4 icons
- All other files with lucide-react imports

#### Changes

**DO:**
- After WS-4 component splitting: for each extracted child component, only import the icons it actually uses
- For example: after splitting scholarship-browser.tsx, `scholarship-filter-panel.tsx` should import only `Search, SlidersHorizontal, DollarSign, Building2, BookOpen` (the icons actually used in the filter panel JSX)
- Run a grep to find any icon that is imported but never used in JSX:
```bash
cd frontend && grep -r "from \"lucide-react\"" src/ components/ --include="*.tsx" -A 0
```

**DO NOT DO:**
- Do NOT change how icons are rendered — keep same className, size (h-4 w-4, h-5 w-5), and color classes
- Do NOT remove icons that are used in conditional renders or maps — verify each icon appears somewhere in JSX

#### VERIFY AFTER:
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -30
```
TypeScript will flag any icon that is imported but its type is not used in JSX.

**Expected savings:** -5-10KB from removed dead icon imports

---

### WS-10: Build Analysis & Validation
**Priority:** PROCESS | **Files:** 1 (new PERF-REPORT.md) | **Depends on:** All other workstreams

#### BEFORE STARTING:
Capture a "before" baseline:
```bash
cd frontend && npm run build 2>&1 > /tmp/tanglaw-build-before.log
du -sh .next/static/chunks/
ls -la .next/static/chunks/*.js | sort -k5 -n -r | head -10
```

#### After All Changes:

**Step 1: Build**
```bash
cd frontend && npm run build 2>&1 > /tmp/tanglaw-build-after.log
```
Verify: zero errors, zero warnings (except known ones like "larger than recommended" for legitimate chunks)

**Step 2: Typecheck**
```bash
cd frontend && npx tsc --noEmit 2>&1 | head -50
```
Verify: zero errors

**Step 3: Bundle Analysis**
```bash
cd frontend && npm run analyze
```
This opens an HTML report. Compare chunk sizes, identify any regressions.

**Step 4: Write PERF-REPORT.md**

Create `PERF-REPORT.md` at project root with:
```markdown
# TANGLAW Performance Optimization Report

## Before (baseline)
- Largest chunk: 226 KB
- Total .next/static/chunks: 1.3 MB
- Total .next build: 16 MB

## After (optimized)
- Largest chunk: ___ KB
- Total .next/static/chunks: ___ MB  
- Total .next build: ___ MB

## Changes Applied
- [ ] WS-1: Canvas pausing on all 3 backgrounds
- [ ] WS-2: tsParticles migration (CDN → npm)
- [ ] WS-3: Scholarship data dynamic import
- [ ] WS-4: Component file splitting
- [ ] WS-5: Framer Motion → whileInView
- [ ] WS-6: Question bank on-demand
- [ ] WS-7: Fonts self-hosted
- [ ] WS-8: Next.js config optimized
- [ ] WS-9: Icon imports cleaned
- [ ] WS-10: Build validation passed

## Success Criteria
- [ ] Build passes with zero errors
- [ ] TypeScript typecheck passes with zero errors
- [ ] First Load JS reduced by ≥30%
- [ ] Largest chunk < 150 KB
```

**Step 5: Lighthouse**
Deploy to Vercel preview, then run:
```
https://pagespeed.web.dev/analysis/<preview-url>?form_factor=desktop
```
Compare TBT and INP scores against the original.

---

## Implementation Order (Dependency-Aware)

```
Phase 1 (no deps, can parallelize all 4):
  WS-1: Canvas pausing → 3 files
  WS-2: tsParticles migration → 2 files
  WS-7: Fonts self-hosted → 1 file
  WS-8: Next.js config → 1 file + package.json

Phase 2 (after WS-8 config settles):
  WS-9: Icon cleanup → review imports
  WS-3: Scholarship dynamic import → 1 file

Phase 3 (largest changes, after WS-3):
  WS-4: Component splitting → 8 files
  WS-5: Framer Motion → whileInView → 15 files
  WS-6: Question bank on-demand → 1 file

Phase 4 (after all changes):
  WS-10: Build analysis & validation → PERF-REPORT.md
```

---

## Files That Must NOT Change Behavior

| File | What must survive untouched |
|------|---------------------------|
| `nature-canvas.tsx` | Particle colors, count (55), sway/swim animation, offscreen canvas caching, theme reactivity |
| `particles-background.tsx` | Particle colors/glow, counts (70/50/30), dark/light mode colors, CSS drop-shadow filter |
| `etheral-shadow.tsx` | SVG feTurbulence animation, noise overlay, theme-aware color, mask-image URL |
| `landing-animations.tsx` | Mascot float animation, glow halo, HeroButton hover scale, FeatureCard layout |
| `owel-chatbot.tsx` | Resize handles, mobile bottom sheet, preloaded prompts, message history, typing indicator |
| `readiness-form.tsx` | All 3 views (setup/active/feedback), timer logic, mock exam navigation, score computation |
| `scholarship-browser.tsx` | Filter logic, search debounce, income matching, card expand/collapse, pagination |
| `scholarships-data.ts` | **READ ONLY** — never edit. All 40+ entries, all interfaces |
| `initialization-terminal.tsx` | 4-step onboarding flow, progress bar, OwelBriefing, data metadata panel |
| `site-header.tsx` | Mobile hamburger menu, backdrop overlay, auth-aware nav links, theme changer |
| `dashboard/layout.tsx` | AuthGuard, mobile nav, desktop nav, floating chatbot, sign out button |

---

## DeepSeek V4 Pro Quick Reference Card

### Before every file edit:
1. `read_files` on the target file
2. Run the Context7 command listed in the workstream
3. Check the "DO NOT DO" list for that workstream

### After every file edit:
1. `npx tsc --noEmit` from `frontend/`
2. Fix ALL type errors before moving to the next file
3. If error mentions missing import → you forgot to update imports (most common DeepSeek failure)

### When creating new files:
1. Path: always sibling to the parent component (e.g., `frontend/src/components/readiness-setup.tsx`)
2. Must export default function AND any types it needs
3. Must use `"use client"` directive at top (matches existing project convention)
4. Import path: use `@/components/` alias for existing components, `./` for new siblings

### Anti-Hallucination Anchors
- `@tsparticles/react` — NOT `tsparticles` or `react-tsparticles`
- `@tsparticles/engine` — required peer dependency
- `@tsparticles/slim` — NOT `@tsparticles/all` or `@tsparticles/full`
- `links: { enable: false }` — NOT `line_linked: { enable: false }`
- `experimental.optimizePackageImports` — NOT `modularizeImports`
- `output: "standalone"` — NOT inside `experimental`
- `experimental.optimizeCss` — DOES NOT EXIST, do not add
- `whileInView` + `viewport={{ once: true }}` — always pair them
- `import type { ... }` — for interfaces, zero runtime cost
- `@/components/` — path alias, NOT `../../components/` (use in parent components)
- `./readiness-setup` (relative) — for new sibling components

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| tsParticles visual doesn't match particles.js exactly | Medium | Compare side-by-side; if mismatch, keep CDN + add visibility pause instead |
| DeepSeek hallucinates tsParticles import paths | High | EXACT import paths provided above; verify with `npx tsc --noEmit` |
| DeepSeek adds `experimental.optimizeCss` | High | Explicitly marked as "DOES NOT EXIST" above; removed from plan |
| Component splitting breaks prop contracts | Low | TypeScript catches all; verify after every extraction |
| `whileInView` changes animation feel | Low | `whileInView` triggers on scroll-in which is actually better UX |
| Dynamic import causes layout shift | Medium | Skeleton cards must match card dimensions exactly |
| Question bank on-demand causes delay during mock exam | Low | Pre-generate next subject when user is 80% through current subject |
