# Anthropic Skills Standard — Integrated into MetaBuff

> **Source**: [https://github.com/anthropics/skills](https://github.com/anthropics/skills) by Anthropic  
> **Integration**: Tailored for MetaBuff's agent orchestration system  
> **Version**: 1.2.0

## What This Is

The Anthropic Skills repo provides a **standardized, portable skill format** for AI agents —
modular `SKILL.md` files with YAML frontmatter that agents load on-demand.
This integration adapts its format innovations and key skills to MetaBuff's existing
skill hot-load system.

## Core Innovations Adapted

| Anthropic Concept | MetaBuff Implementation |
|---|---|
| YAML Frontmatter Standard | `template/SKILL.md` with `name` + `description` frontmatter for all new MetaBuff skills |
| Progressive Disclosure | Metadata always loaded via cache; full body loaded on keyword match |
| "Why over Must" Philosophy | Enhanced agent prompts explain reasoning, not just commands |
| Anti-Pattern Prevention | `anti-pattern-prevention/` skill with ❌ WRONG vs ✅ CORRECT patterns |
| Verification Loops | `verify-iterate/` skill: run → inspect → fix → re-verify cycle |
| Skill Creator | `skill-creator/` skill: AI-assisted skill creation with eval benchmarks |
| Bundled Resources | Convention: `scripts/`, `references/`, `assets/` per skill directory |
| Webapp Testing | `webapp-testing/` skill: Playwright reconnaissance-then-action |
| MCP Builder | `mcp-builder/` skill: structured MCP server development protocol |
| Frontend Design | `frontend-design/` skill: bold, distinctive UI design with anti-AI-slop principles |
| Web Artifacts Builder | `web-artifacts-builder/` skill: architecture-first complex multi-component features |
| Canvas Design | `canvas-design/` skill: philosophy-driven visual art and design compositions |

## Key Tailored Differences from Upstream Anthropic Skills

- **Hot-load integration**: Skills are discovered via MetaBuff's O(1) inverted index cache, not filesystem reads on every trigger
- **Coding-focused**: Document skills (docx/pptx/xlsx/pdf) are NOT imported — MetaBuff is a coding agent, not a document editor
- **Pipeline-integrated**: Skills inject into MetaBuff's complexity-aware pipeline (simple/complex/mega) via `withECCContext()`
- **Standard-compatible**: MetaBuff skills can adopt the YAML frontmatter format while remaining backward-compatible with existing plain Markdown skills

## Skill Files

- `skill-creator/` — AI-assisted skill creation workflow with eval benchmarks
- `webapp-testing/` — Playwright-based browser testing with reconnaissance-first pattern
- `mcp-builder/` — Structured Model Context Protocol server development
- `anti-pattern-prevention/` — ❌ WRONG vs ✅ CORRECT teaching patterns
- `verify-iterate/` — Run → Inspect → Fix → Re-verify quality loop
- `frontend-design/` — Distinctive, production-grade frontend interfaces; bold aesthetic direction, typography, color, motion, spatial composition
- `canvas-design/` — Philosophy-driven visual art: design manifestos expressed as posters, hero images, patterns, and decorative elements
- `web-artifacts-builder/` — Architecture-first approach for complex multi-component web features with state management patterns
- `template/` — Standardized SKILL.md template with YAML frontmatter
