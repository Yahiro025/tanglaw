# handleSteps Rewrite Spec — Make ECC & MetaBuff Agents Actually Work
## Tailored for DeepSeek V4 Pro (1.6T MoE, 49B active)

**Status**: Spec (no code changes yet)
**Created**: 2026-06-10
**Updated**: 2026-06-10 (tailored for DeepSeek V4 Pro strengths)

---

## 0. Model Capability Profile (DeepSeek V4 Pro)

### Strengths to Exploit

| Capability | How the Spec Leverages It |
|-----------|--------------------------|
| **Agent orchestration** (dedicated optimizations) | Multi-phase decomposition workflow with explicit sub-task boundaries |
| **Precision tool calling** | Every yield specifies exact tool schemas with typed inputs — no ambiguous think_deeply as a work-doer |
| **"Engram" conditional memory** | Spec includes a context preloading block at Phase 0 so the model has all instructionsPrompt content available at once before tool execution |
| **Complex multi-step reasoning** | Each phase has explicit success/failure gates with next-step branching logic |
| **Structured data analysis** | Tool-result captures use typed destructuring (`const { toolResult } = yield ... as { toolResult: string }`) matching known Freebuff resume pattern |
| **1.6T MoE with 49B active** | Deep enough to follow detailed prescriptive instructions without losing track across phases |

### Weaknesses to Guard Against

| Limitation | Mitigation in Spec |
|-----------|-------------------|
| **~8 months behind frontier benchmarks** | Verification gates after every phase; no "assume it worked" — explicitly check tool results |
| **Hallucination on unseen APIs** | Every tool name and input schema is explicitly provided in the spec; no room for invention |
| **Fatigue on very long generators** | Phases are capped at 8 yields max; if more work is needed, delegate via spawn_agents |
| **Confusion between agent roles** | Each Phase's think_deeply explicitly references the agent's own systemPrompt/instructionsPrompt to maintain role fidelity |

---

## 1. Problem Statement

All 63+ ECC agents use `createHandleSteps()` from `handle-steps-template.ts`. This function returns a generator that yields exactly 2 tool calls:

```typescript
// Current behavior (handle-steps-template.ts, lines 18-37):
export function createHandleSteps(): AgentDefinition['handleSteps'] {
  return function* ({ prompt }: { prompt: string }) {
    yield {
      toolName: 'think_deeply',
      input: {
        thought:
          `Task to complete: ${prompt}\n\n` +
          `Read my systemPrompt and instructionsPrompt to understand my role and methodology. ` +
          `Plan what files to read, what changes to make, and how to verify them. ` +
          `Then execute the plan using read_files, code_search, str_replace, write_file, and run_terminal_command. ` +
          `NEVER return an error, refusal, or "VAGUE_PROMPT". Always produce actionable output. ` +
          `Call end_turn only when the work is complete and verified.`,
      },
    }
    // ⚠ PROBLEM: This tells the agent to "execute the plan using read_files..."
    // but the GENERATOR never yields read_files tool calls.
    // think_deeply is a thinking tool — it does NOT trigger file reads.
    // The agent thinks about reading files, then the generator...
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30',
      },
    }
    // ...yields a typecheck, then the generator returns undefined.
    // Freebuff sees the generator is exhausted and calls end_turn.
    // The agent NEVER read a single file. NEVER made a single edit.
    // ⚠ END OF PROBLEM
  }
}
```

### Confirmed Observations (from user testing, 2026-06-10)

> "All three (ecc-performance-optimizer, ecc-code-explorer, ecc-typescript-reviewer) returned essentially the same output: they ran a hardcoded run_terminal_command for a typecheck and then finished."

> "The actual performance audit in my report came entirely from me reading 15+ files directly and analyzing them myself — not from the spawned agents."

### Root Cause

Freebuff's agent execution: when `handleSteps` is present, the generator **completely controls** the agent's tool-calling flow. The agent ONLY executes what the generator yields. It does not autonomously call `read_files`, `code_search`, or `str_replace` between yields.

The current `createHandleSteps()` yields `think_deeply` (a thought recorder, not an action tool) followed by `run_terminal_command` (typecheck). No `read_files`, `code_search`, `str_replace`, or `write_file` yields ever happen.

### Affected Agents (Complete Census)

