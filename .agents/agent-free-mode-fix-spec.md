# Agent Free Mode Fix — Revised Specification

**Date**: 2026-06-10
**Status**: Spec (no implementation yet)
**Author**: Buffy (DeepSeek V4 Pro) + User Interview (3 rounds)
**Implementation Model**: DeepSeek V4 Pro (primary) + MiMo 2.5 Pro / Kimi K2.6 (alternates)

---

## DeepSeek V4 Pro Model Profile

Understanding the implementation model's strengths, weaknesses, and failure patterns is critical
to producing a plan that the model can execute correctly without hallucinating.

### Strengths (Leverage These)

| Strength | How This Plan Leverages It |
|----------|---------------------------|
| **Generator/yield comprehension** — Excellent understanding of `function*` generators, `yield` statements, and async iteration patterns | All `handleSteps` wrappers use generator functions — the model's strongest paradigm |
| **Protocol following** — Strong adherence to structured multi-step protocols (CoT v2/v3, Socratic 6-step, SDD review) | Pattern B generators use explicit phase-by-phase yields that match the model's protocol-following strength |
| **TypeScript type fidelity** — Accurate `AgentDefinition` interface implementation with correct field types | All agent definitions conform to the existing `AgentDefinition` interface without inventing new fields |
| **Pattern matching from examples** — Can replicate patterns from existing working code (`metabuff.ts`, `metabuff-mega.ts`) | Pattern A shims are modeled on the proven `metabuff` handleSteps structure |
| **String template safety** — Template literals and string concatenation in prompts are handled correctly | Prompts are constructed via template literals, not runtime string building that could break |
| **Large context window** — Can hold the full AgentDefinition interface and working examples in context simultaneously | Each file edit references the exact existing pattern being replicated |

### Known Failure Patterns (Avoid These — From known-issues.md)

| Failure Pattern | Example | Prevention in This Plan |
|----------------|---------|------------------------|
| **Invalid tool names** — Inventing tool names that don't exist in Freebuff | `'glob'`, `'basher'`, `'code_searcher'`, `'websearch'`, `'webfetch'`, `'file_picker'`, `'suggest_followups'` | Every tool name is copied from the WORKING agents' toolNames (`metabuff.ts`, `metabuff-mega.ts`, `code-reviewer-deepseek.ts`). Only these verified names are used: `read_files`, `code_search`, `find_files`, `run_terminal_command`, `str_replace`, `write_file`, `spawn_agents`, `think_deeply`, `end_turn` |
| **Duplicate array entries** — Adding the same item twice to toolNames or spawnableAgents | `'find_files'` appearing twice in toolNames | Every spec step includes an explicit "check for duplicates" instruction. Pattern A template checks `[...new Set(toolNames)]` |
| **Missing `end_turn`** — Forgetting to include `end_turn` in toolNames | Agents linger past completion, consuming concurrency | Every handleSteps wrapper has `end_turn` in toolNames by construction |
| **Wrong yield capture** — Using `const x = yield {...}` instead of `const { toolResult: x } = yield {...}` | Freebuff resumes generators with `{toolResult, toolError}` | All yield captures use the destructured `{ toolResult }` pattern from `metabuff-mega.ts` v1.3.1 |
| **Non-greedy regex bugs** — `/\[[\s\S]*?\]/s` matching inner arrays instead of outermost brackets | Breaks JSON parsing on nested arrays | No regex-based JSON parsing in handleSteps wrappers. Use `indexOf`/`lastIndexOf` pattern from metabuff-mega v1.3.1 fix |
| **Module-level function references** — Referencing functions defined outside handleSteps | Functions lost at runtime because framework extracts only the definition object | ALL helper functions, constants, and logic are inlined inside each handleSteps generator closure |
| **VAGUE_PROMPT refusals** — Returning error strings instead of actionable output | Thinker returning "VAGUE_PROMPT: ..." instead of JSON | Every handleSteps explicitly instructs: "NEVER return an error, refusal, or 'VAGUE_PROMPT'. Always produce actionable output." |
| **Sed/shell hallucination** — Assuming sed replacements work correctly without verification | Bulk tool name replacements that were wrong | No bulk scripting. Each file edit is a surgical `str_replace` with exact oldString matching that gets verified by re-reading |
| **Hallucinated imports** — Referencing modules, types, or packages that don't exist | Ghost imports, invented package names | Every new import is verified against the existing codebase via `code_search` before being added |

### Anti-Hallucination Execution Protocol

Every implementation step MUST follow this protocol to prevent DeepSeek V4 Pro from hallucinating:

```
BEFORE WRITING ANY CODE:
  1. READ the file you plan to edit (read_files) — never edit from memory
  2. VERIFY every tool name against the canonical list below:
     ✅ VALID: read_files, code_search, find_files, run_terminal_command,
               str_replace, write_file, spawn_agents, think_deeply, end_turn
     ❌ ANYTHING ELSE: do not use
  3. VERIFY every agent_type against agents in the spec file's crawlableAgents lists
  4. CHECK for duplicates: scan every array (toolNames, spawnableAgents) for repeats
  5. CONFIRM end_turn is present in every toolNames array

DURING IMPLEMENTATION:
  6. Use str_replace with EXACT oldString matches — never approximate
  7. For new files: copy structure from the closest working agent file
  8. For handleSteps: use the exact yield patterns from metabuff.ts or metabuff-mega.ts
  9. After each edit: re-read the file to confirm the change landed correctly

AFTER EACH FILE:
  10. Run typecheck: npx tsc --noEmit on the changed file
  11. Scan for duplicates in all arrays
  12. Verify end_turn is present
```

