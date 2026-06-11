# Detailed Implementation Plan: Non-Destructive Performance Optimization
*(Optimized for DeepSeek V4 Pro Execution)*

This plan outlines exact code changes to optimize the performance of the three background components without removing them. Follow these steps sequentially and carefully.

## 1. Optimize SVG Filters in `EtheralShadow` (`frontend/components/ui/etheral-shadow.tsx`)
**Objective**: Remove Framer Motion's JavaScript loop and replace it with a native SVG `<animate>` tag for the `hueRotate` effect.
**Instructions**:
1. Remove `useMotionValue`, `animate`, and `AnimationPlaybackControls` from `framer-motion` imports.
2. Remove the `useEffect` block that sets up `hueRotateAnimation`.
3. In the SVG `<filter>` block, locate the `<feColorMatrix type="hueRotate" ...>` element.
4. Replace it with the following native SVG animation to offload work to the GPU:
   ```tsx
   <feColorMatrix in="undulation" type="hueRotate" values="180">
     <animate 
       attributeName="values" 
       from="0" 
       to="360" 
       dur={`${animationDuration / 25}s`} 
       repeatCount="indefinite" 
     />
   </feColorMatrix>
   ```
5. Ensure `will-change: filter` and `transform: translateZ(0)` are added to the style of the `<div>` wrapping the `<svg>` to force hardware acceleration.

## 2. Optimize `NatureCanvas` (`frontend/src/components/nature-canvas.tsx`)
**Objective**: Cache the radial gradients using offscreen canvases to prevent recalculating them 60 times a second.
**Instructions**:
1. Inside the `useEffect` loop, right before `const draw = () => {`, create two offscreen canvas caches:
   - One for the background gradient.
   - A function that generates an offscreen canvas for a particle given a specific `r, g, b, alpha, size` configuration.
2. Update the `draw` function to use `ctx.drawImage(offscreenCanvas, x, y)` instead of `ctx.createRadialGradient` and `ctx.arc` for every particle.
3. Keep the logic that updates `p.r, p.g, p.b` but use these to select or redraw the cached particle canvas only when the color significantly changes.
4. Add an `IntersectionObserver` to the `canvas` element so that `isRunning` is set to `false` when the user scrolls past the canvas (if it's not `fixed` across the whole app).

## 3. Defer `ParticlesBackground` Script Loading (`frontend/components/ui/particles-background.tsx`)
**Objective**: Use `next/script` to prevent the `particles.js` payload from blocking main thread hydration.
**Instructions**:
1. Import `Script` from `'next/script'`.
2. Remove the manual `document.createElement('script')` injection block inside the `useLayoutEffect`.
3. Instead, render a `<Script>` component at the bottom of the component:
   ```tsx
   <Script 
     src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js" 
     strategy="lazyOnload" 
     onLoad={() => initParticles()} 
   />
   ```
4. Move `initParticles` outside of the effect or wrap it in `useCallback` so it can be called by the `Script`'s `onLoad` handler.
5. Ensure the effect still cleans up and handles window resize properly.

## 4. Lazy Load Components in `layout.tsx` and `page.tsx`
**Objective**: Prioritize the rendering of text and buttons over heavy visual effects.
**Instructions**:
1. In `frontend/src/app/layout.tsx`:
   - Import `dynamic` from `'next/dynamic'`.
   - Change the `NatureCanvas` import to:
     ```tsx
     const NatureCanvas = dynamic(() => import('@/components/nature-canvas'), { ssr: false });
     ```
   - Change the `ParticlesBackground` import to:
     ```tsx
     const ParticlesBackground = dynamic(() => import('../../components/ui/particles-background'), { ssr: false });
     ```
2. In `frontend/src/app/page.tsx`:
   - Import `dynamic` from `'next/dynamic'`.
   - Change the `LandingBackground` import to:
     ```tsx
     const LandingBackground = dynamic(() => import('../../components/ui/landing-animations').then(mod => mod.LandingBackground), { ssr: false });
     ```

## Verification Checklist for DeepSeek V4 Pro
- [ ] No visual elements were removed; only their rendering mechanism was optimized.
- [ ] `next/script` is properly implemented with `strategy="lazyOnload"`.
- [ ] Framer Motion `useEffect` loop in `EtheralShadow` is completely removed.
- [ ] `NatureCanvas` uses `drawImage` instead of `createRadialGradient` in its 60FPS loop.
- [ ] `next/dynamic` is used for all three heavy background layers.

---
**Does this revised, highly-detailed plan look ready to hand off? Click 'Proceed' to approve.**