| Category | Count | handleSteps Source | Current Yield Count | Status |
|----------|:-----:|--------------------|:-------------------:|--------|
| ECC agents (ecc-*) | 63 | `createHandleSteps()` from shared template | 2 (think + typecheck) | **Broken** |
| metabuff-arch | 1 | Inlined Pattern A | 3 (think→think→typecheck) | **Broken** |
| metabuff-security | 1 | Inlined Pattern A | 3 (think→think→typecheck) | **Broken** |
| metabuff-testgen | 1 | Inlined Pattern A | 3 (think→think→typecheck) | **Broken** |
| metabuff-regex-guard | 1 | Inlined Pattern A | 3 (think→think→typecheck) | **Broken** |
| thinker-with-files-gemini | 1 | Inlined Pattern A | 2 (think + typecheck) | **Likely broken** |
| metabuff-reasoner | 1 | Inlined Pattern B (6-step Socratic) | 7 (5×think + 2×cmd) | **Partially broken** |
| metabuff-validator | 1 | Inlined Pattern B (10-step audit) | 10 (3×think + 2×search + 5×cmd) | **Working** ✓ |
| metabuff (orchestrator) | 1 | Comprehensive inline generator | ~15 (spawns + cmds + thinks) | **Working** ✓ |
| metabuff-mega | 1 | Comprehensive inline generator | ~12 (spawns + cmds + thinks) | **Working** ✓ |
| code-reviewer-deepseek | 1 | Unknown (not yet read) | Unknown | **To verify** |

---

## 2. Desired Behavior

### 2.1 For ECC Agents (63 agents via shared template)

Given prompt `P`:

1. **Phase 0 — CONTEXT PRELOAD**: Agent internalizes its `systemPrompt` + `instructionsPrompt` (Engram-optimized: load once, reference across all phases)
2. **Phase 1 — ORIENT**: Agent analyzes `P`, identifies its domain (performance? security? review?), and maps it to its methodology from instructionsPrompt
3. **Phase 2 — DISCOVER**: Agent uses `code_search` with keyword patterns extracted from `P` to find relevant files in the codebase
4. **Phase 3 — READ**: Agent yields `read_files` for discovered files and captures their content
5. **Phase 4 — PLAN**: Agent formulates an explicit, verifiable action plan based on what it read
6. **Phase 5 — EXECUTE**: Agent yields `str_replace` / `write_file` to make changes
7. **Phase 6 — VERIFY**: Agent runs typecheck; if modified `.ts`/`.tsx` files exist, verifies no build errors
8. **Phase 7 — TERMINATE**: Generator returns → Freebuff calls `end_turn`

### 2.2 For Non-ECC Agents (with inlined handleSteps)

| Agent | Current Pattern | Required Insertion |
|-------|----------------|-------------------|
| metabuff-arch | think→think→typecheck | Insert `code_search` + `read_files` + `str_replace`/`write_file` between design and verify |
| metabuff-security | think→think→typecheck | Insert `code_search` + `read_files` + `str_replace` between audit and verify |
| metabuff-testgen | think→think→typecheck | Insert `code_search` + `read_files` + `write_file` for tests + `run_terminal_command` for test run between discover and verify |
| metabuff-regex-guard | think→think→typecheck | Insert `code_search` for regex patterns + `read_files` + `str_replace` for fixes + `run_terminal_command` for re-scan |
| thinker-with-files-gemini | think→typecheck | Verify; add explicit `think_deeply` with output requirement if needed |
| metabuff-reasoner | 5×think→2×cmd | Insert `code_search` + `read_files` after SELECT; insert `str_replace`/`write_file` after IMPLEMENT; keep PROVE phase |

### 2.3 No Changes Needed

- **metabuff.ts** — Orchestrator spawns agents and coordinates pipelines correctly
- **metabuff-mega.ts** — Cascade parallel spawning works (has spawn_agents and real tool yields)
- **metabuff-validator.ts** — Has real work yields (read_files, code_search, run_terminal_command)

---

## 3. Design: Concrete Implementation

### 3.1 Primary Fix: `handle-steps-template.ts` — New `createHandleSteps()`

This is the single change that fixes 63 agents. DeepSeek V4 Pro's Engram memory is leveraged by loading all context in Phase 0 and referencing it across all subsequent phases.

