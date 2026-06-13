# Theme Consistency Refactor — Specification

## 1. Problem Statement

The TANGLAW frontend has a theme system (`theme-changer.tsx` + CSS custom properties + `next-themes`) that works at the token level, but many components bypass it with hardcoded Tailwind colors (`text-zinc-900`, `bg-white`, `border-white/10`, `bg-[#3b1b1b]`, etc.). This causes visual breakage in dark mode (white backgrounds on dark surfaces, invisible text, washed-out borders) and light mode (dark-mode-only error colors appearing as dark blocks).

**Goal**: Every color in the UI must resolve through the theme token system so dark and light modes look equally polished.

---

## 2. Current Architecture

### Theme Token Flow
```
theme-changer.tsx (defines THEMES.light / THEMES.dark)
  → applyThemeCSS() sets CSS custom properties on <html>
    → globals.css :root defaults + @theme mappings
      → Components use bg-[color:var(--theme-*)] or Tailwind @theme aliases
```

### What Works
- Core surface/text tokens (`--theme-surface`, `--theme-canvas`, `--theme-typography-main`, etc.)
- GlowingText effect (`html.dark .glow-*` in globals.css)
- Components that use `bg-[color:var(--theme-surface)]`, `text-[color:var(--theme-text-body)]`

### What's Broken
- **76+ instances** of `border-white/5`, `bg-white/5`, `hover:bg-white/5` across components — invisible in light mode
- **16 instances** of hardcoded Tailwind color classes (`text-zinc-900`, `bg-slate-800/50`, `bg-gray-100`, `bg-white`, `text-zinc-700`)
- **8 instances** of hardcoded hex colors (`border-[#a96b6b]`, `bg-[#3b1b1b]`, `text-[#f1c2c2]`, `text-[#85a3ff]`, `text-[#f5b0af]`)
- **6 instances** of `text-white/20` separators — invisible in light mode
- Missing semantic tokens for error, success, deadline, and glass effects

---

## 3. Scope

### 3.1 New Theme Tokens to Define

Add to `theme-changer.tsx` THEMES object AND `globals.css` `:root` + `@theme`:

| Token | Light Value | Dark Value | Purpose |
|-------|-------------|------------|---------|
| `--theme-error` | `#DC2626` | `#FCA5A5` | Error text/accent color |
| `--theme-error-bg` | `#FEF2F2` | `#3B1B1B` | Error background |
| `--theme-error-border` | `#FECACA` | `#A96B6B` | Error border |
| `--theme-success` | `#16A34A` | `#86EFAC` | Success text/accent color |
| `--theme-success-bg` | `#F0FDF4` | `#1A3A2A` | Success background |
| `--theme-success-border` | `#BBF7D0` | `#2D6B4F` | Success border |
| `--theme-warning` | `#D97706` | `#FCD34D` | Warning text/accent (amber states) |
| `--theme-warning-bg` | `#FFFBEB` | `#422006` | Warning background |
| `--theme-warning-border` | `#FDE68A` | `#92400E` | Warning border |
| `--theme-danger` | `#DC2626` | `#FCA5A5` | Timer critical / error icon |
| `--theme-deadline` | `#DC2626` | `#FCA5A5` | Deadline warning (reuses danger) |
| `--theme-overlay` | `rgba(0,0,0,0.08)` | `rgba(0,0,0,0.25)` | Subtle glass overlay |
| `--theme-glass-border` | `rgba(255,255,255,0.35)` | `rgba(255,255,255,0.10)` | Glass panel borders |
| `--theme-glass-bg` | `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.05)` | Glass panel background |
| `--theme-separator` | `rgba(0,0,0,0.10)` | `rgba(255,255,255,0.10)` | Horizontal rules / dividers |

### 3.2 Files to Modify

#### Tier 1 — Token Definitions
- `frontend/src/components/theme-changer.tsx` — Add new tokens to `THEMES.light.values` and `THEMES.dark.values`
- `frontend/src/app/globals.css` — Add `:root` defaults, `@theme` mappings, and smooth transition CSS

