# TANGLAW Particle System Improvement Plan

## Analysis: TANGLAW vs. Landas

### Landas (Reference System)

| Dimension | Details |
|-----------|---------|
| **Technology** | Pure DOM / SVG / CSS — zero Canvas, zero JS animation loops |
| **Visual Layers** | 18 falling leaves (CSS keyframes), 24 fireflies (CSS pulse), 4 volumetric light rays, tree-trunk SVGs, background silhouettes, ground mist, vignette, floating leaf shapes |
| **Mouse Interaction** | **None** — completely passive background |
| **Performance** | GPU-composited CSS only; zero main-thread CPU usage for animations |
| **Accessibility** | **User-facing `animationIntensity` toggle** (reduced / normal) in global Zustand store; applies `!animation-none !transition-none` globally |
| **Theming** | CSS custom properties + theme store (Arcade vs. Sanctuary) |
| **Visual Impact** | Very rich, immersive, story-driven environment (enchanted forest) |

### TANGLAW (Current System)

| Dimension | Details |
|-----------|---------|
| **Technology** | HTML5 Canvas (`NatureCanvas`) + tsParticles (`@tsparticles/react` v4) |
| **Visual Layers** | 35–75 glowing orb particles with offscreen glow cache, radial gradient background, connection lines, sparkle effects, cursor glow, click burst |
| **Mouse Interaction** | Proximity glow, repulse force, wind drift, click burst (8–12 radiating particles), spring-back physics, 8-point trails |
| **Performance** | 30fps cap, offscreen canvas caching, LRU cache, visibility/tab pause, idle timer, intersection pause |
| **Accessibility** | `prefers-reduced-motion` media query only — **no user-facing control** |
| **Theming** | Theme ref + smooth color interpolation (light ↔ dark) |
| **Visual Impact** | Clean but sparse; particles feel like "dots on a gradient" rather than an immersive world |

### Key Takeaways

1. **Landas wins on visual richness and atmosphere** — they achieve a stunning, story-driven environment without touching Canvas. The layered SVG scenery + CSS animations create depth without CPU cost.
2. **TANGLAW wins on interactivity and performance engineering** — mouse-driven physics, connection lines, and robust safeguards (30fps cap, idle timer, visibility pause) are far ahead of Landas.
3. **Landas’s accessibility approach is superior** — a user-facing toggle in settings is more discoverable and respectful than relying solely on the `prefers-reduced-motion` OS preference.
4. **TANGLAW’s biggest gap is *environment* — not particles** — the particles themselves are fine; what’s missing is the world around them (scenery, depth layers, atmospheric effects).

---

## Improvement Plan

### Initiative 1: Add CSS/SVG Atmospheric Scenery Layer
**Goal:** Give the background a sense of place without adding Canvas CPU cost.

**What to add:**
- **Vignette overlay** — subtle radial darkening at edges (CSS `radial-gradient` on a fixed overlay div)
- **Light rays / sunbeams** — 3–4 absolutely-positioned divs with CSS `linear-gradient` + slow pulse animation (same technique as Landas)
- **Ground mist** — bottom-gradient overlay with slow drift animation (CSS `@keyframes mist-drift`)
- **Canopy shadow** — top-gradient overlay for depth (light → dark downward)

**Why CSS/SVG instead of Canvas:**
- Zero JS overhead — GPU-composited by the browser
- Can be rendered in a separate layer above the Canvas but below content (`z-[-10]`)
- Works even when `NatureCanvas` is paused or disabled

**Files to modify:**
- `frontend/src/components/nature-canvas.tsx` — add a sibling wrapper div with scenery overlays
- `frontend/src/app/globals.css` — add `@keyframes` for light-ray, mist-drift, canopy-fade

**Performance impact:** Negligible — CSS animations are GPU-composited.

---

### Initiative 2: Implement User-Facing Animation Intensity Toggle
**Goal:** Match Landas’s accessibility approach — let users control motion, not just inherit OS preferences.

**What to add:**
- A **global setting** in the user settings (or a floating toggle) with three modes:
  - **Full** — all effects active (current default)
  - **Reduced** — disable sway, sparkle, wind, trails, connection lines; keep static particles + slow drift
  - **Minimal** — hide Canvas entirely; show only the CSS scenery layer (Initiative 1) + static gradient
- Persist the choice in `localStorage` (key: `tanglaw-animation-intensity`)
- The `NatureCanvas` component reads this value on mount and applies the appropriate mode

**Files to modify:**
- `frontend/src/components/nature-canvas.tsx` — add `animationIntensity` prop/ref, gate effects
- `frontend/src/components/theme-changer.tsx` — add intensity toggle UI
- `frontend/src/app/globals.css` — add `.animation-reduced` helper class

**Performance impact:** Medium — when users choose "Minimal," GPU/CPU load drops to near zero.

---

### Initiative 3: Improve Visual Density of the Canvas Layer
**Goal:** Make the particles feel like part of an ecosystem, not isolated dots.

**What to add (already partially in roadmap, consolidated here):**
- **Increase particle variety** — instead of uniform glowing orbs, add:
  - Small dust particles (2–4px, high count, low opacity) that drift slowly
  - Medium orb particles (current size, ~50% of count)
  - Large anchor particles (rare, 1–2 per screen, slow pulse, no movement)