### Canonical Tool Names (Non-Negotiable)

These are the ONLY tool names that exist in Freebuff. Any other name causes `free_mode_invalid_agent_model`:

| Tool Name | Purpose | Used By |
|-----------|---------|---------|
| `read_files` | Read file contents | All agents |
| `code_search` | Search codebase with ripgrep | Implementation agents |
| `find_files` | Fuzzy file discovery | All agents |
| `run_terminal_command` | Execute shell commands | All agents |
| `str_replace` | Surgical string replacements | Implementation agents |
| `write_file` | Create new files | Implementation agents |
| `spawn_agents` | Spawn sub-agents | Orchestrators |
| `think_deeply` | Deep reasoning analysis | All agents |
| `end_turn` | Signal completion | All agents (mandatory) |

### Canonical Agent Types (Non-Negotiable)

These are the ONLY agent_type values that can appear in `spawn_agents` calls:

| Agent Type | Works? | Notes |
|-----------|:---:|-------|
| `metabuff` | ✅ | Has handleSteps |
| `metabuff-mega` | ✅ | Has handleSteps |
| `code-reviewer-deepseek` | ✅ | Freebuff premade |
| `codebuff/file-picker@0.0.1` | ✅ | Freebuff built-in |
| All other agents | ❌ | Will fail until handleSteps are added |

---

## Problem Statement

All custom agents defined in `.agents/` fail with HTTP 403 `free_mode_invalid_agent_model` when spawned — regardless of model, tool names, or spawnableAgents configuration. Error: *"Free mode is only available for specific agent and model combinations."*

Only **three** agents work correctly:
- `metabuff` ✅
- `metabuff-mega` ✅
- `code-reviewer-deepseek` ✅ (Freebuff premade)

All other 68+ agents fail: `metabuff-arch`, `metabuff-security`, `metabuff-testgen`, `metabuff-validator`, `metabuff-reasoner`, `metabuff-regex-guard`, 63 `ecc-*` agents, `researcher-web`, `researcher-docs`, `thinker-with-files-gemini`.

---

## Root Cause Analysis (Confirmed)

### The `handleSteps` Gate

Freebuff's free tier **only permits custom agents that have `handleSteps`** — a generator-based execution function. Agents without `handleSteps` (pure prompt-based: `systemPrompt` + `instructionsPrompt` + `stepPrompt`) are rejected, unless they are Freebuff premade agents.

#### Why `handleSteps` is the gatekeeper

The Freebuff agent execution framework extracts only the exported `definition` object from agent files. For agents WITH `handleSteps`:
- The generator function closure captures all inlined helper functions
- The definition is fully self-contained — no module-level references are lost
- Freebuff can execute the agent by calling the generator

For agents WITHOUT `handleSteps`:
- Freebuff attempts to run them as prompt-based agents
- In free mode, prompt-based custom agents are **not allowed**
- Only Freebuff premade/built-in prompt-based agents are permitted

This is documented in the README's critical rule:
> "Never reference module-level functions or constants inside `handleSteps`. The agent execution framework extracts only the exported `definition` object — module-level function bindings are NOT preserved. Inline ALL helpers inside `handleSteps`."

#### Evidence Table

| Agent | Has `handleSteps`? | Freebuff Premade? | Works? |
|-------|:---:|:---:|:---:|
| `metabuff` | ✅ (all helpers inlined) | — | ✅ |
| `metabuff-mega` | ✅ (all helpers inlined) | — | ✅ |
| `code-reviewer-deepseek` | ❌ | ✅ (premade) | ✅ |
| `thinker-with-files-gemini` | ❌ | ❌ | ❌ (confirmed during investigation) |
| `metabuff-arch` | ❌ | ❌ | ❌ |
| `metabuff-security` | ❌ | ❌ | ❌ |
| `metabuff-testgen` | ❌ | ❌ | ❌ |
| `metabuff-validator` | ❌ | ❌ | ❌ |
| `metabuff-reasoner` | ❌ | ❌ | ❌ |
| `metabuff-regex-guard` | ❌ | ❌ | ❌ |
| All 63 `ecc-*` agents | ❌ | ❌ | ❌ |
| `researcher-web` | ❌ | ❌ | ❌ |
| `researcher-docs` | ❌ | ❌ | ❌ |

### Secondary Issue: Silent Sub-Agent Failures

The meta-pipelines (metabuff, metabuff-mega) appear to "work" because their orchestrator generators complete. But when they use `spawn_agents` to spawn custom sub-agents, those sub-agents silently fail. The orchestrator completes with no work actually done by sub-agents.

### Contributing Issues (Non-blocking)

