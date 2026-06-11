# tsParticles Migration Fix — Specification

## 1. Problem Statement

The user migrated from `particles.js` to `tsParticles` (`@tsparticles/react` v4 + `@tsparticles/slim`) but the particle effect is completely invisible. The browser console shows **no tsParticles-specific errors** (only unrelated 401 auth errors from the chat backend). The `particles-background.tsx` component renders without crashing, but produces a blank canvas.

## 2. Root Cause Analysis (Preliminary)

### 2.1 Missing Engine Initialization
The current `frontend/components/ui/particles-background.tsx` imports `Particles` from `@tsparticles/react` but **never initializes the engine**.

- `@tsparticles/react` v4 requires wrapping `<Particles />` with `<ParticlesProvider init={loadSlim}>` to initialize the engine.
- The `ParticlesProvider` is a singleton context provider that calls `loadSlim(tsParticles)` internally and only renders children once the engine is loaded.
- Without the `ParticlesProvider`, the `Particles` component throws because it calls `useParticlesProvider()` internally and expects a provider context.

### 2.2 Conditional Rendering Race Condition
The component uses a `useState(true)` for `isVisible` and a `useEffect` to set up visibility guards. The `Particles` component is conditionally rendered with `{isVisible && (...) }`. Since `isVisible` starts at `true`, the component *should* render, but if the engine is never initialized, the canvas is simply empty.

### 2.3 Dashboard Page Rendering
The current `DynamicParticlesBackground` is rendered unconditionally in `layout.tsx` (root layout). The `nature-canvas.tsx` already has logic to skip rendering on `/dashboard/*` routes, but `particles-background.tsx` does not. The user wants both background systems to skip the dashboard.

## 3. User Requirements & Preferences

### 3.1 Visual Behavior
- **Interaction**: Both hover and click effects desired.
- **Layering**: Keep current z-index setup (`z-[1]` for tsParticles, `z-[-20]` for nature-canvas). The user is satisfied with the current layering.
- **Page Scope**: Only render on **public pages** (landing, about, contact). Skip on `/dashboard/*` and any auth routes.
- **Appearance**: The user cannot precisely describe the old `particles.js` effect, but wants a working, aesthetically pleasing ambient particle background that fits the TANGLAW brand.

### 3.2 Performance Requirements
- **Aggressive pause**: Keep the existing "triple-guard" performance pattern:
  1. `IntersectionObserver` pause when scrolled off-screen.
  2. `document.visibilitychange` pause when tab is hidden.
  3. Idle timer (5 seconds) that hides particles after no mouse/scroll/touch activity.
- The user wants to preserve battery life and avoid unnecessary GPU/CPU usage.

### 3.3 Dependency Policy
- The user is okay with adding additional `@tsparticles/*` packages to enable interactivity.
- Already installed: `@tsparticles/engine@^4.1.3`, `@tsparticles/react@^4.1.3`, `@tsparticles/slim@^4.1.3`.

## 4. Technical Constraints

### 4.1 Framework & Environment
- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4.
- **Dynamic import**: The component is already dynamically imported with `ssr: false` in `frontend/src/components/dynamic-backgrounds.tsx`.
- **Theme**: `next-themes` is used. The current code reads `resolvedTheme` from `useTheme()` and toggles dark/light colors.

### 4.2 Existing Code Files
| File | Role |
|------|------|
| `frontend/components/ui/particles-background.tsx` | The broken tsParticles component. Needs `initParticlesEngine` + `loadSlim` + dashboard skip logic. |
| `frontend/src/components/dynamic-backgrounds.tsx` | Dynamic import wrapper for both background systems. No changes needed unless renaming. |
| `frontend/src/app/layout.tsx` | Root layout. Renders both backgrounds. No changes needed unless removing one. |
| `frontend/src/components/nature-canvas.tsx` | Custom canvas particle system. Already has dashboard skip logic. Should be left untouched. |
| `frontend/src/app/globals.css` | Global styles. May need z-index or canvas-related CSS tweaks. |
| `frontend/package.json` | Dependencies. May need new `@tsparticles/*` packages for interactivity. |