#### Tier 2 — Hardcoded Color Fixes (Priority: Most Visually Broken)

**Auth Pages (hardcoded error/success hex colors):**
- `frontend/src/app/(auth)/login/page.tsx` — Replace `bg-[#3b1b1b]`, `border-[#a96b6b]`, `text-[#f1c2c2]`, `text-[#85a3ff]`, `text-[#f5b0af]` with new error/success tokens
- `frontend/src/app/(auth)/signup/page.tsx` — Same replacements

**Dashboard Pages (hardcoded zinc/slate/gray/amber):**
- `frontend/src/app/dashboard/scholarships/page.tsx` — Replace `text-zinc-500`, `text-zinc-900`, `text-zinc-600` with theme tokens
- `frontend/src/app/dashboard/reviewer/page.tsx` — Replace `bg-slate-800/50`, `text-slate-300`, `hover:bg-slate-700`, `text-slate-400`, `bg-gray-100`, `bg-white`, `bg-amber-300`, `border-amber-400`, `text-zinc-900`, `hover:bg-gray-50` with theme tokens. Also fix the legend `color` property array (line ~173) that has hardcoded `bg-amber-300`.
- `frontend/src/components/scholarship-pagination.tsx` — Replace `bg-slate-800/50`, `text-slate-300`, `hover:bg-slate-700`, `text-slate-400` with theme tokens

**Readiness Components (hardcoded white/zinc/amber/red):**
- `frontend/src/components/readiness-form.tsx` — Replace `bg-white`, `text-zinc-700`, `bg-amber-300`, `bg-amber-100`, `border-amber-400`, `text-amber-800`, `text-amber-600`, `hover:bg-amber-50`, `hover:border-amber-200`, `text-red-600` with theme tokens. Also fix the `color` property mapping object (line ~390) that maps states to hardcoded amber classes.
- `frontend/src/components/readiness-question.tsx` — Replace `bg-white`, `text-zinc-700`, `text-red-500` (timer critical), `bg-red-500` (timer bar) with theme tokens.
- `frontend/src/components/readiness-feedback.tsx` — Audit for any remaining hardcoded colors

**Scholarship Components:**
- `frontend/src/components/scholarship-card.tsx` — Replace `text-rose-600` deadline with `text-[color:var(--theme-deadline)]`

**Initialization Terminal:**
- `frontend/src/components/initialization-terminal.tsx` — Replace `bg-gray-100`, `placeholder:text-gray-300`, `bg-white` with theme tokens

**Loading/Skeleton States:**
- `frontend/src/app/loading.tsx` — Replace `bg-white/10` (fine in dark, invisible in light)
- `frontend/src/app/about/page.tsx` — Replace `bg-white/5` skeleton colors
- `frontend/src/app/about/about-client.tsx` — Replace `bg-white/5`, `bg-white/20`, `bg-white/40`

#### Tier 3 — Broken Glassmorphism Fixes (border-white/* → theme tokens)

**Navigation & Header:**
- `frontend/src/components/pill-nav.tsx` — Replace `border-white/10`, `bg-white/5`, `border-white/15`, `bg-white/10`, `border-white/5` with `--theme-glass-border`, `--theme-glass-bg`, `--theme-separator`
- `frontend/src/components/site-header.tsx` — Replace `border-white/10`, `hover:bg-white/5`, `bg-white/5`, `bg-white/10`
- `frontend/src/components/site-footer.tsx` — Replace `border-white/5`, `text-white/20`
- `frontend/src/components/theme-changer.tsx` — Replace `border-white/15`, `bg-white/5`, `hover:bg-white/10` with glass tokens

**Dashboard Layout:**
- `frontend/src/app/dashboard/layout.tsx` — Replace `border-white/10`, `hover:bg-white/5`, `border-white/5`, `text-white/20`

