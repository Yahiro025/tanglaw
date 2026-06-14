# Scroll Performance Optimization Plan (Zero Visual Compromise)

## Principle
Every fix preserves the exact same visual output and behavior. Changes are purely implementation-level — better algorithms, smarter lifecycle management, and reduced unnecessary work.

---

## Fix 1: NatureCanvas — Spatial hashing for connection lines

**File**: `frontend/src/components/nature-canvas.tsx`

**Problem**: Lines 618-650 compute pairwise distances between ALL particles every frame. 75 particles = 2,775 distance checks per frame at 30fps. This is the single biggest CPU consumer.

**Change**: Replace the O(n²) nested loop with a **spatial grid** (cell-based bucketing). Divide the canvas into cells of size `connectionDist` (100px). Each particle only checks neighbors in its own cell + 8 adjacent cells. Same visual result — connection lines appear identically — but computation drops from O(n²) to O(n).

```
// Before: for every particle, check ALL other particles
for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) { ... }
}

// After: build grid, check only adjacent cells
const grid = new Map<string, number[]>();
// ... populate grid ...
for (const [cellKey, indices] of grid) {
  // only check particles in same + adjacent cells
}
```

**Visual impact**: ZERO — same number of particles, same trails, same connection lines, same sparkle effects.

---

## Fix 2: EtheralShadow — RAF-throttled SVG filter updates

**File**: `frontend/components/ui/etheral-shadow.tsx`

**Problem**: The SVG `<animate>` element on `feColorMatrix` hue rotation (lines 93-99) runs at browser compositing rate, forcing the SVG filter to recompute every frame on a full-viewport element. Combined with `feDisplacementMap`, this is extremely expensive.

**Change**: Remove the SVG `<animate>` element. Instead, manually drive the hue rotation value using `requestAnimationFrame` with frame-skipping (update every 3rd frame = ~20fps update rate for the filter). This keeps the same wavy distortion animation but at a lower update frequency that's imperceptible to the eye.

```
// Before: SVG <animate> runs at browser rate (~60fps)
<animate attributeName="values" from="0" to="360" dur="..." repeatCount="indefinite" />

// After: Manual RAF loop updating the feColorMatrix values attribute
// Same visual wavy effect, updated at ~20fps instead of ~60fps
const hueRef = useRef(0);
useEffect(() => {
  let frame = 0;
  const animate = () => {
    frame++;
    if (frame % 3 === 0) { // Update every 3rd frame
      hueRef.current = (hueRef.current + 2) % 360;
      feColorMatrixRef.current?.setAttribute('values', String(hueRef.current));
    }
    rafId = requestAnimationFrame(animate);
  };
  // ... also pause when IntersectionObserver says hidden
}, []);
```

**Visual impact**: ZERO — same wavy distortion, same color cycling, just computed at 20fps internally instead of 60fps. The feTurbulence + feDisplacementMap effect is identical.

---

## Fix 3: MascotWithGlow — Viewport-gated animation pausing

**File**: `frontend/components/ui/landing-animations.tsx`

**Problem**: Lines 50-81 — 3 `motion.div` elements with `whileInView` + `viewport={{ once: false }}` + `repeat: Infinity`. These continuously animate even when scrolled away. Framer Motion's IntersectionObserver fires enter/leave events repeatedly, causing the animation to restart on every scroll.

**Change**: Keep ALL 3 animations exactly as-is (same `repeat: Infinity`, same timing). Add a **single `IntersectionObserver`** at the `MascotWithGlow` level that pauses/resumes all child animations when the section scrolls in/out of view. Use `animationPlayState` CSS property to pause without resetting animation state.

```
// Wrapper component with one IntersectionObserver
// Pauses all CSS/framer animations in children when out of viewport
// Same visual when in view — animations just stop when scrolled away
```

**Visual impact**: ZERO — when the mascot is visible, all 3 animations play exactly as before. When scrolled away, they pause (saving CPU). When scrolled back, they resume from where they left off.

---

## Fix 4: ScrollReveal — Shared IntersectionObserver

**File**: `frontend/src/components/scroll-reveal.tsx`