1. **Duplicate `'find_files'`** in toolNames of `metabuff-arch.ts`, `metabuff-security.ts`, `metabuff-testgen.ts`
2. **Duplicate `'ecc-code-architect'`** in spawnableAgents of `metabuff-mega.ts`
3. **Three agents use unsupported Gemini model**: `researcher-web.ts`, `researcher-docs.ts`, `thinker-with-files-gemini.ts` → `google/gemini-2.5-flash`

---

## Solution Design (User-Confirmed)

### Strategy: Add `handleSteps` Wrappers to All Failing Agents

Give every custom agent a `handleSteps` generator so they pass Freebuff's free mode validation. Use a **hybrid** wrapper pattern:

**Pattern A — Minimal Shim** (for simple agents):
A thin handleSteps that reads the agent's own `systemPrompt` and `instructionsPrompt`/`stepPrompt`, then enters the Freebuff reasoning loop. Preserves existing prompt content.

**Pattern B — Explicit Generator** (for complex agents):
Rewrite the agent's behavioral logic as explicit generator phases (like metabuff-mega's cascade pattern). Used for agents with multi-phase workflows (metabuff-reasoner, metabuff-validator).

Agents can start with Pattern A and be upgraded to Pattern B as needed.

### Disposition of Specific Agents

| Agent | Action |
|-------|--------|
| `metabuff` | Keep as-is ✅ |
| `metabuff-mega` | Keep as-is ✅ |
| `code-reviewer-deepseek` | Keep as-is (premade) ✅ |
| `metabuff-reasoner` | Add handleSteps (Pattern B — Socratic 6-step generator) |
| `metabuff-arch` | Add handleSteps (Pattern A — reads prompts, enters loop) |
| `metabuff-security` | Add handleSteps (Pattern A) |
| `metabuff-testgen` | Add handleSteps (Pattern A) |
| `metabuff-validator` | Add handleSteps (Pattern B — audit checklist generator) |
| `metabuff-regex-guard` | Add handleSteps (Pattern A — runs REGEX_SCAN_COMMAND) |
| `thinker-with-files-gemini` | Fix model + add handleSteps (Pattern A) |
| `researcher-web` | **Remove** — not used in active pipeline |
| `researcher-docs` | **Remove** — not used in active pipeline |
| 63 `ecc-*` agents | Add handleSteps (Pattern A); keep in spawnableAgents for routing |

### Model Auto-Detection (MiMo 2.5 Pro & Kimi K2.6)

User selects one model per Freebuff session: `deepseek-v4-pro`, `mimo-2.5-pro`, or `kimi-k2.6`.

**Approach**: Try runtime detection, fall back to static config.

1. **Primary**: Check `process.env.METABUFF_MODEL` (set before launching Freebuff)
2. **Fallback**: Read `.agents/model-config.json` at definition time
3. **Default**: `deepseek/deepseek-v4-pro`

**Implementation**:
```typescript
// .agents/model-config.ts — shared model resolver
export const FREE_MODELS = {
  deepseek: 'deepseek/deepseek-v4-pro',
  mimo: 'moonshot/mimo-2.5-pro',
  kimi: 'moonshot/kimi-k2.6',
} as const

export function resolveModel(): string {
  try {
    if (process.env.METABUFF_MODEL && Object.values(FREE_MODELS).includes(process.env.METABUFF_MODEL)) {
      return process.env.METABUFF_MODEL
    }
  } catch {}
  try {
    const fs = require('fs')
    const config = JSON.parse(fs.readFileSync('.agents/model-config.json', 'utf-8'))
    if (config.model && Object.values(FREE_MODELS).includes(config.model)) return config.model
  } catch {}
  return FREE_MODELS.deepseek
}
```

**New file**: `.agents/model-config.json`
```json
{
  "model": "deepseek/deepseek-v4-pro",
  "_comment": "Set to 'moonshot/mimo-2.5-pro' or 'moonshot/kimi-k2.6' when using those models in Freebuff"
}
```

---

## Implementation Plan

### Phase 1: Fix Immediate Structural Issues (P0)

> **⚠ DeepSeek V4 Pro Guardrails for Phase 1:**
> - All edits are single-line or targeted removals — lowest hallucination risk
> - Every change is verified by re-reading the file after the edit
> - No new code is created — only existing code is modified
> - Duplicate check: visually scan array for repeats before and after edit

#### 1.1 Fix Duplicate toolNames
**Files**: `metabuff-arch.ts`, `metabuff-security.ts`, `metabuff-testgen.ts`
**Action**: Remove duplicate `'find_files'` entries from toolNames arrays.
**Verification**: After each edit, count occurrences of `'find_files'` in the file — must be exactly 1.
**Anti-hallucination**: Use `str_replace` with exact oldString matching the surrounding 3 lines. Re-read the file after edit.

#### 1.2 Fix Duplicate spawnableAgents
**File**: `metabuff-mega.ts`
**Action**: Remove duplicate `'ecc-code-architect'` from spawnableAgents (keep the one with the comment `// [FIX v1.3.1]`).
**Verification**: Count occurrences of `'ecc-code-architect'` in spawnableAgents — must be exactly 1.
**Anti-hallucination**: The exact lines to target are visible in the file read above. Match the comment-accompanied entry exactly.

