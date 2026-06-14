---
name: skill-library
description: LIBRARY-category skill router for TANGLAW — off-stack and optional skills that remain searchable without loading by default
---

# TANGLAW Skill Library Router

This skill indexes ECC components classified as **LIBRARY** — useful to retain, but not worth loading every session. They remain accessible through keyword-triggered search.

## DAILY vs LIBRARY

| Bucket | Meaning | Count |
|--------|---------|-------|
| **DAILY** | Loads every session — matches TANGLAW's active stack | 10 |
| **LIBRARY** | Searchable, not auto-loaded — off-stack or optional | ~30 |

DAILY skills live in `.claude/skills/{name}/SKILL.md`. This file is the router for LIBRARY skills.

---

## LIBRARY Skill Index

### Off-Stack Languages (reference only — not active in TANGLAW)

| Keyword | Skill | Why LIBRARY |
|---------|-------|-------------|
| `python`, `django`, `flask`, `fastapi` | python-patterns, django-patterns | 2 `.py` utility scripts only — not primary stack |
| `rust`, `cargo` | rust-patterns | No Rust source files |
| `go`, `golang` | go-patterns | No Go source files |
| `swift`, `ios` | swift-patterns | No Swift source files |
| `kotlin`, `android` | kotlin-patterns | No Kotlin source files |
| `java`, `spring` | java-patterns | No Java source files |
| `csharp`, `dotnet` | csharp-patterns | No C# source files |
| `flutter`, `dart` | flutter-patterns | No Dart/Flutter source files |
| `cpp`, `c++` | cpp-patterns | No C++ source files |
| `fsharp`, `f#` | fsharp-patterns | No F# source files |

### Off-Stack Domains (not applicable to TANGLAW)

| Keyword | Skill | Why LIBRARY |
|---------|-------|-------------|
| `ml`, `training`, `model`, `pipeline` | mle-workflow | TANGLAW uses Gemini API — no ML training pipeline |
| `investor`, `pitch`, `fundraising` | investor-materials, investor-outreach | Not applicable to a student research project |
| `market`, `competitive` | market-research | Not currently active |
| `video`, `edit`, `ffmpeg` | video-editing | No video pipeline |
| `media`, `image`, `generate` | fal-ai-media | No media generation pipeline |
| `twitter`, `x`, `tweet` | x-api | No X/Twitter integration |

### Optional Utilities (may be useful for specific tasks)

| Keyword | Skill | When to Use |
|---------|-------|-------------|
| `deep research`, `research`, `paper` | deep-research | Multi-source research for scholarship content |
| `article`, `blog`, `writing` | article-writing | Writing documentation, guides, or blog posts |
| `brand`, `voice`, `tone` | brand-voice | Project branding, about page, mission messaging |
| `product`, `prd`, `spec` | product-capability | Translating PRD intent into implementation plans |
| `tdd`, `test first`, `red green` | tdd-workflow | When writing tests with TDD methodology |
| `e2e`, `playwright`, `browser` | e2e-runner (agent) | When running full E2E test suites |
| `performance`, `optimize`, `bundle` | performance-optimizer (agent) | When profiling or optimizing builds |
| `refactor`, `cleanup`, `dead code` | refactor-cleaner (agent) | When removing unused code |

---

## How to Use

1. **Search by keyword**: Mention any of the keywords above in your prompt, and the corresponding LIBRARY skill can be loaded.
2. **Explicit load**: Tell the AI to load a specific skill by name (e.g., "Load the deep-research skill").
3. **Move to DAILY**: If you find yourself using a LIBRARY skill in every session, it should be promoted to DAILY.

---

## LIBRARY Agent Index

These ECC agents are available but only useful for specific scenarios:

| Agent | Trigger Keywords | Use Case |
|-------|-----------------|----------|
| `ecc-e2e-runner` | `e2e`, `playwright test`, `browser test` | Running full E2E test suites |
| `ecc-performance-optimizer` | `bundle size`, `slow`, `profile`, `LCP` | Performance audits |
| `ecc-refactor-cleaner` | `cleanup`, `dead code`, `unused` | Codebase cleanup passes |
| `ecc-seo-specialist` | `seo`, `meta`, `structured data` | SEO audit passes |
| `ecc-a11y-architect` | `accessibility`, `a11y`, `wcag` | Accessibility audits |
| `ecc-code-simplifier` | `simplify`, `complex`, `over-engineered` | Code simplification passes |

---

_Note: This router does not duplicate skill bodies. Each referenced skill maintains its own canonical body in the ECC repository._
