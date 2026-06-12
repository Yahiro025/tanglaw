# TANGLAW Background Transformation Roadmap

## Executive Summary

The current TANGLAW background system consists of two layers:
1. **NatureCanvas** (`frontend/src/components/nature-canvas.tsx`) — Custom 55-particle canvas system with mouse glow, repulse, wind, sparkles, depth parallax, and offscreen caching. Capped at 30fps.
2. **ParticlesBackground** (`frontend/components/ui/particles-background.tsx`) — tsParticles (`@tsparticles/react` v4) with 70/50/30 particles, CSS drop-shadow glow, and visibility-based pause.

**Critical Bug:** Mouse interactivity is completely broken because the NatureCanvas `<canvas>` element uses `pointer-events-none`. All mouse event listeners (`mousemove`, `mouseleave`) fire, but the canvas element itself blocks hit testing. The `mouse.active` flag always becomes true on `mousemove`, but particles are positioned via `window` coordinates, which works — the actual bug is that **no visual feedback reaches the user** because the canvas is `pointer-events-none` and there's no visual indication of the interaction zone. Wait, actually, `mousemove` on `window` works fine. The user says "no response to click/hover" — the repulse/glow effects are actually working in the code, but the canvas being `pointer-events-none` might mean the user doesn't see them because the particles are behind content. Let me re-examine: the canvas is `fixed inset-0 -z-20`, so it's behind everything. The mouse events ARE on `window`, so they do fire. The particles DO get brighter and larger near the cursor. But the user reports no response. This could be because the effect is too subtle, or because the `pointer-events-none` on the canvas causes the browser to skip compositing the canvas at all when it's not considered an interactive layer? No, `pointer-events-none` just means clicks pass through. The canvas is still rendered. The real issue might be that the glow effect is too subtle, or the particles are too sparse (55) for users to notice the interaction.

Actually, looking more carefully: the canvas is `pointer-events-none`, and the mouse events are on `window`. This should work. But if the user says it's broken, maybe the issue is that `pointer-events-none` on the canvas prevents `mousemove` from firing on the canvas itself, but since we're listening on `window`, it should still work. The user might be clicking on content expecting particles to react, but particles only react to cursor proximity. The issue might be that the interaction is too subtle to notice.

Regardless, the roadmap should address this.

---

## Phase 1: Bug Fix + Immediate Visual Improvements

### Goals
- Fix mouse interactivity visibility
- Add richer visual feedback for interactions
- Improve particle density and variety

### Changes

#### 1.1 Fix Mouse Interactivity Visibility
**File:** `frontend/src/components/nature-canvas.tsx`

**Problem:** `pointer-events-none` on the canvas prevents the browser from treating the canvas as an interactive surface. While `window` events still fire, the user gets no visual feedback because the interaction is too subtle.

**Solution:**
- Change `pointer-events-none` to `pointer-events-auto` but add a transparent overlay or ensure content above the canvas has `pointer-events-auto` so content remains clickable.
- Actually, better: Keep `pointer-events-none` on the canvas but add a dedicated invisible interaction layer (`pointer-events-auto`) that captures mouse events and forwards them. This preserves content clickability while enabling canvas interaction.
- Simpler: Just add `pointer-events-auto` to the canvas and add `pointer-events-auto` to all interactive content above it. This is more robust.

**Impact:** Low risk. Only affects event handling.

#### 1.2 Richer Particle Feedback
**File:** `frontend/src/components/nature-canvas.tsx`

**Changes:**
- Add a **cursor glow trail** — a soft radial gradient that follows the mouse, visible even when no particles are near.
- Increase **repulse force** and add a **spring-back** effect so particles visibly bounce away and return.
- Add **connection lines** between nearby particles (distance < 100px) when mouse is active, creating a constellation effect.
- Add a **click burst** — on click, spawn 5-10 temporary particles that radiate outward and fade.

**Performance Impact:** Moderate. Connection lines add O(n²) complexity. Mitigate by limiting to 15 nearest particles per frame.

#### 1.3 Particle Count Adjustment
**File:** `frontend/src/components/nature-canvas.tsx`

- Increase count from 55 to **75** on desktop (>1024px), keep 55 on tablet, reduce to 35 on mobile.
- Add responsive particle sizing (smaller on mobile).