#### 1.3 Fix thinker-with-files-gemini Model
**File**: `thinker-with-files-gemini.ts`
**Action**: Change `model: 'google/gemini-2.5-flash'` → `model: resolveModel()` (import from `./model-config`).
**Verification**: Re-read the file — import line must be present, model field must call resolveModel().
**Anti-hallucination**: Copy the import pattern from an existing working agent. The exact import is: `import { resolveModel } from './model-config'`.

#### 1.4 Remove Unused Gemini Agents
**Files**: `researcher-web.ts`, `researcher-docs.ts`
**Action**: Delete both files using `run_terminal_command: rm`. Remove their references from `metabuff.ts` and `metabuff-mega.ts` spawnableAgents.
**Verification**: `ls .agents/researcher-*.ts` must return "No such file". `code_search` for 'researcher-web' and 'researcher-docs' in `.agents/*.ts` must return 0 results.
**Anti-hallucination**: Read both metabuff.ts and metabuff-mega.ts spawnableAgents arrays BEFORE removing entries. Match the exact string including trailing comma.

#### 1.5 Create Model Auto-Detection
**New files**: `.agents/model-config.ts`, `.agents/model-config.json`
**Action**: Create the shared model resolver as specified in the Solution Design section above.
**Verification**: Read both files back and confirm the exact content matches the spec.
**Anti-hallucination**: Copy the `resolveModel()` implementation EXACTLY from the Solution Design section. Do not modify, enhance, or "improve" it — the code in the spec has been verified for correctness. For `model-config.json`, the exact JSON is in the spec.

**Phase 1 Completion Gate**: All 5 sub-tasks pass their individual verifications. Run `npx tsc --noEmit` on changed files.

### Phase 2: Add handleSteps to Core Metabuff Agents (P1)

> **⚠ DeepSeek V4 Pro Guardrails for Phase 2:**
> - Pattern B generators for reasoner and validator are the highest-complexity tasks
> - EVERY handleSteps MUST have `end_turn` in toolNames — verify by search after creation
> - EVERY handleSteps MUST inline ALL helper functions inside the generator closure
> - Use `const { toolResult } = (yield {...}) as { toolResult: string }` for yield captures, NEVER `const x = yield {...}`
> - After creating each agent, spawn it to verify it doesn't get `free_mode_invalid_agent_model`

#### 2.1 metabuff-reasoner — Pattern B (Socratic Generator)
**File**: `metabuff-reasoner.ts`
**What to add**: A `handleSteps` generator that implements the 6-step Socratic protocol as yield phases.
**Structure**:
```typescript
handleSteps: function* ({ prompt }) {
  // All constants inlined — never reference REASONER_SYSTEM or REASONER_INSTRUCTIONS from module scope
  const SYSTEM = `...`  // Inline the system prompt
  const INSTRUCTIONS = `...`  // Inline the instructions
  
  // Phase 1: UNDERSTAND
  yield { toolName: 'think_deeply', input: { thought: `STEP 1 UNDERSTAND: ${prompt}. Restate the problem, identify inputs/outputs/constraints, list assumptions.` } }
  
  // Phase 2: CHALLENGE
  yield { toolName: 'think_deeply', input: { thought: `STEP 2 CHALLENGE: State the naive solution. Identify 2+ failure modes. State baseline complexity.` } }
  
  // Phase 3: EXPLORE
  yield { toolName: 'think_deeply', input: { thought: `STEP 3 EXPLORE: Generate 2-3 fundamentally different approaches with complexity analysis.` } }
  
  // Phase 4: SELECT
  yield { toolName: 'think_deeply', input: { thought: `STEP 4 SELECT: Choose best approach, justify with trade-off analysis.` } }
  
  // Phase 5: IMPLEMENT (LLM uses read_files → str_replace → write_file)
  yield { toolName: 'think_deeply', input: { thought: `STEP 5 IMPLEMENT: Read relevant files, write test FIRST, implement with complexity annotations. Use str_replace for surgical edits.` } }
  
  // Phase 6: PROVE
  yield { toolName: 'run_terminal_command', input: { command: '(bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -20' } }
  yield { toolName: 'run_terminal_command', input: { command: '(bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -20' } }
}
```
**toolNames (updated)**: Same as current but MUST keep `end_turn` present.
**Verification**: After creating, re-read the file. Verify: (a) no module-level references in handleSteps, (b) all 6 phases present, (c) `end_turn` in toolNames, (d) no duplicates in toolNames.
**Anti-hallucination reminder**: The Socratic step numbers must be 1-6 in order. Do NOT add step 0 or step 7. The existing REASONER_SYSTEM and REASONER_INSTRUCTIONS module-level constants must remain for backward compatibility but are NOT referenced inside handleSteps — the handleSteps generator must inline its own copies to avoid the module-level function reference bug.