**Home & Public Pages:**
- `frontend/src/app/home-client.tsx` — Replace `border-white/10`, `bg-white/5`
- `frontend/src/app/contact/page.tsx` — Replace `border-white/10`, `bg-white/5`
- `frontend/src/app/about/about-client.tsx` — Replace `border-white/10`, `bg-white/5`

**Auth Pages (glassmorphism on cards):**
- `frontend/src/app/(auth)/login/page.tsx` — Replace `border-white/10`, `border-white/15`
- `frontend/src/app/(auth)/signup/page.tsx` — Replace `border-white/10`, `border-white/15`

**Chatbot:**
- `frontend/src/components/owel-chatbot.tsx` — Replace `border-white/10`, `border-white/15`, `border-white/5`

**Scholarship & Readiness (glass on cards):**
- `frontend/src/components/scholarship-filter-panel.tsx` — Replace `border-white/10` (if any)
- `frontend/src/components/readiness-question.tsx` — Replace `border-white/10`
- `frontend/src/components/readiness-form.tsx` — Replace `border-white/10`

### 3.3 Missing Edge Cases & Gaps Identified During Review

#### A. Warning/Amber State Tokens (NEW)
The readiness and reviewer components use amber extensively for "flagged" and "warning" states. These were missing from the original token set:
- Readiness form: `bg-amber-300 border-amber-400 text-zinc-900` for flagged questions
- Readiness form: `bg-amber-100 border-amber-400 text-amber-800` for warning cards
- Readiness form: `text-amber-600` for warning icons
- Reviewer page: `bg-amber-30` for flagged legend items
- Timer critical state: `text-red-500` and `bg-red-500` when time < 10s

#### B. Data-Driven Color Mapping Objects
Several components use JavaScript objects to map states to CSS classes:
- `readiness-form.tsx` line ~390: `color` property maps states like `warning` → `bg-amber-100 border-amber-400 text-amber-800`
- `reviewer/page.tsx` line ~173: legend array with `color: "bg-amber-300"`

These require special attention during refactor — the class strings in the objects must be updated, not just the JSX.

#### C. Hover State Variants
Several components use light-mode-only hover colors:
- `hover:bg-gray-50` (reviewer page) — invisible in dark mode
- `hover:bg-amber-50`, `hover:border-amber-200` (readiness form) — washed out in dark mode

#### D. Token Count
Original spec defined 11 tokens. With warning/danger tokens added, the total is now **16 tokens**.

---

### 3.4 What NOT to Change

- **Glow effects** (`html.dark .glow-primary` etc.) — these use `html.dark` class and work correctly as-is
- **`bg-primary`, `text-primary`** — these already resolve through `--theme-primary` via Tailwind `@theme`
- **Theme token references** (`bg-[color:var(--theme-surface)]` etc.) — already correct
- **Shadow intensity** (`shadow-black/20`, `shadow-black/25`, `shadow-black/30`) — these are acceptable across both themes as subtle depth cues
- **`shadow-[0_0_16px_rgba(27,64,121,0.2)]`** — hardcoded primary glow shadows on Sign Up buttons (site-header.tsx line 112). These match the brand blue and work acceptably in both themes.

---

## 4. Implementation Details

### 4.1 Smooth Theme Transition

**Approach: next-themes `disableTransitionOnChange` + opt-in transition class**

This is the community-standard approach validated by the next-themes maintainers and Tailwind CSS docs.

#### Step 1: Enable `disableTransitionOnChange` on ThemeProvider

