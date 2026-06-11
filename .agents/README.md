# MetaBuff Agent System

This directory contains the **MetaBuff agent orchestration system** — a set of AI coding agents that work together to decompose, implement, validate, and test complex coding tasks.

## ✦ v3.1.0 — Anthropic Skills Integration ✦

MetaBuff v3.1.0 integrates the [anthropics/skills](https://github.com/anthropics/skills) standard
by Anthropic — a standardized, portable skill format for AI agents with YAML frontmatter,
progressive disclosure, and "why over must" instructional design.

| Anthropic Concept | MetaBuff Implementation |
|----|----|
| YAML Frontmatter Standard | `template/SKILL.md` for all new MetaBuff skills |
| Progressive Disclosure | Metadata always loaded; body loaded on keyword match |
| "Why over Must" Philosophy | Enhanced prompts explain reasoning behind instructions |
| Anti-Pattern Prevention | ❌ WRONG vs ✅ CORRECT catalog injected into agent context |
| Verification Loops | Run → Inspect → Fix → Re-verify in CoT STEP 5 |
| Skill Creator | AI-assisted skill creation with eval benchmarks |
| Webapp Testing | Playwright reconnaissance-first browser testing |
| MCP Builder | Structured MCP server development protocol |

### Key Tailored Differences from Upstream Anthropic Skills

- **Coding-focused**: Document skills (docx/pptx/xlsx/pdf) are NOT imported — MetaBuff is a coding agent
- **Hot-load integrated**: Skills discovered via O(1) inverted index cache, not filesystem reads
- **Pipeline-integrated**: Skills inject via `withECCContext()` in complexity-aware pipeline

MetaBuff v3.0.0 integrates the [obra/superpowers](https://github.com/obra/superpowers) methodology
by Jesse Vincent — a structured approach to agentic software development with enforced TDD,
formalized code review, brainstorming gates, and structured finishing workflows.

| Superpowers Concept | MetaBuff Implementation |
|----|----|
| Brainstorming Gate | CoT v3 STEP 0: design-doc-before-code for complex/mega tasks |
| Writing Plans | Granular checkbox plans with verification per step |
| Subagent-Driven Development | Mega pipeline: two-stage review (spec compliance → code quality) |
| TDD Iron Law | Skill injection + pipeline enforcement (red-green-refactor) |
| Formalized Code Review | SHA-bounded, no performative agreement, severity-tagged |
| Finishing Workflow | Validator v1.2.0: full test pass + structured completion |
| Session-start Hooks | hooks.json: auto-inject methodology on session start |

### Key Tailored Differences from Upstream Superpowers

- **Auto-triggered gates**: Brainstorming is triggered by complexity analysis, not manual approval
- **Pipeline-integrated TDD**: Iron Law enforced via skill injection, not external hooks
- **Severity-tagged reviews**: [CRITICAL|HIGH|MEDIUM|LOW] instead of pass/fail only
- **Structured completion**: merge/PR/keep/discard options with workspace auto-detection

## Model Auto-Detection

All agents use `.agents/model-config.ts` shared resolver (`resolveModel()`) for model selection:

1. `METABUFF_MODEL` env var → 2. `.agents/model-config.json` → 3. Default: `deepseek/deepseek-v4-pro`

Supported models: `deepseek/deepseek-v4-pro`, `moonshot/mimo-2.5-pro`, `moonshot/kimi-k2.6`.

## Architecture Overview

```
                     ┌─────────────┐
                     │   metabuff   │  ← Main orchestrator (complexity router)
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         Simple         Complex        Mega
       (1-2 files)   (multi-file)   (parallel)
              │             │             │
         base(CoT v2)  planner|reasoner  metabuff-mega
              │         (CoT v2)     (cascade waves)
         typecheck      reviewer          │
         [regex-guard]  typecheck    file-picker
         validator      regex-guard  thinker → N subtasks
                        validator    wave1[≤6] → inter-review
                                     wave2[≤6] → ...
                                     synthesis-review
                                     regex-guard
                                     typecheck+tests
                                     validator
```

### Agent Roles

| Agent | Version | Role | Description |
|-------|---------|------|-------------|
| `metabuff` | v1.4.0 | **Orchestrator** | Classifies task complexity (simple/complex/mega) and routes to the optimal pipeline. Enforces CoT v2 with Socratic pre-flight. Routes algorithm tasks to `metabuff-reasoner`. |
| `metabuff-mega` | v1.2.0 | **Parallel Spawner** | Decomposes large tasks into up to 12 subtasks, runs them in cascade waves of ≤6 parallel agents (Antigravity 2.0 pattern, Freebuff-safe). Supports dynamic `custom` specialist types. |
| `metabuff-reasoner` | v1.0.0 | **Deep Logic Specialist** | 6-step Socratic protocol for algorithmic tasks (understand → challenge → explore → select → implement → prove). Uses `effort: 'high'`. Closes single-model reasoning gap (~55 → ~72/100 vs Claude Opus). |
| `metabuff-regex-guard` | v1.0.0 | **Regex Safety Validator** | Catches runtime-invalid regex patterns TypeScript's type checker misses. 4-phase scan: syntax, ReDoS, double-escape, empty alternation. Spawned after any AI-generated code. |
| `metabuff-validator` | v1.1.0 | **Validator** | Post-execution audit: ghost imports, phantom edits, broken tests, incomplete TODOs, regex safety delegation, and function signature consistency. |
| `metabuff-testgen` | v1.0.0 | **Test Generator** | Writes unit/integration tests matching the project's existing style. |
| `metabuff-arch` | v1.0.0 | **Architecture Analyst** | Handles data model design, API contracts, component structure, and dependency analysis. |
| `metabuff-security` | v1.0.0 | **Security Analyst** | Audits for hardcoded secrets, injection vulnerabilities, auth gaps, and insecure patterns. |

## What Closed in v1.4.0

| Gap (from v1.3.0 chart) | Fix | Expected Impact |
|------------------------|-----|-----------------|
| Single-model reasoning: ~55/100 | `metabuff-reasoner`: 6-step Socratic + effort=high routed by `isAlgorithmTask` | ~72/100 |
| Hallucination control: ~65/100 | CoT v2 STEP 2.5 "3 failure modes before coding" | ~72/100 |
| Parallel scale: 6 agents hard ceiling | Cascade waves: 2× waves of 6 = 12 effective specialists | 12 agents total |
| Dynamic agent creation: Static pool | `custom` specialist type in mega thinker schema with `customRole`+`customSystemAddition` | Near-dynamic |
| Regex runtime errors: undetected | `metabuff-regex-guard` in all pipelines; `metabuff-validator` v1.1.0 auto-delegates | Eliminated class |

## Agent Definition Structure

Every agent file exports a default `AgentDefinition` object:

```typescript
import { AgentDefinition } from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'my-agent',
  version: '1.0.0',
  displayName: 'My Agent',
  spawnerPrompt: 'Short description for spawning this agent.',
  systemPrompt: 'System prompt that sets the agent\'s personality and rules.',
  model: 'deepseek/deepseek-v4-pro',
  reasoningOptions: { enabled: true, exclude: false, effort: 'medium' },
  toolNames: ['read_files', 'str_replace', 'write_file', 'spawn_agents', 'end_turn'],
  spawnableAgents: ['codebuff/base@0.0.1'],
  handleSteps: function* ({ prompt }) {
    // Generator-based execution flow
  },
}

export default definition
```

## ⚠️ CRITICAL RULE: Inline Helpers Inside `handleSteps`

**Never reference module-level functions or constants inside `handleSteps`.**

The agent execution framework extracts only the exported `definition` object — module-level function bindings are NOT preserved. Inline ALL helpers inside `handleSteps`.

```typescript
// ❌ WRONG — lost at runtime
function helper() { return 'value' }
const definition = { handleSteps: function* () { helper() } }

// ✅ CORRECT — inlined inside the generator
const definition = {
  handleSteps: function* () {
    function helper() { return 'value' }  // Safe: inside the closure
    helper()
  },
}
```

**Exception:** Module-level constants used only in definition *properties* (not inside `handleSteps`) are safe — they're evaluated at import time.

### Files that follow this rule

**All agents now have handleSteps (2026-06-10 fix):**

| File | Has `handleSteps` | Status |
|------|:---:|:---:|
| `metabuff.ts` | ✅ | ✅ Inlined |
| `metabuff-mega.ts` | ✅ | ✅ Inlined |
| `metabuff-reasoner.ts` | ✅ | ✅ Pattern B — 6-step Socratic generator |
| `metabuff-validator.ts` | ✅ | ✅ Pattern B — 10-step audit generator |
| `metabuff-arch.ts` | ✅ | ✅ Pattern A — orient, design, verify |
| `metabuff-security.ts` | ✅ | ✅ Pattern A — audit, fix, verify |
| `metabuff-testgen.ts` | ✅ | ✅ Pattern A — discover, write, run, fix |
| `metabuff-regex-guard.ts` | ✅ | ✅ Pattern A — scan, triage, fix, re-scan |
| `thinker-with-files-gemini.ts` | ✅ | ✅ Pattern A — task decomposition |
| All 63 `ecc-*.ts` agents | ✅ | ✅ Shared template via `createHandleSteps()` |

**Removed agents:** `researcher-web.ts`, `researcher-docs.ts` (unused, unsupported Gemini model).

## Anti-Hallucination Protocol (CoT v2)

All MetaBuff implementation agents use CoT v2, which adds a mandatory **Socratic pre-flight** step:

1. **ORIENT** — State the goal and list all files to read
2. **GROUND** — Read files and verify all symbols before referencing them
3. **QUESTION** *(NEW v1.4.0)* — Articulate 3 failure modes; flag assumptions; resolve before continuing
4. **PLAN** — Numbered action plan; flag `⚠ UNCERTAIN` items
5. **EXECUTE** — Targeted edits with narration
6. **VERIFY** — Re-read, run tests, fix issues

### Grounding Rules (Never Violate)

- ✗ Do not reference a file path without having read it
- ✗ Do not assume a function/type exists — verify with `code_searcher`
- ✗ Do not invent package names or import paths
- ✗ Do not leave TODOs or placeholder code
- ✗ Do not proceed with unresolved `⚠ UNCERTAIN` items

## Performance Constraints

| Constraint | Value | Reason |
|-----------|-------|--------|
| `MAX_WAVE_SIZE` | 6 | Hard limit — more concurrent spawns freeze/crash Freebuff |
| `MAX_DECOMP_TASKS` | 12 | Soft limit — 2 waves of 6 = 12 effective specialists |
| `BASHER_TIMEOUT` | 60s (simple/complex), 120s (mega) | Prevent infinite hangs |
| Reasoner effort | `'high'` | Only for algorithm tasks — avoids unnecessary cost on standard tasks |

## handleSteps Requirement (Freebuff Free Mode)

Freebuff's free tier **requires `handleSteps`** (a generator-based execution function) for all custom agents. Prompt-only agents (pure `systemPrompt` + `instructionsPrompt`) without `handleSteps` are rejected with HTTP 403 `free_mode_invalid_agent_model`.

As of 2026-06-10, all 70+ MetaBuff agents have handleSteps via:
- **Pattern A** (minimal shim): `createHandleSteps()` shared template for 63 ECC agents + metabuff-arch, security, testgen, regex-guard, thinker-with-files-gemini
- **Pattern B** (explicit generator): Custom multi-phase generators for metabuff-reasoner (6-step Socratic) and metabuff-validator (10-step audit)
- **Orchestrators**: metabuff and metabuff-mega have their own comprehensive handleSteps generators