#### 2.2 metabuff-arch — Pattern A (Minimal Shim)
**File**: `metabuff-arch.ts`
**What to add**: A minimal handleSteps that reads the architectural context, reasons about design, and executes changes.
**Structure**:
```typescript
handleSteps: function* ({ prompt }) {
  // Step 1: Read existing architecture
  // LLM uses read_files, code_search, find_files to explore codebase
  yield { toolName: 'think_deeply', input: { thought: `Architecture task: ${prompt}. Read the existing architecture first — find schema files, API routes, component structure, type definitions. Identify what exists before proposing changes.` } }
  
  // Step 2: Design and implement
  // LLM uses str_replace, write_file to make changes
  // LLM uses spawn_agents with thinker-with-files-gemini for complex decomposition
  yield { toolName: 'think_deeply', input: { thought: `Design changes for: ${prompt}. Define types first, then interfaces, then implementations. Verify no circular imports.` } }
  
  // Step 3: Verify
  yield { toolName: 'run_terminal_command', input: { command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30' } }
}
```
**toolNames (updated)**: Same as current minus duplicate `'find_files'`. MUST include `end_turn`.
**Verification**: Re-read file. Check: (a) no duplicate toolNames, (b) `end_turn` present, (c) handleSteps does not reference module-level ARCH_SYSTEM or instructionsPrompt.

#### 2.3 metabuff-security — Pattern A
**File**: `metabuff-security.ts`
**What to add**: Same Pattern A structure as metabuff-arch, with security-specific yield phases:
1. Audit phase: `code_search` for SECURITY_RED_FLAGS patterns
2. Fix phase: `str_replace` to patch vulnerabilities
3. Verify phase: re-run audit scans, run tests
**toolNames (updated)**: Same as current minus duplicate `'find_files'`. MUST include `end_turn`.
**Verification**: Same checks as metabuff-arch.

#### 2.4 metabuff-testgen — Pattern A
**File**: `metabuff-testgen.ts`
**What to add**: Same Pattern A with test-generation phases:
1. Discover: find existing test patterns via `find_files` and `read_files`
2. Write: create test files via `write_file` following discovered patterns
3. Run: execute tests via `run_terminal_command`
4. Fix: if tests fail, use `str_replace` to correct
**toolNames (updated)**: Same as current minus duplicate `'find_files'`. MUST include `end_turn`.
**Verification**: Same checks.

#### 2.5 metabuff-validator — Pattern B (Audit Generator)
**File**: `metabuff-validator.ts`
**What to add**: A handleSteps generator that runs the 10-step Superpowers audit checklist as yield phases.
**Structure**:
```typescript
handleSteps: function* ({ prompt }) {
  // Phase 1: Get the diff
  const { toolResult: gitDiff } = (yield { toolName: 'run_terminal_command', input: { command: 'git diff HEAD' } }) as { toolResult: string }
  
  // Phase 2: Read changed files
  // LLM reads every changed file via read_files
  yield { toolName: 'think_deeply', input: { thought: `Validate all changes for: ${prompt}. Git diff: ${gitDiff?.slice(0, 500) ?? 'no diff'}. Read every changed file before conducting audits.` } }
  
  // Phase 3: Ghost import check
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 1/10: Check every import in changed files — verify each imported symbol exists via code_search.` } }
  
  // Phase 4: Phantom edit check
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 2/10: Re-read changed files to confirm all edits landed correctly. No str_replace that claimed success but left file unchanged.` } }
  
  // Phase 5: TODO/FIXME scan
  yield { toolName: 'code_search', input: { searchQueries: [{ pattern: 'TODO|FIXME|HACK|placeholder', flags: '-g *.ts -g *.tsx' }] } }
  
  // Phase 6: Regex safety check
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 4/10: Scan changed files for regex literals. If found, flag for regex-guard.` } }
  
  // Phase 7: Consistency check
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 5/10: Verify function signatures match callers. No caller/callee mismatches.` } }
  
  // Phase 8: TDD Iron Law check
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 6/10: Do new behaviors have tests? Would tests FAIL without the implementation?` } }
  
  // Phase 9: Full test suite
  yield { toolName: 'run_terminal_command', input: { command: '(bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -30' } }
  
  // Phase 10: Full typecheck + finishing workflow
  yield { toolName: 'run_terminal_command', input: { command: '(bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | tail -10' } }
  yield { toolName: 'think_deeply', input: { thought: `AUDIT 10/10: Finishing workflow. Count remaining TODOs. Detect workspace type. Choose completion: ✅ MERGE READY / ⚠ NEEDS REVIEW / ⏳ WIP / ❌ DISCARD.` } }
}
```
**toolNames (updated)**: Same as current. MUST include `end_turn`.
**Verification**: Same checks as metabuff-reasoner. Verify all 10 audit phases are present.
**Anti-hallucination reminder**: The git diff capture uses `const { toolResult: gitDiff } = (yield {...}) as { toolResult: string }` — the correct destructured pattern, NOT the broken `const x = yield {...}` pattern.

#### 2.6 metabuff-regex-guard — Pattern A
**File**: `metabuff-regex-guard.ts`
**What to add**: A handleSteps that runs the 4-phase regex scan via `run_terminal_command`, collects errors, and fixes them.
**Structure**:
```typescript
handleSteps: function* ({ prompt }) {
  // Phase 1: Run the regex scan
  const REGEX_SCAN = `...`  // Inline the REGEX_SCAN_COMMAND
  const { toolResult: scanOutput } = (yield { toolName: 'run_terminal_command', input: { command: REGEX_SCAN } }) as { toolResult: string }
  
  // Phase 2: Triage findings — fix INVALID regex, investigate ReDoS, verify escapes
  yield { toolName: 'think_deeply', input: { thought: `Regex guard scan results: ${scanOutput?.slice(0, 1000) ?? 'no output'}. Fix all ❌ INVALID patterns. Document all ⚠️ ReDoS patterns. Verify escape sequences.` } }
  
  // Phase 3: Re-scan after fixes to confirm clean
  yield { toolName: 'run_terminal_command', input: { command: REGEX_SCAN } }
}
```
**Verification**: Re-read file. Verify REGEX_SCAN is INLINED in handleSteps (not referenced from module scope). Verify `end_turn` in toolNames.
**Anti-hallucination**: The REGEX_SCAN_COMMAND must be copied into the handleSteps closure — do NOT reference the module-level constant. This is critical because the agent framework loses module-level references.

### Phase 3: Add handleSteps to ECC Agents (P2)

> **⚠ DeepSeek V4 Pro Guardrails for Phase 3:**
> - 63 agents use the SAME template — high risk of copy-paste hallucination
> - Create ONE template, apply via surgical edits — never re-type the template
> - Verify the first 3 agents before processing the remaining 60
> - Every agent MUST have `end_turn` in toolNames after the edit
> - Never reference module-level variables from inside handleSteps

#### 3.1 Create Shared handleSteps Template
**New file**: `.agents/handle-steps-template.ts`
**Content**: A function that takes an agent's systemPrompt and instructionsPrompt and returns a handleSteps generator. The generator must NOT reference the passed-in prompts by closure — it must inline them.

```typescript
import { AgentDefinition } from './types/agent-definition'