**Problem**: Each ScrollReveal creates its own Framer Motion `motion.div` with `whileInView`, each spawning a separate IntersectionObserver. The About page has ~20+ instances = 20+ observers.

**Change**: Replace Framer Motion's `whileInView` with a **shared observer provider**. Create a single `ScrollRevealProvider` context that manages one IntersectionObserver and notifies all children. This reduces 20+ observers to 1.

```
// Before: each ScrollReveal has its own motion.div + IntersectionObserver
// After: one shared observer, CSS class toggles for the reveal animation
```

**Visual impact**: ZERO — same fade-in + slide animation, same timing, same `once: true` behavior. Just fewer OS-level observers.

---

## Fix 5: Dashboard layout — RAF-throttled scroll handler

**File**: `frontend/src/app/dashboard/layout.tsx`

**Problem**: Lines 45-58 — `handleScroll` calls `setAtTop` and `setScrolledAway` on every scroll event, triggering full layout re-renders on each frame.

**Change**: Wrap the scroll handler in `requestAnimationFrame` so state updates happen at most once per frame (max ~60 updates/sec instead of potentially hundreds). Use `useRef` for intermediate values and only commit to state at animation frame boundaries.

**Visual impact**: ZERO — identical auto-hide behavior, just fewer intermediate re-renders.

---

## Fix 6: About page carousel — Component isolation

**File**: `frontend/src/app/about/about-client.tsx` → new `frontend/src/components/carousel-section.tsx`

**Problem**: `CarouselSection` is defined inside `about-client.tsx`. Its `setActiveIndex` state change re-renders the entire `AboutClient` component (13 team cards, 5 barriers, etc.).

**Change**: Extract `CarouselSection` to its own file. Import it as a standalone component. This isolates its state updates from the rest of the page.

**Visual impact**: ZERO — identical carousel behavior, same auto-scroll, same dot navigation.

---

## Fix 7: GlowingText — Viewport-gated animation

**File**: `frontend/src/app/globals.css` + `frontend/components/ui/glowing-text.tsx`

**Problem**: `@keyframes glow-pulse` runs infinitely with `text-shadow` animation on every GlowingText instance. text-shadow animations force repaints.

**Change**: Add a viewport-aware wrapper to `GlowingText` that uses IntersectionObserver to add/remove a CSS class controlling `animation-play-state`. When the text scrolls out of view, the animation pauses. When it scrolls back in, it resumes.

```
// CSS change:
.animate-glow-pulse { animation: glow-pulse 1.5s ease-in-out infinite; }
.animate-glow-pause { animation-play-state: paused; }

// Component change: wrap <span> with IntersectionObserver
// adds .animate-glow-pause when out of viewport
```

**Visual impact**: ZERO — same infinite glow pulse when visible. Pauses when scrolled away (saves paint cycles). Resumes when visible again.

---

## Implementation Order

1. Fix 2 (EtheralShadow RAF) — highest blast radius, affects ALL pages
2. Fix 1 (NatureCanvas spatial hash) — highest CPU on landing page  
3. Fix 3 (MascotWithGlow viewport gate) — landing page continuous animations
4. Fix 4 (ScrollReveal shared observer) — about page heavy observer count
5. Fix 5 (Dashboard RAF scroll) — dashboard re-renders
6. Fix 6 (Carousel isolation) — about page re-render cascade
7. Fix 7 (GlowingText viewport gate) — minor paint optimization

## Verification

1. Run `npm run build` in `frontend/` — zero errors
2. Run `npm run dev` and verify every page visually:
   - **Landing**: particles render, connection lines appear, mascot floats with pulsing glow, background has wavy distortion, all text glows
   - **About**: carousel auto-scrolls, team cards animate in, all sections reveal on scroll
   - **Contact**: wavy background, form works, sections animate in
   - **Dashboard**: navbar auto-hides, cards render, Owel chatbot opens
   - **Dashboard Scholarships**: filters and pagination work
   - **Dashboard Readiness**: quiz works
3. Chrome DevTools Performance tab: record scroll session, check no long tasks >50ms
