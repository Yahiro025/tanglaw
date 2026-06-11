---
name: frontend-design
description: >
  Create distinctive, production-grade frontend interfaces with high design quality.
  Use when building web components, pages, landing pages, dashboards, React components,
  HTML/CSS layouts, or when styling/beautifying any web UI. Generates creative, polished
  code and UI design that avoids generic AI aesthetics. Triggered by: design, style,
  beautiful, aesthetic, UI, UX, visual, theme, layout, polish, landing page.
---

# Frontend Design — Distinctive, Production-Grade Interfaces

> **Adapted from**: [anthropics/skills/frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
> **MetaBuff-Tailored**: Adapted for Next.js + React + Tailwind CSS v4 projects. Design philosophy
> applies universally; implementation details target this project's stack.

## Purpose

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop"
aesthetics. Implement real working code with exceptional attention to aesthetic
details and creative choices.

## When to Use

- Building or redesigning any web component, page, or application
- Styling/beautifying existing UI
- Creating landing pages, dashboards, or feature pages
- User asks for "beautiful", "polished", "stunning", "modern" design
- Any time visual quality and distinctiveness matters

## Design Thinking (MANDATORY — Before Writing Any Code)

Before coding, understand the context and commit to a **BOLD aesthetic direction**:

### 1. Purpose
What problem does this interface solve? Who uses it? What's the emotional response
it should evoke?

### 2. Tone (Pick ONE Extreme)
- **Brutally minimal** — black/white/monochrome, generous negative space, single accent
- **Maximalist chaos** — dense layouts, overlapping elements, pattern-rich backgrounds
- **Retro-futuristic** — neon accents, dark backgrounds, monospace typography, scanlines
- **Organic/natural** — earth tones, soft curves, grain textures, botanical motifs
- **Luxury/refined** — gold/cream/navy, serif typography, restrained motion, elegant spacing
- **Playful/toy-like** — bright primaries, rounded everything, bouncy animations, cheerful
- **Editorial/magazine** — strong typographic hierarchy, dramatic scale shifts, bold imagery
- **Brutalist/raw** — default fonts, harsh borders, visible grid lines, anti-polish
- **Art deco/geometric** — gold/black, geometric patterns, symmetrical layouts, elegance
- **Soft/pastel** — pastel gradients, soft shadows, rounded corners, gentle transitions
- **Industrial/utilitarian** — monospace fonts, visible labels, functional aesthetics

There are infinite flavors. Use these for inspiration but design one true to the
aesthetic direction.

### 3. Constraints
Technical requirements: framework (React/Next.js), Tailwind CSS version (v4),
performance budgets, accessibility requirements.

### 4. Differentiation
**What makes this UNFORGETTABLE?** What's the ONE thing someone will remember?
Lead with this.

**CRITICAL**: Bold maximalism and refined minimalism both work — the key is
**intentionality**, not intensity. Every design choice should be deliberate.

## Frontend Aesthetics Guidelines

### Typography
- **Choose distinctive, beautiful fonts**. Avoid Arial, Inter, Roboto, system fonts.
- Pair a **distinctive display font** (headings) with a **refined body font**.
- Use `next/font/google` for Google Fonts in Next.js projects.
- Use `next/font/local` for custom/bundled fonts.
- Vary font weights dramatically: 900 headlines vs 300 body vs 500 accents.
- Consider: Playfair Display, DM Serif Display, Space Grotesk, Cabinet Grotesk,
  Switzer, Satoshi, Clash Display, Instrument Serif, Bricolage Grotesque,
  Newsreader, Fraunces, Literata.

### Color & Theme
- **Commit to a cohesive aesthetic**. Use CSS custom properties (`--color-primary`, etc.)
  for consistency. In Tailwind, extend the theme in `app/globals.css` with `@theme`.
- **Dominant colors with sharp accents** outperform timid, evenly-distributed palettes.
- Dark themes: rich blacks (`#0a0a0a`) not pure black, warm undertones.
- Light themes: warm whites (`#fafaf9`) not pure white, subtle tints.
- One **signature color** used sparingly creates more impact than rainbow palettes.

### Motion
- Use Framer Motion (`motion/react` or `framer-motion`) for React components.
- Prioritize CSS-only animations for simple effects (`transition`, `@keyframes`).
- **High-impact moments**: One well-orchestrated page load with `staggerChildren`
  and `animation-delay` creates more delight than scattered micro-interactions.
- Use scroll-triggered reveals (`whileInView`) and surprising hover states.
- Motion should feel **intentional and branded** — not generic fade-in.

### Spatial Composition
- **Unexpected layouts**: asymmetry, overlap, diagonal flow, grid-breaking elements.
- Generous negative space OR controlled density — never mediocre spacing.
- Use `grid` and `flexbox` creatively. Break the grid intentionally.
- Layering: z-index stacking for depth, overlapping cards, text over images.

### Backgrounds & Visual Details
- Create **atmosphere and depth** — never default to solid `bg-white` or `bg-black`.
- Techniques: gradient meshes, noise textures (`background-image: url("data:image/svg+xml,...")`),
  geometric patterns, layered transparencies, dramatic shadows, decorative borders,
  custom cursors, grain overlays, radial gradients as ambient light sources.
- Use CSS `backdrop-filter: blur()` for glass morphism effects.
- Tailwind v4: use arbitrary values for complex backgrounds `bg-[radial-gradient(...)]`.

## Implementation Guidelines (This Project's Stack)

### Next.js / React Specifics
- **Server Components first**: Static design elements should be RSC (no `"use client"`).
- **Client Components for interactivity**: Only add `"use client"` when animation or
  state is needed. Use Framer Motion's `motion` components with `"use client"`.
- **`next/font` for all fonts**: Enables automatic subsetting, no layout shift.
- **Tailwind CSS v4**: Use `@theme` blocks in CSS for token customization, not
  `tailwind.config.ts`. Use `@apply` sparingly; prefer composition.

### File Organization
- Reusable design primitives go in `components/ui/`
- Page-specific design elements stay co-located with the page
- Complex animated sections get their own component file

### Anti-Patterns — NEVER Do These

### ❌ WRONG
- Using Inter, Roboto, Arial, or system font stack as primary fonts
- Purple gradients on white backgrounds (the #1 AI-slop signature)
- Every element has `rounded-lg` with identical border-radius
- Centered layouts with max-width containers on EVERY section
- Same fade-in animation on every element
- Cookie-cutter card grids with identical sizing
- Solid white or solid black backgrounds with no texture/depth
- Font size jumps of only 2px-4px between headings (no dramatic scale)

### ✅ CORRECT
- Distinctive font pairings chosen for the specific context
- Bold, intentional color choices tied to the aesthetic direction
- Varied border-radius: some sharp (rounded-none), some pill-shaped (rounded-full)
- Asymmetric layouts, off-center alignments, breaking the container
- Staggered reveals, scroll-triggered animations, one dramatic page-load sequence
- Cards with varying sizes, aspect ratios, and emphasis levels
- Atmospheric backgrounds: noise, grain, gradients, geometric patterns
- Dramatic typographic scale: 6xl headlines with xs body text

## Verification Checklist

After implementing a design, verify:
- [ ] Fonts are distinctive and loaded via `next/font`
- [ ] Color palette is cohesive, not evenly distributed across the rainbow
- [ ] Motion exists but feels intentional — page load reveal, hover states
- [ ] Backgrounds have depth (gradient, texture, pattern) — not flat solid colors
- [ ] Layout has at least one "surprising" element (asymmetry, overlap, diagonal)
- [ ] Typographic scale is dramatic (clear hierarchy, not subtle sizing)
- [ ] The design would be memorable — someone could describe "that one thing" about it
- [ ] No generic AI aesthetics: no purple gradients, no Inter font, no uniform rounded corners
- [ ] Tailwind v4 `@theme` used for custom tokens, not `tailwind.config.ts`
