---
name: canvas-design
description: >
  Create beautiful visual design elements, posters, art pieces, and static visual
  compositions using design philosophy. Use when the user asks to create a poster,
  piece of art, design system illustration, hero image, decorative element, or other
  static visual piece for a web application. Creates original visual designs via
  philosophy-driven aesthetic movements. Triggered by: poster, art, visual design,
  illustration, decorative, hero image, canvas, aesthetic composition.
---

# Canvas Design — Philosophy-Driven Visual Art

> **Adapted from**: [anthropics/skills/canvas-design](https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md)
> **MetaBuff-Tailored**: Adapted for creating visual design elements in Next.js/React
> web apps. The philosophy-driven approach applies to: hero section compositions,
> decorative background elements, poster-style feature cards, and any static visual
> design that benefits from artistic direction.

## Purpose

Create beautiful, original visual designs using a philosophy-first approach. Rather
than starting with layouts or templates, begin by defining an aesthetic movement —
then express it visually. The result is design that feels intentional, crafted, and
artistically coherent rather than assembled from generic patterns.

## When to Use

- Designing a hero section or landing area that needs artistic impact
- Creating decorative background elements, patterns, or textures
- Designing poster-style promotional cards or feature highlights
- Building a visual identity for a section or page
- User asks for something "artistic", "beautiful", "museum-quality", or "poster-like"
- Creating SVG illustrations or CSS art for the web app

## Two-Step Process

### Step 1: Design Philosophy Creation

Before any visual work, create a **design philosophy** — a 4-6 paragraph manifesto
that defines the aesthetic movement. This is NOT a layout or template. It describes:

- **Space and form**: How elements occupy the canvas. Dense? Sparse? Overlapping?
  Floating? Anchored to a grid?
- **Color and material**: What palette? What textures? Matte? Glossy? Grain?
  Translucent layers?
- **Scale and rhythm**: What's oversized? What's tiny? Where does the eye travel?
  Is there repetition, pattern, sequence?
- **Composition and balance**: Symmetrical? Asymmetrical? Radial? Diagonal flow?
  How does tension resolve?
- **Visual hierarchy**: What dominates? What whispers? How does information encode
  spatially rather than textually?

**Key principles for the philosophy:**
- Name the movement in 1-2 words: "Chromatic Silence", "Brutalist Joy", "Organic Systems"
- Every design aspect mentioned ONCE — avoid redundancy
- Emphasize craftsmanship: "meticulously crafted", "painstaking attention",
  "master-level execution", "product of countless hours"
- Leave creative space: the philosophy guides, it doesn't dictate every pixel

### Step 2: Visual Expression (Canvas Creation)

With the philosophy as foundation, create the visual piece. For this project's stack,
this means:

**For web (HTML/CSS/SVG):**
- Create as a React component or as CSS/SVG in the appropriate location
- Use CSS custom properties for the design tokens defined by the philosophy
- SVG for geometric patterns, illustrations, and scalable art
- CSS `background-image` with data URIs for textures and grain effects
- Framer Motion for any animated elements (subtle, philosophy-driven motion)

**For standalone assets (.png/.svg):**
- Create SVG files in `public/` for static assets
- Use CSS art techniques for complex visual compositions
- Generate pattern tiles where appropriate for repeatable backgrounds

**Critical execution rules:**
- **Text is minimal and visual-first**: Words are rare, powerful gestures integrated
  into the visual architecture — never explanatory paragraphs
- **Ideas communicate through space, form, color, composition**: Not through text
- **Nothing falls off the canvas**: All elements within bounds with proper margins
- **Nothing overlaps unintentionally**: Every element has breathing room
- **Expert craftsmanship**: The result must look like someone at the top of their
  field labored over every detail

## Example Philosophies (Quick Reference)

**"Concrete Poetry"** — Monumental form, bold geometry, massive color blocks,
sculptural typography (huge single words, tiny labels), Brutalist spatial divisions.
Text as rare, powerful gesture.

**"Chromatic Language"** — Color as the primary information system. Geometric
precision where color zones create meaning. Typography minimal — small sans-serif
labels. Think Josef Albers meets data visualization.

**"Analog Meditation"** — Quiet visual contemplation through texture and breathing
room. Paper grain, ink bleeds, vast negative space. Typography whispered. Japanese
photobook aesthetic.

**"Organic Systems"** — Natural clustering and modular growth patterns. Rounded forms,
organic arrangements, color from nature through architecture. Spatial relationships
tell the story.

**"Geometric Silence"** — Pure order and restraint. Grid-based precision, stark
graphics, dramatic negative space. Swiss formalism meets Brutalist material honesty.

## Implementation for This Project

### File Placement

| Artifact Type | Location |
|---|---|
| Hero section component | `components/` — new component file |
| Decorative SVG pattern | `public/patterns/` — static asset |
| CSS art / texture | `app/globals.css` — `@theme` or utility class |
| Animated illustration | `components/` — `"use client"` + Framer Motion |
| Background texture | Inline in component or CSS custom property |

### Tech-Specific Guidance

- **SVG patterns**: Use `<pattern>` elements in SVG for seamless repeating designs.
  Reference via `url(#pattern-id)`.
- **CSS textures**: Use `background-image: url("data:image/svg+xml,...")` for
  lightweight noise, grain, and geometric textures without extra HTTP requests.
- **Tailwind v4**: Use arbitrary values for philosophy-specific colors and effects.
  Extend `@theme` in `globals.css` if the palette is reused.
- **Framer Motion**: Use for subtle, philosophy-driven animation — not generic
  fade-in. Motion should express the philosophy's rhythm.

## Anti-Patterns

### ❌ WRONG
- Starting with a template or layout before defining the aesthetic philosophy
- Using stock illustrations or generic icon sets as the main visual element
- Filling the canvas with explanatory text instead of visual communication
- Generic AI aesthetics: purple gradients, Inter font, uniform rounded corners
- Adding more elements to fix a weak composition (refine what's there instead)
- Overlapping elements without intentional spatial tension
- Cartoony or amateurish execution — this is art, not decoration

### ✅ CORRECT
- Define the philosophy first, then let every visual choice flow from it
- Original geometric compositions, patterns, and shapes
- Minimal text integrated as a visual element — never paragraphs
- Bold, distinctive aesthetic choices tied to the specific context
- Refine and polish existing elements rather than adding new ones
- Every element placed with the precision of a master craftsman
- Museum-quality execution: crisp, intentional, nothing accidental

## Verification Checklist

After creating a visual design:
- [ ] Design philosophy (4-6 paragraphs) exists and is coherent
- [ ] Every visual choice can be traced back to the philosophy
- [ ] Text is minimal and integrated as a visual element (not explanatory blocks)
- [ ] Nothing falls off the canvas — all elements within bounds with margins
- [ ] No unintentional overlaps — every element has breathing room
- [ ] Color palette is cohesive and limited (3-5 colors max)
- [ ] The result looks meticulously crafted, not AI-generated
- [ ] File is in the correct location per the placement table above
- [ ] One distinctive, memorable element exists — the "soul" of the piece
- [ ] Works at multiple viewport sizes (responsive where applicable)