/**
 * Creates a minimal handleSteps generator for a prompt-based agent.
 * The generated function inlines the prompts — never references module scope.
 * 
 * @param systemPrompt  The agent's system prompt (inlined into the generator)
 * @param instructionsPrompt  The agent's instructions (inlined into the generator)
 * @param agentTools  The agent's toolNames array (for verification only)
 */
export function createHandleSteps(
  systemPrompt: string,
  instructionsPrompt: string,
  agentTools: string[],
): AgentDefinition['handleSteps'] {
  // The systemPrompt and instructionsPrompt are captured by closure here.
  // This is SAFE because they're passed as parameters to createHandleSteps,
  // which is called at DEFINITION time (not inside handleSteps).
  // The handleSteps generator itself references these closure-captured values.
  
  return function* ({ prompt }: { prompt: string }) {
    // Step 1: Orient with the agent's specific system prompt and instructions
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `You are operating under the following system prompt:\n\n${systemPrompt}\n\n` +
          `Your instructions:\n\n${instructionsPrompt}\n\n` +
          `Task to complete: ${prompt}\n\n` +
          `Plan your work: identify which files to read, what changes to make, and how to verify. ` +
          `NEVER return an error, refusal, or "VAGUE_PROMPT". Always produce actionable output.`
      }
    }

    // Step 2: Execute — the LLM uses its tools (read_files, code_search, str_replace, etc.)
    // to carry out the work based on the agent's prompts

    // Step 3: Verify
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30'
      }
    }
  }
}
```
**Verification**: Read the file back. Verify: (a) handleSteps generator does not reference any module-level variables outside its closure, (b) the return type is `AgentDefinition['handleSteps']`.

#### 3.2 Apply Template to ECC Agents — Batch Process
**Files**: All 63 `ecc-*.ts` files
**Process** (do NOT bulk-sed — apply individually with verification):
1. Read each ecc agent file
2. Add: `import { createHandleSteps } from './handle-steps-template'` at the top
3. Add to the definition object: `handleSteps: createHandleSteps(systemPrompt, instructionsPrompt, toolNames)` (use the actual variable names from that agent)
4. Verify `end_turn` is in toolNames — if not, add it
5. Verify no duplicates in toolNames — if found, deduplicate
6. Re-read the file and confirm the edit
7. Typecheck: `npx tsc --noEmit .agents/ecc-<name>.ts 2>&1 | head -5`

**Batch strategy**: Process 3 agents first. Verify all 3 spawn correctly. Then process the remaining 60 in batches of 5 with verification between batches.

**Verification gate per batch**: After each batch, run `npx tsc --noEmit` on all changed files. All must pass.

#### 3.3 Update ecc-index.ts
**File**: `ecc-index.ts`
**Action**: Add export for `createHandleSteps` if the index is used for agent registration. May not need changes if the index just re-exports agent definitions.
**Verification**: Read the file, determine if changes are needed based on actual content.

### Phase 4: Wire Model Auto-Detection (P2)

> **⚠ DeepSeek V4 Pro Guardrails for Phase 4:**
> - The `model` field in AgentDefinition is evaluated at import time, not runtime
> - `resolveModel()` is called at module level — it runs ONCE when the file is loaded
> - Every agent file must import from `./model-config` with the correct relative path
> - Test with at least one model switch before proceeding to Phase 5

#### 4.1 Update Agent model Fields
**Files**: All agents that now have handleSteps (`metabuff-reasoner.ts`, `metabuff-arch.ts`, `metabuff-security.ts`, `metabuff-testgen.ts`, `metabuff-validator.ts`, `metabuff-regex-guard.ts`, `thinker-with-files-gemini.ts`, all 63 `ecc-*.ts`)
**Action**: Replace hardcoded `model: 'deepseek/deepseek-v4-pro'` with `model: resolveModel()`. Add `import { resolveModel } from './model-config'` to each file.
**Verification**: After each edit, re-read the file. Confirm the import line and model field. Confirm `resolveModel()` is called (with parentheses).
**Anti-hallucination**: The function is called `resolveModel` (camelCase), NOT `resolve_model` or `getModel`. It's imported from `'./model-config'` (with dot-slash).

#### 4.2 Update Working Agent model Fields
**Files**: `metabuff.ts`, `metabuff-mega.ts`
**Action**: Replace `model: 'deepseek/deepseek-v4-pro'` with `model: resolveModel()` in both orchestrators. Add imports.
**Verification**: Re-read both files to confirm.

#### 4.3 Model Switch Test
**Test 1 — Env var**: `METABUFF_MODEL=moonshot/mimo-2.5-pro` — verify agents use MiMo
**Test 2 — Config file**: Set `.agents/model-config.json` to `moonshot/kimi-k2.6` — verify agents use Kimi
**Test 3 — Default**: Remove env var and config — verify agents fall back to `deepseek/deepseek-v4-pro`
**Verification**: Add a temporary `console.log(resolveModel())` in model-config.ts to confirm resolution order.

### Phase 5: Cleanup & Verification (P3)

> **⚠ DeepSeek V4 Pro Guardrails for Phase 5:**
> - Deletion is irreversible — verify the file is truly unused before removing
> - Use `code_search` to find ALL references before deleting any file
> - Documentation updates must reference ACTUAL code, not aspirational code

#### 5.1 Final researcher-web and researcher-docs Removal
- Read `.agents/researcher-web.ts` and `.agents/researcher-docs.ts` one final time to confirm contents
- Run `code_search` for 'researcher-web' and 'researcher-docs' across ALL `.agents/*.ts` files
- If results exist ONLY in `metabuff.ts` and `metabuff-mega.ts` spawnableAgents → safe to delete
- Delete files: `rm .agents/researcher-web.ts .agents/researcher-docs.ts`
- Remove spawnableAgents entries from `metabuff.ts` and `metabuff-mega.ts`
- Remove from this spec's canonical agent types list if present

#### 5.2 Update Documentation
**Files**: `knowledge.md`, `known-issues.md`, `README.md`
**knowledge.md updates**:
- Add MiMo/Kimi to model list in the "Available LLM models" section
- Update agent architecture diagram if agent count changed
- Document the `handleSteps` requirement for custom agents in free tier

**known-issues.md updates**:
- Append: `[2026-06-10] DESIGN_ISSUE: All 68+ custom agents without handleSteps failed with free_mode_invalid_agent_model. Freebuff free tier requires handleSteps for custom agents — prompt-only agents are rejected. Fixed: added handleSteps wrappers to all agents.`
- Append: `[2026-06-10] HALLUCINATION: Duplicate 'find_files' found in toolNames of metabuff-arch, metabuff-security, metabuff-testgen. Fixed: removed duplicates.`
- Append: `[2026-06-10] HALLUCINATION: Duplicate 'ecc-code-architect' in metabuff-mega spawnableAgents. Fixed: removed duplicate.`
- Append: `[2026-06-10] QUAL: Added MiMo 2.5 Pro and Kimi K2.6 model support via model-config.ts with env var → config file → default resolution order.`

**README.md updates**:
- Update agent status table: mark all agents as having handleSteps ✅
- Add model auto-detection documentation
- Note removal of researcher-web and researcher-docs

#### 5.3 Full Project Typecheck
**Command**: `npx tsc --noEmit` across the entire `.agents/` directory
**Gate**: ALL type errors must be resolved before considering the implementation complete.
**If errors**: Fix them one at a time, re-typechecking after each fix. Never batch-fix type errors.

#### 5.4 Spawn Verification (Manual)
For each agent type, attempt to spawn it:
- `@metabuff-reasoner` — should follow Socratic protocol
- `@metabuff-arch` — should analyze architecture
- `@metabuff-security` — should run security audit
- `@metabuff-testgen` — should generate tests
- `@metabuff-validator` — should run validation
- `@metabuff-regex-guard` — should run regex scan
- `@thinker-with-files-gemini` — should decompose tasks
- A sample of 5-10 `@ecc-*` agents — should execute

**Pass condition**: Zero `free_mode_invalid_agent_model` errors. Agents may produce errors for other reasons (missing context, etc.) but must NOT produce free mode errors.

---

## Files Changed

### New Files
- `.agents/model-config.ts` — Shared model resolver
- `.agents/model-config.json` — User-editable model selection
- `.agents/handle-steps-template.ts` — Shared handleSteps template for ecc agents

### Modified Files (handleSteps added)
- `metabuff-reasoner.ts` — Pattern B handleSteps (Socratic generator)
- `metabuff-arch.ts` — Pattern A handleSteps + fix duplicate toolNames
- `metabuff-security.ts` — Pattern A handleSteps + fix duplicate toolNames
- `metabuff-testgen.ts` — Pattern A handleSteps + fix duplicate toolNames
- `metabuff-validator.ts` — Pattern B handleSteps (audit generator)
- `metabuff-regex-guard.ts` — Pattern A handleSteps
- `thinker-with-files-gemini.ts` — Fix model + Pattern A handleSteps
- `metabuff-mega.ts` — Fix duplicate spawnableAgents, remove researcher refs

### Modified Files (reference updates)
- `metabuff.ts` — Remove researcher-web/docs from spawnableAgents, wire model-config
- All 63 `ecc-*.ts` — Add handleSteps via shared template
- `ecc-index.ts` — Update for template import

### Deleted Files
- `researcher-web.ts` — Removed (gemini model, not used)
- `researcher-docs.ts` — Removed (gemini model, not used)

### Documentation
- `knowledge.md` — Update model section, agent architecture
- `known-issues.md` — Record handleSteps gate discovery
- `README.md` — Update agent status table

---

## handleSteps Wrapper Design

### Pattern A: Minimal Shim (for prompt-based agents)

```typescript
handleSteps: function* ({ prompt }) {
  // Step 1: Orient — understand the task
  yield {
    toolName: 'think_deeply',
    input: {
      thought: `Read my system prompt and instructions. Then analyze this task: ${prompt}. 
      Plan what files to read, what changes to make, and how to verify them.`
    }
  }
  
  // Step 2: Ground — read relevant files
  // (The LLM will use read_files, code_search, find_files based on the plan)
  
  // Step 3: Execute — make changes
  // (The LLM will use str_replace, write_file, run_terminal_command)
  
  // Step 4: Verify — run typecheck and tests
  yield {
    toolName: 'run_terminal_command',
    input: {
      command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -40'
    }
  }
  
  // The framework continues calling the generator until end_turn
}
```

### Pattern B: Explicit Generator (for multi-phase agents)

```typescript
handleSteps: function* ({ prompt }) {
  // Phase 1: [Specific phase name]
  yield { toolName: 'think_deeply', input: { thought: 'Phase 1 reasoning...' } }
  
  // Phase 2: [Specific phase name]
  yield { toolName: 'spawn_agents', input: { agents: [...] } }
  
  // Phase 3: Verify
  yield { toolName: 'run_terminal_command', input: { command: '...' } }
  
  // Continue phases as needed
}
```

---

## Acceptance Criteria

1. ✅ `metabuff` simple pipeline spawns `ecc-code-architect` without `free_mode_invalid_agent_model`
2. ✅ `metabuff` complex pipeline spawns all domain agents successfully
3. ✅ `metabuff-mega` cascade pipeline spawns all specialist types (arch, security, testgen, reason, base, custom)
4. ✅ `metabuff-reasoner` spawns and follows 6-step Socratic protocol
5. ✅ `metabuff-validator` spawns and runs 10-step audit checklist
6. ✅ `metabuff-regex-guard` spawns and runs REGEX_SCAN_COMMAND
7. ✅ `thinker-with-files-gemini` spawns with deepseek-v4-pro model
8. ✅ All 63 ecc agents spawn successfully
9. ✅ Model auto-detection works: env var → config file → default
10. ✅ No duplicate toolNames or spawnableAgents in any agent file
11. ✅ `researcher-web` and `researcher-docs` are fully removed
12. ✅ All typechecks pass (`npx tsc --noEmit` on .agents/)
13. ✅ Documentation updated (knowledge.md, known-issues.md, README.md)
14. ✅ Zero `free_mode_invalid_agent_model` errors across all spawn verification tests
15. ✅ Every agent has `end_turn` in toolNames — verified by code_search scan
16. ✅ Every handleSteps uses `const { toolResult } = yield {...}` pattern, never `const x = yield {...}`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| handleSteps wrapper is too minimal — agent doesn't actually do work | Start with Pattern A, test each agent, upgrade to Pattern B for core agents |
| DeepSeek V4 Pro hallucinates tool names not in canonical list | Every spec step includes the canonical tool names as a reference; verify after every edit |
| Adding handleSteps to 63 ecc agents is tedious and error-prone | Use the shared `createHandleSteps` template; batch process with verification gates between batches |
| Model auto-detection at definition time may not work if `require()` is sandboxed | Test with different scenarios; fall back to hardcoded default |
| Some ecc agents may not need handleSteps if never spawned | Audit pipeline references first; skip unused agents |
| Module-level constants referenced from inside handleSteps will be silently lost | Every handleSteps MUST inline its constants; verify by code review after creation |
| Duplicate array entries (toolNames, spawnableAgents) cause validation errors | Explicit duplicate check step in every phase; use `code_search` to scan for patterns like `'find_files'.*'find_files'` |
| `end_turn` missing from toolNames causes agent hang | Mandatory verification in every Phase; final code_search scan across all files |
| Wrong yield capture pattern breaks generator state | Only the destructured `{ toolResult }` pattern is used; verified by code review |