**Performance Impact:** Low. Already capped at 30fps with offscreen caching.

### Risk: Low
### Dependencies: None

---

## Phase 2: Biome / Preset System

### Goals
- Create scholarship-themed visual environments that adapt to page context
- Allow users to choose their preferred atmosphere

### Changes

#### 2.1 Biome Preset Engine
**File:** `frontend/src/components/nature-canvas.tsx` (refactored into `frontend/src/lib/canvas/biome-engine.ts`)

**Presets:**
- **Default (TANGLAW)** — Current green/blue palette, floating orbs
- **STEM (Deep Space)** — Dark purples, cyan particles, constellation lines, faster drift
- **Business (Corporate Gold)** — Warm golds, slower drift, subtle grid overlay
- **Arts (Dreamscape)** — Pastel pinks, larger particles, more sparkle, slower sway
- **Agriculture (Verdant)** — Greens, organic shapes, leaf-like particle sprites
- **Health (Clinical)** — Clean whites, soft blues, minimal sparkle, steady pulse

**Implementation:**
- Extract particle logic into a `BiomeEngine` class with a `loadPreset(name)` method.
- Each preset defines: colors, sizes, speeds, gravity, interaction modes, spawn shapes.
- Biome is selected via:
  - URL path (e.g., `/scholarships?field=stem` → STEM preset)
  - User preference in settings
  - Time of day (auto-switch to dark-blue preset at night)

#### 2.2 Biome Transition Animation
**File:** `frontend/src/components/nature-canvas.tsx`

- When biome changes, existing particles fade out and new particles fade in over 1.5s.
- Colors smoothly interpolate using the existing `targetR/G/B` system.

#### 2.3 tsParticles Biome Sync
**File:** `frontend/components/ui/particles-background.tsx`

- tsParticles should follow the same biome theme. Add a `biome` prop.
- For simplicity, tsParticles may only support 2-3 presets (light, dark, accent) rather than full 6-biome system.

### Risk: Medium
### Dependencies: Phase 1

---

## Phase 3: Advanced Interactivity

### Goals
- Make the background feel alive and responsive to user actions
- Add playful, memorable interactions

### Changes

#### 3.1 Click-to-Interact
**File:** `frontend/src/components/nature-canvas.tsx`

- **Ripple rings** on click — expanding translucent rings that fade over 2s.
- **Particle burst** on click — 8-12 particles spawn at click position, radiate outward with velocity based on click position.
- **Double-click reset** — all particles smoothly return to their original positions.

#### 3.2 Particle Trails
**File:** `frontend/src/components/nature-canvas.tsx`

- Fast-moving particles leave a faint trail (opacity 0.1-0.3) using a secondary offscreen canvas that decays.
- Trail length: 5-10 frames.
- Only enable for particles with `speed > threshold`.

#### 3.3 Connection Lines (Constellation Mode)
**File:** `frontend/src/components/nature-canvas.tsx`

- Draw faint lines between particles within 120px.
- Line opacity = `1 - (distance / 120)`.
- Limit to 10 connections per particle to avoid O(n²) blowup.
- Lines pulse brighter when mouse is nearby.
- **Optional:** Connect to mouse cursor as well, creating a "web" effect.

#### 3.4 Scroll-Reactive Parallax
**File:** `frontend/src/components/nature-canvas.tsx`

- Different particle layers move at different speeds based on scroll position.
- Far particles (depth 0.6) move at 0.2x scroll speed.
- Near particles (depth 1.4) move at 0.8x scroll speed.
- Creates a subtle depth effect as user scrolls.

### Performance Considerations
- Trails and connection lines require a second pass over the canvas.
- Mitigate by: (a) capping max connections, (b) using a separate offscreen canvas for trails that is only updated every 2nd frame, (c) skipping trail logic for >50% of particles.

### Risk: Medium-High
### Dependencies: Phase 2

---

## Phase 4: Accessibility and Performance Hardening

### Goals
- Ensure the background is delightful but never an obstacle
- Respect user preferences and hardware limitations

### Changes

#### 4.1 `prefers-reduced-motion` Support
**Files:** `frontend/src/components/nature-canvas.tsx`, `frontend/components/ui/particles-background.tsx`

