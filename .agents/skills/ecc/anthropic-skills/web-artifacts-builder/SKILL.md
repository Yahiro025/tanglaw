---
name: web-artifacts-builder
description: >
  Build elaborate, multi-component web features and complex UI artifacts using
  React, Next.js, Tailwind CSS, and shadcn/ui. Use for complex features requiring
  state management, routing, multiple components, or advanced UI patterns — not
  for simple single-component tasks. Triggered by: complex UI, multi-component,
  dashboard, widget, builder, artifact, elaborate, interactive component.
---

# Web Artifacts Builder — Complex Multi-Component Features

> **Adapted from**: [anthropics/skills/web-artifacts-builder](https://github.com/anthropics/skills/blob/main/skills/web-artifacts-builder/SKILL.md)
> **MetaBuff-Tailored**: Adapted for Next.js + React + Tailwind CSS v4 + this project's
> component architecture. Replaces the claude.ai artifact workflow with standard
> Next.js development patterns.

## Purpose

Build elaborate, multi-component web features that require coordinated state,
routing, and advanced UI patterns. The systematic approach ensures complex
features are built with proper architecture rather than ad-hoc composition.

## When to Use

- Building dashboards with multiple interconnected widgets
- Creating complex interactive tools (calculators, configurators, builders)
- Implementing multi-step wizards or flows with shared state
- Building data visualization dashboards with filters and controls
- Any feature requiring 3+ components with shared state or routing
- NOT for simple single-component tasks (use direct implementation instead)

## Architecture First Approach

### Step 1: Plan the Component Tree

Before writing code, map out:
```
Feature: [Name]
├── Layout: [Shell/Container component]
├── State: [What state is shared vs local?]
├── Components:
│   ├── [Component A] — [Responsibility]
│   ├── [Component B] — [Responsibility]
│   └── [Component C] — [Responsibility]
└── Data Flow: [Parent→Child props] / [URL params] / [Context]
```

### Step 2: Choose State Architecture

For this project (no Redux/Zustand — per knowledge.md):

**Simple (1-2 components):**
- React `useState` + prop drilling
- URL search params for shareable state

**Medium (3-5 components, one page):**
- React Context + reducer pattern
- URL search params via `useSearchParams()` for filter/pagination state
- `useReducer` for complex state transitions

**Complex (6+ components, multi-page):**
- Multiple Context providers composed at layout level
- URL as primary state (search params + path params)
- React `cache()` for server-side data deduplication

### Step 3: Component Design

Follow this project's patterns:
- **Server Components (RSC) by default**: Data fetching in server components
- **Client Components only when needed**: `"use client"` for interactivity, state, effects
- **Composition over inheritance**: Compose small focused components
- **Barrel exports**: `components/ui/index.ts` for shared primitives
- **Co-located components**: Page-specific components stay near their page

### Step 4: Build Order

1. **Scaffold layout**: Create the shell/container component first
2. **Static structure**: Build all components with static data, verify layout
3. **Add data flow**: Wire up props, context, URL params
4. **Add interactivity**: Client-side state, event handlers, animations
5. **Polish**: Loading states, empty states, error states, transitions
6. **Edge cases**: Responsive breakpoints, keyboard navigation, accessibility

## Design & Style Guidelines

**IMPORTANT**: To avoid "AI slop", follow the `frontend-design` skill's guidance:
- Never use generic font families (Inter, Roboto, Arial)
- Avoid purple gradients on white backgrounds
- Vary border-radius (not everything `rounded-lg`)
- Use asymmetric layouts where appropriate
- Create atmosphere with backgrounds, textures, and depth

For this specific project:
- Tailwind CSS v4 with `@theme` blocks in `app/globals.css`
- lucide-react for icons (already installed)
- Framer Motion for animations (already installed)
- Existing design tokens via `@theme` blocks in `app/globals.css`

## Anti-Patterns

### ❌ WRONG
- Building every component as a client component by default
- Using `useState` for everything when URL params would be more appropriate
- Creating a new Context for every piece of state (provider hell)
- Importing `motion` from the wrong Framer Motion entry point
- Not handling loading, empty, and error states
- Building monolithic components instead of composing smaller ones

### ✅ CORRECT
- Server components by default, `"use client"` only when needed
- URL search params for filter/sort/pagination state (shareable, bookmarkable)
- Strategic Context placement: as close to consumers as possible
- Import from `motion/react` (Framer Motion's React-specific entry)
- Every async component has loading.tsx, error.tsx, and handles empty arrays
- Small focused components composed together: Single Responsibility Principle

## Verification

After building a complex feature:
- [ ] Component tree matches the plan
- [ ] Server/client boundary is minimal (most components are RSC)
- [ ] Loading states render during data fetch
- [ ] Empty states show helpful guidance (not blank pages)
- [ ] Error boundaries catch and display errors gracefully
- [ ] URL state is shareable (copy-paste URL reproduces the view)
- [ ] Responsive: works on mobile, tablet, and desktop
- [ ] Keyboard navigation works for interactive elements
- [ ] No prop drilling deeper than 2 levels (use Context or composition)
- [ ] TypeScript types are defined in `lib/types/` if shared across files