```typescript
/**
 * Shared handleSteps Template — 7-Phase Workflow (DeepSeek V4 Pro optimized)
 * ─────────────────────────────────────────────────────────────────────────
 * v2.0.0: Replaces the broken 2-yield shim with a full 7-phase workflow that
 *         actually discovers files, reads code, makes changes, and verifies output.
 *
 * Design decisions:
 *   • Phase 0 loads context once (Engram: near-instant retrieval for subsequent phases)
 *   • Each phase has an explicit verification gate — no "assume it worked"
 *   • Tool results are captured via typed destructuring matching Freebuff's resume pattern
 *   • Maximum 8 yields to prevent generator fatigue on DeepSeek V4 Pro
 *   • All tool names match Freebuff's current valid tool list exactly
 *
 * Freebuff resume pattern (confirmed via metabuff-mega.ts fix):
 *   const { toolResult } = (yield { ... }) as { toolResult: string; toolError?: string }
 */

import { AgentDefinition } from './types/agent-definition'

export function createHandleSteps(): AgentDefinition['handleSteps'] {
  return function* ({ prompt }: { prompt: string }) {

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 0 — CONTEXT PRELOAD (Engram-optimized)
    // ═══════════════════════════════════════════════════════════════════
    // DeepSeek V4 Pro's Engram conditional memory loads this context once
    // and makes it near-instant accessible in all subsequent phases.
    // This single think_deeply primes the model with ALL role knowledge.
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 0: CONTEXT PRELOAD ===`,
          ``,
          `AGENT ROLE & METHODOLOGY:`,
          `  Read your systemPrompt and instructionsPrompt NOW.`,
          `  You are NOT a generic coding assistant — you are a SPECIALIST.`,
          `  Your instructionsPrompt contains your specific methodology.`,
          `  Commit it to memory — you will apply it in all subsequent phases.`,
          ``,
          `TASK TO COMPLETE:`,
          `  ${prompt}`,
          ``,
          `WORKFLOW (7 phases, this is Phase 0):`,
          `  Phase 1 → ORIENT:  Map task to your methodology`,
          `  Phase 2 → DISCOVER: Find relevant files via code_search`,
          `  Phase 3 → READ:    Read discovered files`,
          `  Phase 4 → PLAN:    Formulate verifiable action plan`,
          `  Phase 5 → EXECUTE: Make changes via str_replace/write_file`,
          `  Phase 6 → VERIFY:  Run typecheck`,
          `  Phase 7 → TERMINATE (generator ends → end_turn)`,
          ``,
          `GROUND RULES:`,
          `  • You are in a handleSteps generator — you CANNOT autonomously call tools`,
          `  • You WILL receive tool calls from the generator at each phase`,
          `  • When you receive read_files, the files you need will be provided`,
          `  • When you receive str_replace, execute the edit you planned in Phase 4`,
          `  • NEVER return a VAGUE_PROMPT error — always produce actionable output`,
          `  • If no files are found, report what you would have done and why`,
          ``,
          `Ready. Proceeding to Phase 1.`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1 — ORIENT: Analyze prompt, map to methodology
    // ═══════════════════════════════════════════════════════════════════
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 1: ORIENT ===`,
          ``,
          `Task: ${prompt}`,
          ``,
          `1. CLASSIFY the task domain:`,
          `   • Is this a performance audit? Code review? Build fix? Architecture design?`,
          `   • Match against your instructionsPrompt methodology`,
          ``,
          `2. MAP to your methodology:`,
          `   • Your instructionsPrompt contains domain-specific workflows`,
          `   • Identify the EXACT checklist/steps from your instructionsPrompt that apply`,
          `   • Example: performance-optimizer → "Performance Review Workflow §1-7"`,
          ``,
          `3. IDENTIFY what files are likely relevant:`,
          `   • Extract keywords, component names, module names from the task`,
          `   • Note file extensions likely involved (.ts, .tsx, .js, etc.)`,
          ``,
          `4. OUTPUT your classification and planned methodology section.`,
          `   This will be used in Phase 2 to guide code_search queries.`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2 — DISCOVER: Find relevant files via code_search
    // ═══════════════════════════════════════════════════════════════════
    // DeepSeek V4 Pro precision tool calling: we provide the exact
    // code_search schema with keyword patterns derived from the task.
    // The prompt is tokenized into keywords (4+ chars, no stop words)
    // and searched across TypeScript/JavaScript source files.

    // Extract keyword patterns from prompt for code_search
    const promptKeywords = prompt
      .toLowerCase()
      .match(/[a-z]{4,}/g)
      ?.filter(w => !['this','that','with','from','have','will','your','into',
                       'when','them','they','what','file','code','make','want',
                       'need','just','like','some','more','then','also','than',
                       'even','only','over','back','here','there','their','been',
                       'were','does','dont','should','would','could','change',
                       'update','every','other','same','such','very','much','many'])
      ?.slice(0, 6) ?? ['typescript', 'component', 'module']

    // Build search queries: main keyword OR + filename-like patterns
    const searchPatterns = [
      // Search for the main keywords in TypeScript files
      { pattern: promptKeywords.join('|'), flags: '-g *.ts -g *.tsx -g *.js -g *.jsx', maxResults: 15 },
      // Search for component names (PascalCase) in the prompt
      { pattern: 'export (const|function|class|interface|type)', flags: '-g *.ts -g *.tsx', maxResults: 8 },
    ]

    yield {
      toolName: 'code_search',
      input: { searchQueries: searchPatterns },
    }

    // Capture code_search results to identify files for Phase 3
    // Freebuff resume pattern: generator resumes with { toolResult, toolError }
    // toolResult from code_search contains matched file paths and line contents

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3 — READ: Read discovered files
    // ═══════════════════════════════════════════════════════════════════
    // We cannot parse the code_search result inside the generator
    // (generator runs in Node.js but result parsing is fragile).
    // Instead: yield a second think_deeply that tells the agent to
    // identify files from the code_search output, followed by read_files
    // with the most likely relevant paths based on prompt keywords.

    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 3: READ ===`,
          ``,
          `The code_search results from Phase 2 show matching files.`,
          `Now you MUST read the most relevant files.`,
          ``,
          `Guidance from your instructionsPrompt methodology:`,
          `  • What files does your specialized workflow expect to examine?`,
          `  • Example: performance-optimizer → read components, package.json, tsconfig`,
          `  • Example: code-explorer → read entry points, routing files, API handlers`,
          ``,
          `After reading files via the next tool call, move to Phase 4 (PLAN).`,
        ].join('\n'),
      },
    }

    // Read files most likely relevant based on prompt keywords
    // We construct file path patterns from the prompt if possible
    const filePatterns = prompt.match(/[\w.\/-]+\.(ts|tsx|js|jsx)/g) ?? []
    const filesToRead = filePatterns.length > 0
      ? filePatterns.slice(0, 6)
      : [
          // Default: read key config and entry files
          'package.json',
          'tsconfig.json',
          'frontend/src/app/page.tsx',
          'frontend/src/app/layout.tsx',
        ]

    // Also extract PascalCase component names from prompt as potential file paths
    const componentNames = prompt.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? []
    const componentFiles = componentNames
      .map(c => {
        const kebab = c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        return `frontend/src/components/${kebab}.tsx`
      })
      .slice(0, 3)

    const allFilesToRead = [...new Set([...filesToRead, ...componentFiles])].slice(0, 8)

    yield {
      toolName: 'read_files',
      input: { paths: allFilesToRead },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 4 — PLAN: Formulate verifiable action plan
    // ═══════════════════════════════════════════════════════════════════
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 4: PLAN ===`,
          ``,
          `You have now read the relevant files from Phase 3.`,
          ``,
          `Based on:`,
          `  1. Your instructionsPrompt methodology`,
          `  2. The specific task: ${prompt}`,
          `  3. The code you just read`,
          ``,
          `Create an ACTION PLAN with these requirements:`,
          ``,
          `FORMAT (use exactly):`,
          `  FILE: <path>`,
          `  ACTION: <str_replace | write_file | no_change>`,
          `  CHANGE: <specific description of what to change>`,
          `  REASON: <why this change is needed>`,
          ``,
          `CONSTRAINTS:`,
          `  • Minimum changes possible (surgical str_replace preferred)`,
          `  • Each change must be independently verifiable`,
          `  • No scope creep — only what the task asks for`,
          `  • If no changes needed (analysis-only task), state your findings`,
          ``,
          `Proceed to Phase 5 (EXECUTE) once your plan is formulated.`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 5 — EXECUTE: Apply changes via str_replace / write_file
    // ═══════════════════════════════════════════════════════════════════
    // DeepSeek V4 Pro precision tool calling: we yield the str_replace
    // and write_file tools explicitly. The agent uses the plan from
    // Phase 4 to determine what to change at each yield.
    //
    // Note: Since the generator cannot dynamically create str_replace
    // operations based on the plan (the plan is in the agent's thought
    // stream, not in generator-scope variables), we yield a sequence
    // of tool calls that the agent populates with plan-specific data.

    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 5: EXECUTE ===`,
          ``,
          `Execute your plan from Phase 4 NOW.`,
          `You will receive str_replace and write_file tool calls.`,
          ``,
          `RULES:`,
          `  • Use str_replace with oldString/newString pairs for existing files`,
          `  • Use write_file only for NEW files`,
          `  • Match exact whitespace and indentation of the target file`,
          `  • Each change should be minimal and independently verifiable`,
          `  • If the task is analysis-only (no code changes), skip to Phase 6`,
          ``,
          `After making changes, proceed to Phase 6 (VERIFY).`,
        ].join('\n'),
      },
    }

    // Yield str_replace as an available tool — the agent fills in details
    // based on its plan from Phase 4
    // Note: In practice, the agent uses the str_replace tool call to apply
    // edits discovered during Phase 3's file reading and planned in Phase 4.
    yield {
      toolName: 'str_replace',
      input: {
        path: 'PLACEHOLDER_WILL_BE_FILLED_BY_AGENT',
        replacements: [
          {
            oldString: 'PLACEHOLDER',
            newString: 'PLACEHOLDER',
          },
        ],
      },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 6 — VERIFY: Run typecheck
    // ═══════════════════════════════════════════════════════════════════
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: [
          'echo "=== TYPE CHECK ==="',
          '&&',
          '(bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1)',
          '| head -30',
        ].join(' '),
      },
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 7 — Generator ends. Freebuff calls end_turn automatically.
    // ═══════════════════════════════════════════════════════════════════
    // No explicit end_turn yield — the generator returning undefined
    // signals Freebuff to terminate the agent.
  }
}
```

### 3.2 Secondary Fix: `metabuff-reasoner.ts` — Add Real Work Phases

The reasoner's current 6-step Socratic protocol is all `think_deeply` + test commands. It never reads files or makes edits. Insertion points:

```typescript
// Current reasoner handleSteps (metabuff-reasoner.ts, lines 138-161):
handleSteps: function* ({ prompt }) {
  // Phase 1-4: think_deeply (UNDERSTAND → CHALLENGE → EXPLORE → SELECT)
  yield { toolName: 'think_deeply', input: { thought: `STEP 1 UNDERSTAND: ${prompt}...` } }
  yield { toolName: 'think_deeply', input: { thought: `STEP 2 CHALLENGE: ...` } }
  yield { toolName: 'think_deeply', input: { thought: `STEP 3 EXPLORE: ...` } }
  yield { toolName: 'think_deeply', input: { thought: `STEP 4 SELECT: ...` } }

  // ═══ INSERT HERE ═══
  // GAP: No code_search, read_files, or str_replace yields.
  // The reasoner SELECTs a solution but never reads the codebase
  // or implements the solution. STEP 5 (IMPLEMENT) is just another
  // think_deeply — it never touches files.
  // ═══════════════════

  // INSERT → Phase 4.5: DISCOVER+READ
  //   yield code_search for relevant patterns
  //   yield read_files for discovered files

  // Then continue:
  yield { toolName: 'think_deeply', input: { thought: `STEP 5 IMPLEMENT: ...` } }

  // ═══ INSERT HERE ═══
  // INSERT → Phase 5.5: EXECUTE
  //   yield str_replace / write_file for the chosen implementation
  // ═══════════════════

  // Then continue:
  yield { toolName: 'run_terminal_command', input: { command: '(bun test ...)' } }
  yield { toolName: 'run_terminal_command', input: { command: '(bun run typecheck ...)' } }
},
```

**Exact insertion plan for reasoner:**

1. **After Phase 4 (SELECT) yield, insert:**
   ```typescript
   // Phase 4.5: GROUND — discover and read files
   yield {
     toolName: 'code_search',
     input: {
       searchQueries: [
         { pattern: prompt.match(/\b[A-Z][a-zA-Z]+\b/g)?.join('|') ?? 'function', flags: '-g *.ts', maxResults: 10 },
       ],
     },
   }
   // Extract file paths from code_search results (best-effort via think_deeply guidance)
   yield {
     toolName: 'think_deeply',
     input: {
       thought: [
         `GROUNDING: From the code_search results, identify the files you need to read `,
         `to implement the solution you selected in Phase 4. `,
         `Then read those files.`,
       ].join(''),
     },
   }
   ```

2. **After Phase 5 (IMPLEMENT) think_deeply, insert:**
   ```typescript
   // Phase 5.5: EXECUTE — apply the implementation
   // Multiple str_replace yields for surgical edits
   yield {
     toolName: 'str_replace',
     input: {
       path: 'WILL_BE_POPULATED_BY_AGENT',
       replacements: [{ oldString: 'PLACEHOLDER', newString: 'PLACEHOLDER' }],
     },
   }
   ```

### 3.3 Secondary Fix: `metabuff-arch.ts` — Insert File-Reading + Implementation

Current inlined pattern (lines 65-69):
```typescript
handleSteps: function* ({ prompt }) {
    yield { toolName: 'think_deeply', input: { thought: `Architecture task: ${prompt}. Read the existing architecture first...` } }
    yield { toolName: 'think_deeply', input: { thought: `Design changes for: ${prompt}. Define types first...` } }
    yield { toolName: 'run_terminal_command', input: { command: 'echo "=== TYPE CHECK ===" && ...' } }
},
```

**Fix:** Insert `code_search` + `read_files` between first and second think_deeply. Insert `str_replace`/`write_file` between second think_deeply and typecheck.

```typescript
handleSteps: function* ({ prompt }) {
    // Orient: analyze task
    yield { toolName: 'think_deeply', input: { thought: `Architecture task: ${prompt}. Read the existing architecture first — find schema files, API routes, component structure, type definitions. Identify what exists before proposing changes. NEVER write code before understanding the codebase.` } }

    // ═══ NEW: Discover relevant architecture files ═══
    yield {
      toolName: 'code_search',
      input: {
        searchQueries: [
          { pattern: 'interface|type|Schema|export', flags: '-g *.ts', maxResults: 10 },
          { pattern: prompt.match(/\b[A-Z][a-zA-Z]+\b/g)?.join('|') ?? 'arch', flags: '-g *.ts -g *.tsx', maxResults: 8 },
        ],
      },
    }
    // ═══════════════════════════════════════════════

    // Design: formulate changes
    yield { toolName: 'think_deeply', input: { thought: `Design changes for: ${prompt}. Define types first, then interfaces, then implementations. Verify no circular imports. Use code_search to verify every import exists.` } }

    // ═══ NEW: Execute architectural changes ═══
    yield {
      toolName: 'str_replace',
      input: { path: 'WILL_BE_POPULATED', replacements: [{ oldString: 'PLACEHOLDER', newString: 'PLACEHOLDER' }] },
    }
    // ═══════════════════════════════════════

    // Verify
    yield { toolName: 'run_terminal_command', input: { command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30' } }
  },
```

### 3.4 Secondary Fix Pattern for metabuff-security, metabuff-testgen, metabuff-regex-guard

Same insertion pattern as metabuff-arch above:
- **Between ORIENT and PLAN**: Insert `code_search` + `read_files`
- **Between PLAN and VERIFY**: Insert `str_replace` / `write_file` / `run_terminal_command` (for test runs)

Each agent's specific tool calls should match its domain:
- **metabuff-security**: `code_search` for `password|apiKey|secret|token|auth` → `read_files` → `str_replace` for fixes
- **metabuff-testgen**: `code_search` for `export function|export class` → `read_files` → `write_file` for test files → `run_terminal_command` for test run
- **metabuff-regex-guard**: `code_search` for `/.*\/[gimsu]*|new RegExp` → `read_files` → `str_replace` for fixes → `run_terminal_command` for re-scan

---

## 4. Files to Modify (Complete List)

### Primary (fixes 63 agents at once)

| # | File | Change | Estimated Lines |
|---|------|--------|:---:|
| 1 | `.agents/handle-steps-template.ts` | Replace `createHandleSteps()` with 7-phase workflow from §3.1 | ~120 lines rewritten |

### Secondary (fix 6 agents with inlined handleSteps)

| # | File | Change | Insertion Points |
|---|------|--------|-----------------|
| 2 | `.agents/metabuff-reasoner.ts` | Insert `code_search` + `read_files` after SELECT; insert `str_replace` after IMPLEMENT | 2 insertion points |
| 3 | `.agents/metabuff-arch.ts` | Insert `code_search` + `read_files` between think phases; insert `str_replace` before typecheck | 2 insertion points |
| 4 | `.agents/metabuff-security.ts` | Insert `code_search` + `read_files` + `str_replace` between audit and verify | 1 insertion point |
| 5 | `.agents/metabuff-testgen.ts` | Insert `code_search` + `read_files` + `write_file` for tests + `run_terminal_command` for test run | 2 insertion points |
| 6 | `.agents/metabuff-regex-guard.ts` | Insert `code_search` + `read_files` + `str_replace` + `run_terminal_command` for re-scan | 2 insertion points |
| 7 | `.agents/thinker-with-files-gemini.ts` | Verify; fix if broken (may already work since it receives `filePaths` via params) | TBD after verification |

### Tertiary (verification only — read, don't change unless broken)

| # | File | Action |
|---|------|--------|
| 8 | `.agents/code-reviewer-deepseek.ts` | Read and verify handleSteps has real work yields |
| 9 | `.agents/metabuff-validator.ts` | Confirm working (already verified in census) |

### No Changes

| File | Reason |
|------|--------|
| `.agents/metabuff.ts` | Orchestrator works correctly |
| `.agents/metabuff-mega.ts` | Cascade spawning works correctly |
| All 63 `ecc-*.ts` files | Fixed automatically via `handle-steps-template.ts` change |

---

## 5. Constraints & Edge Cases

### 5.1 Hard Constraints

| # | Constraint | Enforcement |
|---|-----------|------------|
| C1 | **Must pass Freebuff free mode check** — handleSteps must exist on all custom agents | handleSteps is preserved; only the body changes |
| C2 | **Generic enough for 63 diverse agents** | 7-phase workflow uses agent's own instructionsPrompt for domain-specific methodology — generic framework, specialized execution |
| C3 | **Must not break working agents** | metabuff, metabuff-mega, metabuff-validator are NOT modified |
| C4 | **npm is the package manager** | Commands use `npx tsc --noEmit` not `bun` |
| C5 | **Maximum 8 yield points** | DeepSeek V4 Pro generator fatigue guard — 7 phases + 1 optional str_replace = 8 max |
| C6 | **Tool names must match Freebuff valid list** | All tool names verified against known valid set: `read_files`, `code_search`, `str_replace`, `write_file`, `run_terminal_command`, `think_deeply`, `find_files`, `spawn_agents`, `end_turn` |

### 5.2 Edge Cases

| Scenario | Phase Affected | Handling |
|----------|:---:|-----------|
| **Agent has empty instructionsPrompt** | Phase 0 | Fall back to systemPrompt only. Agent classifies itself by its agent ID (e.g., "ecc-performance-optimizer" → performance domain) |
| **Analysis-only agent (no code changes)** | Phase 5 | Phase 4 should produce a findings report, not a code-change plan. Skip str_replace/write_file yields. Still run typecheck for completeness. |
| **No files match code_search** | Phase 2 | Yield `find_files` with broader pattern. If still nothing: produce "no relevant files found" analysis. Don't silently succeed. |
| **Typecheck fails** | Phase 6 | Report failure status. Add `think_deeply` to diagnose. If type error is from pre-existing code, flag [EXISTING]. If from new changes, add fix loop (max 2 iterations). |
| **Prompt is very short/vague (< 10 words)** | Phase 1 | Expand via think_deeply before code_search. Extract what keywords exist. If truly unactionable, request clarification rather than hallucinating. |
| **Prompt contains explicit file paths** | Phase 2 | Skip code_search — go directly to read_files with the specified paths |
| **Agent has spawnableAgents declared** | Phase 5 | Notify agent via Phase 5 think_deeply that it CAN spawn sub-agents if its methodology requires delegation |
| **str_replace path is placeholder** | Phase 5 | Agent must replace PLACEHOLDER with actual file path based on its Phase 4 plan. If it cannot determine the path, skip the str_replace yield. |

---

## 6. Verification Protocol

### 6.1 Per-Phase Verification Gates

Each phase has an explicit success gate. The agent checks the gate before proceeding:

| Phase | Gate | Failure Response |
|-------|------|-----------------|
| 0 | Agent can recite its instructionsPrompt methodology | Re-read instructionsPrompt |
| 1 | Agent has classified the task domain and identified methodology section | Expand via second think_deeply |
| 2 | At least 1 file found via code_search | Fall back to `find_files`; if still empty, produce analysis-only output |
| 3 | At least 1 file successfully read | Expand file list and retry; if all fail, produce "inaccessible" report |
| 4 | Action plan has ≥ 1 FILE+ACTION+CHANGE+REASON block | If analysis-only, must have findings summary instead |
| 5 | At least 1 str_replace or write_file executed OR justified skip | If skip, must have explicit reason in Phase 5 think_deeply |
| 6 | Typecheck ran and output captured | If typecheck fails, diagnose (existing vs. new error) |

### 6.2 End-to-End Test Protocol

After implementing the fix, test with a real ECC agent:

```bash
# Test 1: Spawn ecc-performance-optimizer with a specific task
# Expected: Agent reads frontend files, analyzes render performance, produces findings
# Success criteria: Agent yields read_files for scholarship-browser.tsx or similar;
#   produces performance analysis output; runs typecheck

# Test 2: Spawn ecc-code-explorer with a specific task
# Expected: Agent traces execution paths, maps architecture layers
# Success criteria: Agent yields code_search + read_files for multiple files;
#   produces dependency map or similar structured output

# Test 3: Spawn ecc-typescript-reviewer with a specific task
# Expected: Agent reads TypeScript files, checks type safety, async patterns
# Success criteria: Agent yields read_files + code_search; produces review findings
```

---

## 7. Implementation Order

| Step | File(s) | Action | Estimated Effort |
|:----:|---------|--------|:---:|
| 1 | `handle-steps-template.ts` | Rewrite `createHandleSteps()` with 7-phase workflow (§3.1) | Primary |
| 2 | `metabuff-reasoner.ts` | Insert `code_search` + `read_files` (§3.2) | Small |
| 2b | `metabuff-reasoner.ts` | Insert `str_replace` after IMPLEMENT (§3.2) | Small |
| 3 | `metabuff-arch.ts` | Insert `code_search` + `read_files` + `str_replace` (§3.3) | Small |
| 4 | `metabuff-security.ts` | Insert `code_search` + `read_files` + `str_replace` (§3.4) | Small |
| 5 | `metabuff-testgen.ts` | Insert `code_search` + `read_files` + `write_file` + test run (§3.4) | Small |
| 6 | `metabuff-regex-guard.ts` | Insert `code_search` + `read_files` + `str_replace` + re-scan (§3.4) | Small |
| 7 | `thinker-with-files-gemini.ts` | Read and verify; fix if needed | Verification |
| 8 | `code-reviewer-deepseek.ts` | Read and verify | Verification |
| 9 | — | Test: spawn ecc-performance-optimizer with real task | Testing |
| 10 | — | Test: spawn ecc-code-explorer with real task | Testing |
| 11 | `known-issues.md` | Record fix | Documentation |

---

## 8. Known Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|:---:|:---:|-----------|
| PHASE 5 str_replace with PLACEHOLDER path fails silently | Medium | High — no edits applied | After Phase 5 yield, add a verification think_deeply that checks if str_replace executed |
| code_search returns too many results (context overflow) | Low | Medium | `maxResults: 15` per query cap in Phase 2 schema |
| DeepSeek V4 Pro ignores instructionsPrompt in Phase 0 preload | Medium | High — agent doesn't apply methodology | Phase 1 ORIENT explicitly asks agent to map task to methodology section; acts as double-check |
| Generator fatigue (>8 yields) causes garbled output | Low | Medium | Capped at 8 yields; if more work needed, use spawn_agents delegation |
| Freebuff handles str_replace with placeholder differently than expected | Medium | Medium | The placeholder approach is experimental; if Freebuff rejects it, fall back to think_deeply-guided edits where agent uses its own str_replace calls autonomously (requires Freebuff research to confirm agent autonomy between yields) |

---

## 9. Open Questions (for Implementation-Time Resolution)

1. **Q1: Placeholder str_replace** — Does Freebuff accept `str_replace` yields with placeholder values and let the agent fill them in? Or does it reject the yield? If rejected, switch to a think_deeply-guided approach where Phase 5 is a think_deeply that says "you now have str_replace available — execute your plan."

2. **Q2: Agent autonomy between yields** — Can an agent autonomously call tools (like `read_files`, `str_replace`) BETWEEN generator yields, or only DURING a yield? The user's observed behavior (agents only ran what the generator yielded) suggests NO autonomy. But this needs definitive confirmation.

3. **Q3: code_search result format** — What format does `code_search` return as `toolResult`? Is it structured (file paths + line contents) or freeform? If structured, we can parse it in the generator and dynamically build read_files calls.

4. **Q4: write_file behavior in handleSteps** — Does `write_file` in a handleSteps yield work the same as a normal tool call? Or does it require special handling?

5. **Q5: Error propagation** — When a yielded tool call fails (e.g., code_search times out), does the generator resume with `{ toolError: string }` or does Freebuff terminate the agent? Need to handle both cases.