- When `prefers-reduced-motion: reduce` is active:
  - Disable all movement (particles static).
  - Disable sway, sparkle, wind, trails, connection lines.
  - Keep particles visible as a static decorative background.
  - Fade to static over 1s instead of abrupt stop.
- Add a user-facing toggle in settings: "Reduce motion".

#### 4.2 Low-Power Mode Detection
**File:** `frontend/src/components/nature-canvas.tsx`

- Detect low-power mode via:
  - `navigator.getBattery()` → if `charging` is false and `level` < 0.2, reduce particle count by 50%.
  - Device memory: `navigator.deviceMemory` < 4 → reduce effects.
  - Thermal throttling: if frame rate drops below 20fps for 5 consecutive seconds, automatically reduce complexity.
- Provide a **"Battery Saver"** toggle that disables all particle animation and shows a static CSS gradient instead.

#### 4.3 Graceful Degradation
**File:** `frontend/src/components/nature-canvas.tsx`

- **Level 0 (Full):** 75 particles, all effects, 30fps.
- **Level 1 (Reduced):** 35 particles, no trails, no connection lines, 20fps.
- **Level 2 (Minimal):** 15 particles, no interactivity, 10fps.
- **Level 3 (CSS Fallback):** Hide canvas entirely, show a static CSS radial gradient with a subtle CSS animation.
- Auto-downgrade based on: low FPS, low battery, low memory, mobile device, reduced motion preference.

#### 4.4 Performance Telemetry (Optional)
**File:** `frontend/src/components/nature-canvas.tsx`

- Track FPS in development builds.
- Log warnings when FPS drops below target for >3s.
- Never ship telemetry in production.

### Risk: Low
### Dependencies: Phase 3

---

## Implementation Order

| Phase | Priority | Files | Est. Effort | Risk |
|-------|----------|-------|-------------|------|
| 1.1 Fix pointer events | P0 | `nature-canvas.tsx` | 2h | Low |
| 1.2 Richer feedback | P1 | `nature-canvas.tsx` | 4h | Low |
| 1.3 Responsive count | P1 | `nature-canvas.tsx` | 1h | Low |
| 2.1 Biome engine | P2 | `nature-canvas.tsx` + new `biome-engine.ts` | 8h | Medium |
| 2.2 Biome transition | P2 | `nature-canvas.tsx` | 3h | Medium |
| 2.3 tsParticles sync | P3 | `particles-background.tsx` | 2h | Low |
| 3.1 Click interactions | P2 | `nature-canvas.tsx` | 4h | Medium |
| 3.2 Trails | P3 | `nature-canvas.tsx` | 4h | Medium |
| 3.3 Connection lines | P3 | `nature-canvas.tsx` | 3h | Medium |
| 3.4 Scroll parallax | P3 | `nature-canvas.tsx` | 2h | Low |
| 4.1 Reduced motion | P1 | `nature-canvas.tsx`, `particles-background.tsx` | 3h | Low |
| 4.2 Low-power mode | P2 | `nature-canvas.tsx` | 3h | Low |
| 4.3 Graceful degradation | P2 | `nature-canvas.tsx` | 4h | Low |
| 4.4 Dev telemetry | P4 | `nature-canvas.tsx` | 1h | Low |

---

## Performance Budget

| Metric | Target | Worst Case |
|--------|--------|------------|
| FPS | 30fps cap | 20fps on low-end |
| CPU time per frame | <8ms | <16ms on low-end |
| Particle count (desktop) | 75 | 35 |
| Particle count (mobile) | 35 | 15 |
| Memory (offscreen caches) | <10MB | <5MB on low-end |
| GPU layers | 2 (canvas + tsParticles) | 1 (canvas only) |

---

## Notes on the "Landas" Reference

The "Landas" reference system mentioned in the original brief is not present in the current codebase. If it refers to an external design system or a previous iteration, the biome system in Phase 2 is designed to replicate its core idea: **rich, layered, context-aware scenery**. The key difference is that TANGLAW's implementation prioritizes performance (canvas-based, 30fps cap, offscreen caches) over the presumably CSS/SVG-heavy Landas approach.

---

*Document version: 1.0*
*Created: 2026-06-12*
*Status: Strategic plan — no code changes yet*