- **Particle-to-particle connection lines** — already implemented; keep but make them optional (toggle via Init. 2)
- **Falling particle behavior** — on light theme, some particles should drift downward like falling leaves (reference Landas’s `leaf-fall` animation); on dark theme, particles float upward like embers
- **Biome tinting** — when on a scholarship page with a specific academic field (e.g., STEM, Arts), subtly shift the particle color palette to match (already in Phase 2 of roadmap)

**Files to modify:**
- `frontend/src/components/nature-canvas.tsx` — particle initialization logic, draw loop

**Performance impact:** Low — dust particles are tiny and cheap; falling behavior is just a sign flip on `vy`.

---

### Initiative 4: Enhance tsParticles Layer (Ambient Particles)
**Goal:** Make the tsParticles layer more visually complementary to the Canvas layer.

**What to add:**
- **Enable interactivity** — currently `onHover` and `onClick` are disabled. Enable them with `repulse` mode to create a subtle "push away" effect on the ambient layer
- **Add shape variety** — use `shape: { type: ['circle', 'triangle'] }` to mix orb and triangle particles (triangles evoke light shards / leaves)
- **Add opacity flicker** — use `opacity: { animation: { enable: true, speed: 0.5, minimumValue: 0.1 } }` for twinkling
- **Link lines** — enable `links: { enable: true, distance: 120, opacity: 0.1, color: { value: 'random' } }` for a subtle constellation effect behind the Canvas layer

**Files to modify:**
- `frontend/components/ui/particles-background.tsx` — update `ISourceOptions`

**Performance impact:** Low — tsParticles is already a separate GPU layer; these are config changes.

---

### Initiative 5: Scroll-Reactive Parallax (Depth Layering)
**Goal:** Make the background feel deeper as the user scrolls.

**What to add:**
- Three depth layers:
  - **Layer 0 (far):** CSS scenery — moves at 0.1× scroll speed
  - **Layer 1 (mid):** tsParticles — moves at 0.3× scroll speed
  - **Layer 2 (near):** NatureCanvas — moves at 0.6× scroll speed
- Use `requestAnimationFrame` + `scroll` event listener (throttled) to apply `transform: translateY(...)` to each layer
- Only active when `animationIntensity !== 'minimal'`

**Files to modify:**
- `frontend/src/components/dynamic-backgrounds.tsx` — add scroll handler and transform application
- `frontend/src/components/nature-canvas.tsx` — accept `scrollOffset` prop or read from a shared ref
- `frontend/components/ui/particles-background.tsx` — accept `scrollOffset` prop

**Performance impact:** Low — one throttled scroll handler + CSS transforms.

---

### Initiative 6: Low-Power / Battery-Saver Auto-Downgrade
**Goal:** Automatically protect performance on low-end devices without user intervention.

**What to add:**
- Auto-detect low-power conditions:
  - `navigator.deviceMemory < 4` → reduce particle count by 50%
  - `navigator.getBattery()` (if available) + `level < 0.2` + `!charging` → switch to "Minimal" mode
  - Frame rate drops below 20fps for 5 consecutive seconds → reduce effects and log a warning
- Graceful degradation ladder:
  - **Level 0 (Full):** 75 particles, all effects, 30fps
  - **Level 1 (Reduced):** 35 particles, no trails, no connection lines, 20fps
  - **Level 2 (Minimal):** 15 particles, no interactivity, 10fps
  - **Level 3 (CSS Only):** Hide Canvas + tsParticles; show only CSS scenery layer

**Files to modify:**
- `frontend/src/components/nature-canvas.tsx` — add `detectPerformanceLevel()` and dynamic config

**Performance impact:** High — saves significant CPU/GPU on low-end devices.

---

## Implementation Priority

| Priority | Initiative | Files | Effort | Impact |
|----------|-----------|-------|--------|--------|
| **P0** | 1. CSS/SVG Atmospheric Scenery | `nature-canvas.tsx`, `globals.css` | 4h | High visual impact, zero CPU cost |
| **P0** | 2. User-Facing Animation Toggle | `nature-canvas.tsx`, `theme-changer.tsx`, `globals.css` | 3h | Accessibility, user control |
| **P1** | 4. tsParticles Interactivity | `particles-background.tsx` | 2h | Makes ambient layer feel alive |
| **P1** | 3. Canvas Visual Density | `nature-canvas.tsx` | 4h | Richer ecosystem feel |
| **P2** | 5. Scroll-Reactive Parallax | `dynamic-backgrounds.tsx`, `nature-canvas.tsx`, `particles-background.tsx` | 3h | Depth and immersion |
| **P2** | 6. Low-Power Auto-Downgrade | `nature-canvas.tsx` | 3h | Performance protection |

**Total estimated effort:** ~19 hours of focused work.

---

## What NOT to Do (Anti-Goals)

- **Do NOT** replace the Canvas system with a pure CSS/SVG approach like Landas — TANGLAW’s mouse interactivity is a core differentiator and worth the CPU cost.
- **Do NOT** add a third particle library (e.g., `canvas-confetti`, `three.js`) — two layers (Canvas + tsParticles) are already sufficient.
- **Do NOT** remove the 30fps cap or offscreen caching — those are hard-won performance wins.
- **Do NOT** change the existing dashboard skip logic or z-index layering — both are working correctly.

---

## Summary

TANGLAW’s particle system is technically superior to Landas in interactivity and performance engineering, but visually inferior in atmosphere and accessibility. The path forward is a **hybrid approach**: keep the Canvas physics and interactivity, but wrap it in a richer CSS/SVG environment (scenery, light rays, mist) and give users control over motion intensity. This preserves TANGLAW’s strengths while closing the gaps that Landas exposes.