### 4.3 Brand Colors
Current tsParticles colors:
- **Dark mode**: `['#ffffff', '#ffd700', '#a78bfa']` (white, gold, purple)
- **Light mode**: `['#0f172a', '#1d4ed8', '#7C3AED']` (navy, blue, purple)

These should be preserved or refined to match the TANGLAW design system.

## 5. Proposed Solution

### 5.1 Engine Initialization
The `@tsparticles/react` v4 package exports `Particles` (default) and `ParticlesProvider` (named). The `ParticlesProvider` is a singleton context provider that accepts an `init` prop. The `init` function receives the `tsParticles` engine instance and should call `loadSlim(engine)` to register the slim preset plugins.

Correct initialization pattern:

```tsx
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

// Wrap Particles with ParticlesProvider — it handles engine init internally
<ParticlesProvider init={loadSlim}>
  <Particles
    id="tanglaw-particles"
    options={options}
    className="w-full h-full"
  />
</ParticlesProvider>
```

The `ParticlesProvider` renders `null` until the engine is loaded, then renders its children. The `Particles` component calls `useParticlesProvider()` internally to access the loaded state and initialize the particle canvas.

**Note:** `initParticlesEngine` does not exist in `@tsparticles/react` v4. The `ParticlesProvider` is the only correct way to initialize the engine in this version.

### 5.2 Dashboard Route Exclusion
Add `usePathname()` from Next.js to skip rendering on `/dashboard/*`:

```tsx
const pathname = usePathname();
if (pathname?.startsWith('/dashboard')) return null;
```

### 5.3 Interactivity Plugins
To enable hover and click effects, the following tsParticles v4 plugins are likely required:
- `@tsparticles/plugin-interaction-external` (or individual packages like `plugin-repulse`, `plugin-attract`, `plugin-trail`)
- The exact plugin names for v4 must be verified against the npm registry / tsParticles documentation.

### 5.4 Options Refinement
- The `move.direction: 'top'` value should be verified against tsParticles v4 schema.
- The `interactivity` block needs to be expanded to include `events.onHover` and `events.onClick` with `modes`.
- `responsive` array should be tested to ensure it works correctly in v4.

## 6. Acceptance Criteria

1. **Particles are visible** on the landing page, about page, and contact page in both light and dark modes.
2. **No console errors** related to tsParticles or engine initialization.
3. **Dashboard pages** (`/dashboard/*`) do not render the tsParticles layer at all.
4. **Hover interaction**: Moving the mouse over the particle canvas causes a visible effect (e.g., repulse, attract, or bubble).
5. **Click interaction**: Clicking on the particle canvas causes a visible effect (e.g., push, repulse, or trail).
6. **Performance guards** remain functional:
   - Particles pause when scrolled off-screen.
   - Particles pause when tab is hidden.
   - Particles hide after 5 seconds of idle activity.
   - Particles resume immediately on mousemove, scroll, or touchstart.
7. **Theme switching**: Colors update correctly when toggling between light and dark mode without a page reload.
8. **Build passes**: `next build` completes without TypeScript or bundling errors.

## 7. Open Questions / Risks

- **Old particles.js behavior**: The exact look and feel of the previous `particles.js` implementation is unknown. The user could not describe it and the GitHub repo does not contain the old code. We will design a visually pleasing replacement rather than replicating a lost reference.
- **Plugin availability**: The exact npm package names for hover/click interactivity in `@tsparticles` v4 need to be verified before installation.
- **Hydration mismatch**: `useTheme()` from `next-themes` can return `undefined` on first render. The component must handle this gracefully without causing React hydration errors.

## 8. Out of Scope

- Changing the `nature-canvas.tsx` custom particle system.
- Removing or replacing the `DynamicNatureCanvas` layer.
- Modifying the backend chat service or auth flow.
- Changing the landing page content or other UI components.