In `frontend/src/app/layout.tsx`, update the ThemeProvider:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
```

This tells next-themes to **temporarily disable ALL CSS transitions** before switching the theme class, then re-enable them immediately after. This prevents the "jarring snap" where elements with existing hover/animation transitions get interrupted mid-transition.

#### Step 2: Add opt-in transition utility class

In `frontend/src/app/globals.css`:

```css
/* Smooth theme transitions — applied via JS after theme switch completes */
.theme-transition,
.theme-transition *,
.theme-transition *::before,
.theme-transition *::after {
  transition: background-color 0.3s ease,
              color 0.25s ease,
              border-color 0.25s ease,
              box-shadow 0.25s ease,
              fill 0.25s ease,
              stroke 0.25s ease !important;
}
```

#### Step 3: Add transition orchestration in theme-changer.tsx

After `setTheme(nextTheme)`, briefly apply the `.theme-transition` class to `<html>`, then remove it after the transition completes:

```tsx
const toggleTheme = () => {
  const nextTheme = resolvedTheme === "light" ? "dark" : "light";
  document.documentElement.classList.add("theme-transition");
  setTheme(nextTheme);
  setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 350); // slightly longer than transition duration
};
```

#### Why NOT a global `*` transition

- A permanent `* { transition: ... }` in CSS causes **hover state lag** — buttons feel sluggish because hover color changes now animate over 250ms
- It interferes with **Framer Motion** animations (transform, opacity transitions get overridden)
- It affects **loading spinners**, **skeleton pulses**, and **scroll-triggered animations**
- The `!important` in `.theme-transition` overrides existing transitions only during the theme switch, then gets removed

#### Why `disableTransitionOnChange` matters

Without it, next-themes switches the `.dark` class instantly. Elements that already have `transition: all 0.2s` (e.g., hover states) would animate their color change over 200ms, but elements without explicit transitions would snap instantly — creating an inconsistent, jarring visual. `disableTransitionOnChange` ensures a clean slate before the opt-in class takes over.

#### CSS Custom Property Note

TANGLAW's theme system sets CSS custom properties directly via `document.documentElement.style.setProperty()`. These variables don't animate by default (CSS spec: custom properties are discrete, not interpolable, unless registered with `@property`). However, the components use these variables in `background-color`, `color`, `border-color` etc. — those **computed properties DO transition** when the variable value changes, as long as a `transition` rule targets them. This is why `.theme-transition` works: it transitions the *computed* properties, not the variables themselves.

### 4.2 Token Replacement Patterns

| Current Pattern | Replacement | Files Affected |
|----------------|-------------|----------------|
| `border-white/5` | `border-[color:var(--theme-glass-border)]/20` OR keep as-is if acceptable | ~15 files |
| `bg-white/5` | `bg-[color:var(--theme-glass-bg)]` | ~12 files |
| `hover:bg-white/5` | `hover:bg-[color:var(--theme-glass-bg)]` | ~10 files |
| `border-white/10` | `border-[color:var(--theme-glass-border)]/50` | ~20 files |
| `border-white/15` | `border-[color:var(--theme-glass-border)]` | ~5 files |
| `bg-white/10` | `bg-[color:var(--theme-glass-bg)]/80` | ~3 files |
| `hover:bg-white/10` | `hover:bg-[color:var(--theme-glass-bg)]/80` | ~2 files |
| `bg-white/20` | `bg-[color:var(--theme-glass-bg)]` | ~2 files |
| `text-white/20` | `text-[color:var(--theme-separator)]` | ~3 files |
| `text-zinc-900` | `text-[color:var(--theme-typography-main)]` | ~3 files |
| `text-zinc-600` | `text-[color:var(--theme-text-body)]` | ~2 files |
| `text-zinc-500` | `text-[color:var(--theme-text-muted)]` | ~2 files |
| `text-zinc-700` | `text-[color:var(--theme-text-body)]` | ~2 files |
| `bg-slate-800/50` | `bg-[color:var(--theme-surface)]` | ~2 files |
| `text-slate-300` | `text-[color:var(--theme-text-muted)]` | ~2 files |
| `hover:bg-slate-700` | `hover:bg-[color:var(--theme-surface)]` | ~2 files |
| `text-slate-400` | `text-[color:var(--theme-text-muted)]` | ~2 files |
| `bg-gray-100` | `bg-[color:var(--theme-canvas)]` | ~3 files |
| `bg-gray-50` | `hover:bg-[color:var(--theme-canvas)]` | ~1 file |
| `bg-white` | `bg-[color:var(--theme-surface)]` | ~4 files |
| `placeholder:text-gray-300` | `placeholder:text-[color:var(--theme-text-muted)]` | ~1 file |
| `placeholder-zinc-400` | `placeholder:text-[color:var(--theme-text-muted)]` | ~1 file |
| `bg-[#3b1b1b]` | `bg-[color:var(--theme-error-bg)]` | ~2 files |
| `border-[#a96b6b]` | `border-[color:var(--theme-error-border)]` | ~2 files |
| `text-[#f1c2c2]` | `text-[color:var(--theme-error)]` | ~2 files |
| `text-[#85a3ff]` | `text-[color:var(--theme-success)]` | ~2 files |
| `text-[#f5b0af]` | `text-[color:var(--theme-error)]` | ~2 files |
| `text-rose-600` | `text-[color:var(--theme-deadline)]` | ~1 file |
| `bg-amber-300` | `bg-[color:var(--theme-warning)]` | ~4 files |
| `border-amber-400` | `border-[color:var(--theme-warning-border)]` | ~3 files |
| `text-amber-800` | `text-[color:var(--theme-warning)]` | ~2 files |
| `text-amber-600` | `text-[color:var(--theme-warning)]` | ~1 file |
| `bg-amber-100` | `bg-[color:var(--theme-warning-bg)]` | ~2 files |
| `hover:bg-amber-50` | `hover:bg-[color:var(--theme-warning-bg)]` | ~1 file |
| `hover:border-amber-200` | `hover:border-[color:var(--theme-warning-border)]` | ~1 file |
| `text-red-500` | `text-[color:var(--theme-danger)]` | ~2 files |
| `bg-red-500` | `bg-[color:var(--theme-danger)]` | ~1 file |
| `hover:bg-gray-50` | `hover:bg-[color:var(--theme-canvas)]` | ~1 file |

### 4.3 Order of Operations

1. **Add new tokens** to `theme-changer.tsx` (THEMES.light + THEMES.dark) and `globals.css` (:root defaults + @theme)
2. **Add smooth transition** CSS to `globals.css`
3. **Fix Tier 2** — Replace hardcoded Tailwind colors with theme tokens (most visually broken)
4. **Fix Tier 3** — Replace broken glassmorphism (border-white/* → theme tokens)
5. **Verify** — Run `npx tsc --noEmit` to check for type errors
6. **Visual QA** — Toggle theme on every page and check for remaining hardcoded colors

---

## 5. Testing Checklist

After implementation, verify each page in both light and dark mode:

- [ ] Landing page (`/`) — hero, feature cards, pill nav, footer
- [ ] About page (`/about`) — team cards, team members section
- [ ] Contact page (`/contact`) — form inputs, info card
- [ ] Login page (`/login`) — form, error states, OAuth buttons
- [ ] Signup page (`/signup`) — form, error states, OAuth buttons
- [ ] Dashboard home (`/dashboard`) — welcome banner, Owel card, scholarship/readiness cards
- [ ] Scholarship directory (`/dashboard/scholarships`) — filter panel, cards, pagination
- [ ] Readiness check (`/dashboard/readiness`) — setup form, question cards, timer, feedback
- [ ] Exam reviewer (`/dashboard/reviewer`) — question cards, navigation, progress bar
- [ ] Navigation — pill nav (desktop + mobile hamburger), header hide/show
- [ ] Chatbot — Owel widget, inline variant, preloaded prompts
- [ ] Theme toggle — smooth transition, no flash on page load
- [ ] Auth guard — redirect screen styling

---

## 6. Out of Scope

- Adding new themes (e.g., "System" mode, sepia, high-contrast)
- Persisting theme preference to backend database
- Changing the theme toggle button UI/UX
- Modifying Framer Motion animation behavior
- Changing the color palette itself (only making existing colors theme-aware)
