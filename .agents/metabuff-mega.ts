/**
 * MetaBuff Mega — SDD-Enhanced Parallel Agent Spawner v1.3.1
 * ─────────────────────────────────────────────────────────────────────
 * For large-scale tasks (full-system refactors, new features spanning many
 * subsystems, or anything the complexity analyzer scored 6+).
 *
 * ✦ SUPERSPOWERS SDD INTEGRATION (v1.3.0) ✦
 *   • [SDD] Two-stage review per subtask: Stage 1 (Spec Compliance) checks
 *     that the implementation matches the task spec EXACTLY. Stage 2 (Code
 *     Quality) checks imports, types, tests, conventions after Stage 1 passes.
 *     Adapted from obra/superpowers subagent-driven-development.
 *   • [SDD] Context isolation enforcement: subagents receive ONLY task description
 *     + spec + code context. No conversation history from other subagents.
 *   • [SDD] Disposable subagents: each subagent does ONE task, fresh context.
 *   • [TDD] Iron Law injection when testing subtask is present in decomposition.
 *
 * CHANGES FROM v1.3.0 → v1.3.1 (BUG FIXES):
 *   • [FIX] Added 'end_turn' to toolNames — was missing entirely. Without it
 *     Freebuff kept the pipeline alive indefinitely, eventually hitting concurrency
 *     limits and downgrading spawned subagents to limited mode.
 *   • [FIX] Added 'ecc-code-architect' to spawnableAgents. resolveAgent() maps
 *     specialist 'base', 'custom', and the fallback path to 'ecc-code-architect',
 *     but it was never declared spawnable. Freebuff downgrades unlisted agents to
 *     limited mode — this was the root cause of all limited mode errors on
 *     parallel subagents.
 *   • [FIX] Wrong yield capture for think_deeply. Old code:
 *       const decompositionRaw: unknown = yield { toolName: 'think_deeply', ... }
 *     Freebuff resumes the generator with { toolResult, toolError }, so
 *     decompositionRaw was always a truthy object — never a string. parseDecomposition()
 *     always fell through to the single-base-subtask fallback. No multi-agent
 *     decomposition ever occurred. Fixed to:
 *       const { toolResult: decompositionRaw } = (yield {...}) as { toolResult: string }
 *   • [FIX] Thinker prompt had no graceful vague-prompt fallback. When the user
 *     invoked @metabuff-mega with a short/high-level prompt, thinker-with-files-gemini
 *     returned "VAGUE_PROMPT: ..." instead of JSON. Added explicit instruction:
 *     "NEVER return an error or 'VAGUE_PROMPT' — ALWAYS produce a valid JSON array."
 *
 * CHANGES FROM v1.2.0 → v1.3.0:
 *   • [QUAL] Cascade wave pattern: MAX_DECOMP_TASKS raised from 6 to 8.
 *     Subtasks are split into sequential waves of ≤ MAX_WAVE_SIZE (4).
 *     Closes scale gap vs Antigravity 2.0 — 8 effective specialist agents
 *     without exceeding the Freebuff 4-concurrent freeze limit.
 *     Between waves, a lightweight integration review ensures wave 2 agents
 *     have accurate context from wave 1 changes.
 *   • [QUAL] Dynamic specialist type: thinker can now output specialist: 'custom'
 *     with customRole + customSystemAddition fields to create purpose-built
 *     agents for novel task categories (e.g., 'i18n-specialist', 'migration-specialist').
 *     Closes the static-pool gap vs Antigravity 2.0's fully dynamic agent creation.
 *   • [QUAL] Algorithm routing: 'reason' specialist type added → routes to
 *     metabuff-reasoner (effort=high, Socratic 6-step) for algorithmically complex
 *     subtasks.
 *   • [SAFETY] metabuff-regex-guard added after synthesis review.
 *     All generated code in mega tasks is now scanned for runtime-invalid regex.
 *   • [QUAL] Thinker prompt updated: documents new specialists + cascade awareness.
 *   • [QUAL] parseDecomposition handles new fields (customRole, customSystemAddition).
 *
 * FLOW:
 *   1. File-picker maps relevant codebase structure
 *   2. Thinker decomposes into 3–12 subtasks (JSON), including optional 'custom' types
 *   3. think_deeply extracts the JSON from thinker's response
 *   4. Subtasks split into waves of ≤ MAX_WAVE_SIZE (4) — Freebuff stability limit
 *   5. Wave 1 runs in parallel; inter-wave review if Wave 2+ exists
 *   6. Wave 2+ runs in parallel (building on wave 1 context)
 *   7. Synthesis reviewer integrates all parallel outputs
 *   8. Regex guard scans all generated code
 *   9. Basher runs full typecheck + tests
 *  10. Validator does final anti-hallucination pass
 *
 * PERFORMANCE CONSTRAINTS (NEVER VIOLATE):
 *   • MAX_WAVE_SIZE = 4 — hard limit for Freebuff concurrent spawn stability.
 *     More than 4 simultaneous spawns cause Freebuff to freeze or crash.
 *   • MAX_DECOMP_TASKS = 8 — thinker soft limit (2 waves of 4 max).
 *     Increase only if cascade waves are proven stable in your environment.
 *
 * CRITICAL NOTE:
 *   All helpers inlined inside handleSteps — module-level functions are NOT
 *   preserved by the agent execution framework (see README.md for details).
 */

import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'metabuff-mega',
  version: '2.0.0', // v2.0.0: MAX_WAVE_SIZE=4 (crash fix), native Gemini thinker, crash recovery
  displayName: 'MetaBuff Mega (SDD-Enhanced Cascade Spawner)',

  spawnerPrompt:
    'Spawn for large-scale tasks: full-system refactors, new features spanning many files, ' +
    'architectural changes, or anything requiring more than 5 files to change. ' +
    'MetaBuff Mega decomposes the task into up to 8 subtasks and runs them in ' +
    'cascade waves of ≤4 parallel agents (Antigravity 2.0 pattern, Freebuff-safe).',

  model: resolveModel(),

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'high',
  },

  toolNames: ['spawn_agents', 'think_deeply', 'run_terminal_command', 'end_turn'],

  spawnableAgents: [
    'ecc-code-architect',    // general-purpose implementation (replaces 'metabuff' — avoids re-entrancy loop)
    'thinker-with-files-gemini',  // task decomposition
    'ecc-code-reviewer',          // review / synthesis (model-agnostic, avoids free-mode restrictions)
    'researcher-web',            // documentation research
    'researcher-docs',           // API docs research
    'codebuff/file-picker@0.0.1', // codebase mapping
    'metabuff-arch',
    'metabuff-security',
    'metabuff-testgen',
    'metabuff-reasoner',     // v1.2.0: algorithm specialist
    'metabuff-regex-guard',  // v1.2.0: runtime regex safety
    'metabuff-validator',
    'metabuff-resume',
    'ecc-code-architect',    // [FIX v1.3.1] resolveAgent() maps base/custom/fallback here — MUST be declared spawnable
    'ecc-vision-analyst',
  ],

  systemPrompt:
    'You are the MetaBuff Mega orchestrator. ' +
    'You never write code directly. ' +
    'Your job is to decompose large tasks into parallel subtasks and coordinate specialist agents ' +
    'in cascade waves (never more than 4 concurrent spawns). ' +
    'Think of yourself as the Technical Director for a parallel coding team.',

  handleSteps: function* ({ prompt }) {

    // ─── RECOVERY CONSTANTS & HELPER (Session F) ─────────────────────────────
    const RECOVERY_DIR = '.agents/.recovery'
    const pad = (n: number) => n.toString().padStart(2, '0')
    const now = new Date()
    const SESSION_ID = `session-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

    function buildCheckpointCmd(status: string, phase: string, contextObj: any = {}): string {
      return [
        `mkdir -p ${RECOVERY_DIR}`,
        `python3 -c "`,
        `import json, os, datetime`,
        `path = '${RECOVERY_DIR}/${SESSION_ID}.json'`,
        `d = {'id': '${SESSION_ID}', 'task': '''${prompt.replace(/'/g, "\\'")}''', 'pipeline': 'metabuff-mega', 'startTime': '${now.toISOString()}', 'phases': {}, 'context': {}, 'log': []}`,
        `if os.path.exists(path): d = json.load(open(path))`,
        `d['status'] = '${status}'`,
        `d['lastCheckpoint'] = datetime.datetime.utcnow().isoformat() + 'Z'`,
        `d['phases']['${phase}'] = 'done'`,
        `ctx = ${JSON.stringify(contextObj).replace(/'/g, "\\'")}`,
        `d['context'].update(ctx)`,
        `d['log'].append('Completed phase: ${phase}')`,
        `open(path, 'w').write(json.dumps(d, indent=2))`,
        `"`,
        `cp ${RECOVERY_DIR}/${SESSION_ID}.json ${RECOVERY_DIR}/latest.json`
      ].join(' && ')
    }

    // ─── W0.4: Clean up stale scratchpad from previous mega run ──────────────
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'rm -f .agents/.wave-scratchpad.json 2>/dev/null; echo "SCRATCHPAD_CLEANED"',
      },
    }

    /**
     * Hard limit: concurrent spawns that won't freeze Freebuff.
     * NEVER increase this without testing Freebuff stability.
     */
    const MAX_WAVE_SIZE = 4

    /**
     * Soft limit: maximum subtasks the thinker can create.
     * At 8 tasks and wave size 4 → 2 waves = 8 effective specialists total.
     */
    const MAX_DECOMP_TASKS = 8

    /** Timeout for typecheck/test basher commands */
    const BASHER_TIMEOUT = (() => {
      try {
        const { resolveModel, FREE_MODELS } = require('./model-config')
        const model = resolveModel()
        // Default complexity for metabuff-mega is always mega
        if (model === FREE_MODELS?.kimi) return 300
      } catch {}
      return 120
    })()

    // ─── HELPER: Resolve specialist tag → agent type string ───────────────────
    function resolveAgent(specialist: string): string {
      const map: Record<string, string> = {
        arch:     'metabuff-arch',
        security: 'metabuff-security',
        testgen:  'metabuff-testgen',
        base:     'ecc-code-architect',
        research: 'researcher-web',
        review:   'ecc-code-reviewer',
        reason:   'metabuff-reasoner',     // v1.2.0
        custom:   'ecc-code-architect',    // v1.2.0: dynamic via custom prompt
      }
      return map[specialist] ?? 'ecc-code-architect'
    }

    // ─── HELPER: Split array into waves ───────────────────────────────────────
    function splitIntoWaves<T>(items: T[], waveSize: number): T[][] {
      const waves: T[][] = []
      for (let i = 0; i < items.length; i += waveSize) {
        waves.push(items.slice(i, i + waveSize))
      }
      return waves
    }

    // ─── HELPER: Parse decomposition ──────────────────────────────────────────
    function parseDecomposition(
      raw: string | undefined,
      fallbackPrompt: string,
    ): Array<{
      subtask: string
      specialist: string
      focus: string
      customRole?: string
      customSystemAddition?: string
    }> {
      if (!raw || typeof raw !== 'string') return [{
        subtask: fallbackPrompt,
        specialist: 'base',
        focus: 'full implementation',
      }]

      const jsonMatch = raw.match(/\[[\s\S]*?\]/s)
      // BUG-13 FIX: non-greedy regex above breaks on nested arrays (e.g. "files": ["a.ts"])
      // by stopping at the first inner ']'. Use outermost-bracket approach instead.
      const outerStart = raw.indexOf('[')
      const outerEnd = raw.lastIndexOf(']')
      const jsonStr = outerStart !== -1 && outerEnd > outerStart
        ? raw.slice(outerStart, outerEnd + 1)
        : jsonMatch?.[0]
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr) as unknown[]
          if (Array.isArray(parsed) && parsed.length > 0) {
            return (parsed as Array<{
              subtask: string
              specialist: string
              focus: string
              customRole?: string
              customSystemAddition?: string
            }>)
              .slice(0, MAX_DECOMP_TASKS)
              .filter(s => typeof s.subtask === 'string' && typeof s.specialist === 'string')
          }
        } catch {
          // fall through to bullet-list fallback
        }
      }

      const lines = raw.split('\n').filter(l => /^\s*[-\d*•]/.test(l)).slice(0, MAX_DECOMP_TASKS)
      if (lines.length > 1) {
        return lines.map((line, i) => ({
          subtask: line.replace(/^\s*[-\d.*•]+\s*/, ''),
          specialist: i === 0 ? 'arch' : i === lines.length - 1 ? 'testgen' : 'base',
          focus: `part ${i + 1} of ${lines.length}`,
        }))
      }

      return [{ subtask: fallbackPrompt, specialist: 'base', focus: 'full implementation' }]
    }

    // ─── HELPER: Wave scratchpad for inter-wave coherence (W0.4) ──────────────
    /**
     * v2.0.0 W0.4: Reads .agents/.wave-scratchpad.json and returns a formatted
     * context string for Wave 2+ agents so they know what previous waves changed.
     * INLINED inside handleSteps — module-level code is not preserved at runtime.
     */
    function getScratchpadContext(): string {
      try {
        const fs = require('fs')
        if (!fs.existsSync('.agents/.wave-scratchpad.json')) return ''
        const s = JSON.parse(fs.readFileSync('.agents/.wave-scratchpad.json', 'utf-8'))
        const waves = Object.entries(s)
        if (waves.length === 0) return ''
        return (
          `\n\n<!-- WAVE SCRATCHPAD: What previous waves changed -->\n` +
          waves.map(([w, d]: [string, any]) =>
            `${w}: changed ${(d.changed_files ?? []).join(', ') || 'unknown files'} — ${d.summary || ''}`
          ).join('\n') +
          `\nIMPORTANT: Read these changed files FIRST before implementing. ` +
          `Do not assume original interfaces — they may have changed in prior waves.\n`
        )
      } catch { return '' }
    }

    // ─── SDD PROTOCOL prefix for all specialist agents ────────────────────────
    /**
     * v1.3.0: Subagent-Driven Development (SDD) protocol.
     * Adapted from obra/superpowers: fresh subagent per task, context isolation,
     * two-stage review (spec compliance → code quality).
     */
    const SDD_SYSTEM_PREFIX = `You are a SUBAGENT in MetaBuff's Superpowers-enhanced SDD pipeline.
You have ONE specific subtask. You are DISPOSABLE — do one thing well and terminate.

SDD CONTEXT ISOLATION (critical):
  • You receive ONLY: this task description + relevant code context
  • You SHOULD NOT rely on conversation history from parallel subagents — it may be stale
  • You MUST NOT assume knowledge of work done by parallel subagents
  • You MUST NOT make changes to files outside your task scope

SDD TWO-STAGE REVIEW PROTOCOL:
  After you complete your work, a two-stage review will verify:
  STAGE 1 (Spec Compliance): Does your output match the task description EXACTLY?
    → If you added extra changes beyond the spec, they will be flagged as scope creep.
  STAGE 2 (Code Quality): Are imports valid? Types correct? Tests present?
    → Ghost imports, missing tests, or TODOs will block your subtask.
  You can preempt review failures by self-checking against both stages.

EXECUTION PROTOCOL:
  1. Read every file relevant to your subtask before touching anything
  2. Verify all symbols, imports, and types you plan to use via code_searcher
  3. Make your changes with surgical str_replace operations
  4. Leave a brief comment in each changed file: // [MetaBuff Mega: <focus>]
  5. Do NOT attempt to handle subtasks assigned to other specialist agents
  6. Call end_turn only when your subtask is complete and verified
  7. TDD IRON LAW: If your task involves new behavior, write the test FIRST

ANTI-HALLUCINATION (non-negotiable):
  ✗ Do not reference a file path without having read it this session
  ✗ Do not assume a function or type exists — verify with code_searcher
  ✗ Do not invent package names or import paths
  ✗ Do not leave TODOs or placeholder code
  ✗ Do not call end_turn if there are unresolved ⚠ UNCERTAIN items

`

    // ── Phase 0: Codebase mapping ──────────────────────────────────────────────
    // [FIX BUG-07] Capture file-picker output so thinker receives actual file paths,
    // not an empty array. Old code yielded and discarded the result entirely.
    const { toolResult: fileMapRaw } = (yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'codebuff/file-picker@0.0.1',
          params: {},
          prompt:
            `Map the entire codebase structure relevant to this task.\n` +
            `List key files, their roles, and how they interconnect.\n` +
            `Task: ${prompt}`,
        }],
      },
    }) as { toolResult: string; toolError?: string }

    // Extract file paths from the file-picker response (lines that look like paths)
    const discoveredPaths: string[] = typeof fileMapRaw === 'string'
      ? fileMapRaw
          .split('\n')
          .map(l => l.trim())
          .filter(l => /^[\w./\-].*\.(ts|tsx|js|jsx|py|go|rs|java|kt|swift|cs|cpp|dart|rb|php)$/.test(l))
          .slice(0, 40)  // cap to avoid overloading thinker context
      : []

    // 1. Recovery Checkpoint
    yield {
      toolName: 'run_terminal_command',
      input: { command: buildCheckpointCmd('in-progress', 'file-picker', { discoveredPaths }) },
    }

    // ── Phase 1: Task decomposition ───────────────────────────────────────────
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'thinker-with-files-gemini',
          params: { filePaths: discoveredPaths },  // [FIX BUG-07] was always []
          prompt:
            `You are decomposing a large coding task for parallel cascade execution.\n\n` +
            `Task: ${prompt}\n\n` +
            `Output ONLY a JSON array (no markdown, no explanation) of 3–${MAX_DECOMP_TASKS} subtasks.\n` +
            `Each element:\n` +
            `  {\n` +
            `    "subtask": "Detailed description of what to implement",\n` +
            `    "specialist": "arch|security|testgen|base|research|reason|custom",\n` +
            `    "focus": "one-line display name",\n` +
            `    "customRole": "(only when specialist=custom) short role title",\n` +
            `    "customSystemAddition": "(only when specialist=custom) extra system prompt text"\n` +
            `  }\n\n` +
            `Specialist guide:\n` +
            `  arch     → system design, component structure, data models, API contracts\n` +
            `  security → auth flows, input validation, secrets, access control\n` +
            `  testgen  → unit + integration tests for changed code\n` +
            `  base     → general implementation: business logic, UI, utilities\n` +
            `  research → documentation, README, changelog, ADRs\n` +
            `  reason   → algorithm design, state machines, performance optimization,\n` +
            `             parsers, numerical computation — anything requiring proof-level thinking\n` +
            `  custom   → novel task-specific roles not covered above.\n` +
            `             Set customRole = "short-role-name" (e.g., "migration-specialist")\n` +
            `             Set customSystemAddition = "You focus exclusively on [specific aspect]..."\n\n` +
            `Cascade wave rules:\n` +
            `  - Subtasks run in waves of ${MAX_WAVE_SIZE} concurrent agents\n` +
            `  - Order subtasks so FOUNDATION work (arch, data models) appears first\n` +
            `  - Implementation subtasks that depend on the schema come in wave 2\n` +
            `  - testgen + research always go in the LAST wave\n` +
            `  - Always include at least one testgen subtask\n` +
            `  - Always include arch if the task touches data models or APIs\n` +
            `  - Each file should appear in at most one subtask\n` +
            `  - Respect the ${MAX_DECOMP_TASKS}-subtask maximum\n\n` +
            `IMPORTANT: If the task description is short or high-level, use your best judgment\n` +
            `to infer reasonable subtasks. NEVER return an error, refusal, or "VAGUE_PROMPT".\n` +
            `ALWAYS produce a valid JSON array — even for a 1-word task, produce at least 3 subtasks.`,
        }],
      },
    }

    // Extract decomposition JSON from thinker's response
    // [FIX v1.3.1] Framework resumes generator with { toolResult, toolError } — must destructure.
    // Old: const decompositionRaw: unknown = yield {...} → captured the whole object, not the string.
    // parseDecomposition always saw a non-string truthy value → fell through to fallback single subtask.
    // [BUG-20 NOTE] This extraction depends on message history recall. In long sessions where context
    // is truncated, think_deeply may return "" and parseDecomposition falls back to a single subtask.
    // The fallback is safe (task still executes, just undecomposed) but degrades mega's value.
    // Future improvement: capture thinker output directly from spawn_agents toolResult instead.
    const { toolResult: decompositionRaw } = (yield {
      toolName: 'think_deeply',
      input: {
        thought:
          'Look at the thinker agent\'s most recent response in this session. ' +
          'Extract ONLY the JSON array of subtasks it produced. ' +
          'Return just the raw JSON array, nothing else. ' +
          'If no valid JSON array is found, return an empty string.',
      },
    }) as { toolResult: string; toolError?: string }

    const subtasks = parseDecomposition(
      typeof decompositionRaw === 'string' ? decompositionRaw : undefined,
      prompt,
    )

    // 2. Recovery Checkpoint
    yield {
      toolName: 'run_terminal_command',
      input: { command: buildCheckpointCmd('in-progress', 'decomposition', { subtasks, totalWaves: Math.ceil(subtasks.length / MAX_WAVE_SIZE) }) },
    }

    // ── Phase 2: Cascade wave execution ───────────────────────────────────────
    // Build base agent configs without scratchpad — scratchpad is injected at spawn-time
    const agentConfigs = subtasks.map(st => {
      let customPrefix = ''
      if (st.specialist === 'custom') {
        customPrefix =
          `DYNAMIC SPECIALIST ROLE: ${st.customRole ?? 'Custom Specialist'}\n` +
          `${st.customSystemAddition ?? ''}\n\n`
      }

      // TDD Iron Law injection for testing subtasks
      const tddIronLaw = st.specialist === 'testgen' || /\btest/i.test(st.subtask)
        ? `\n\n<!-- TDD IRON LAW ACTIVE — test-first enforcement -->\n⚠ Write FAILING TESTS FIRST. Red → Green → Refactor. No production code without a prior, failing test.`
        : ''

      return {
        agent_type: resolveAgent(st.specialist),
        prompt:
          customPrefix +
          SDD_SYSTEM_PREFIX +
          `SUBTASK [${st.focus}]:\n${st.subtask}\n\n` +
          `FULL TASK CONTEXT (for reference only — implement only your subtask):\n${prompt}` +
          tddIronLaw,
      }
    })

    const waves = splitIntoWaves(agentConfigs, MAX_WAVE_SIZE)

    for (let waveIdx = 0; waveIdx < waves.length; waveIdx++) {
      // W0.4: For Wave 2+, inject scratchpad context so agents know what previous waves changed
      const wave = waveIdx > 0
        ? waves[waveIdx].map(cfg => ({
            ...cfg,
            prompt: cfg.prompt + getScratchpadContext(),
          }))
        : waves[waveIdx]

      yield {
        toolName: 'spawn_agents',
        input: { agents: wave },
      }

      // SDD TWO-STAGE REVIEW (Superpowers integration v1.3.0)
      // [FIX BUG-08] Stages are now SEQUENTIAL: Stage 1 completes before Stage 2 runs.
      // Old code ran both in one spawn_agents call (parallel), which wasted tokens on
      // Stage 2 when Stage 1 found [CRITICAL] violations in non-existent or wrong code.
      // Stage 1: Spec Compliance — does each subtask match its spec EXACTLY?
      // Stage 2: Code Quality — imports, types, tests, conventions (runs after Stage 1)

      const isLastWave = waveIdx >= waves.length - 1

      // Stage 1 — Spec Compliance (must complete first)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'ecc-code-reviewer',
            prompt:
              `SDD STAGE 1 — SPEC COMPLIANCE REVIEW (Wave ${waveIdx + 1} of ${waves.length})\n\n` +
              `${wave.length} subagents completed work on: ${prompt}\n\n` +
              `SPEC COMPLIANCE CHECKLIST (for each subagent's output):\n` +
              `  □ Does the implementation match the task description EXACTLY?\n` +
              `  □ Are there any extra changes beyond the spec? (→ flag as SCOPE CREEP)\n` +
              `  □ Are all acceptance criteria met?\n` +
              `  □ Does the output match the contract/interface defined in the spec?\n` +
              `  □ Are edge cases from the decomposition handled?\n\n` +
              `For each finding, tag with SEVERITY:\n` +
              `  [CRITICAL] — spec violation that breaks dependent work → BLOCK\n` +
              `  [HIGH] — missing acceptance criterion → FIX\n` +
              `  [MEDIUM] — scope creep (extra changes) → NOTE\n\n` +
              `Fix [CRITICAL] and [HIGH] issues before Stage 2 runs. Do NOT refactor style.\n` +
              `Do NOT use performative language ("Great point!" is banned — use "Verified:" or "Found:" instead).`,
          }],
        },
      }

      // Stage 2 — Code Quality (sequential: only after Stage 1 fixes are applied)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'ecc-code-reviewer',
            prompt:
              `SDD STAGE 2 — CODE QUALITY REVIEW (Wave ${waveIdx + 1} of ${waves.length})\n\n` +
              `Stage 1 spec compliance has completed. Now check code quality:\n\n` +
              `CODE QUALITY CHECKLIST:\n` +
              `  □ All imports valid? (verify via code_searcher)\n` +
              `  □ No TODOs, FIXMEs, or placeholder comments?\n` +
              `  □ Error handling present for all failure modes?\n` +
              `  □ Types explicit (no 'any' without justification)?\n` +
              `  □ Follows existing codebase conventions?\n` +
              `  □ No performance anti-patterns (N+1, unnecessary allocations)?\n` +
              `  □ Test coverage for new/changed behavior?` +
              (!isLastWave ? `\n\n` +
              `INTER-WAVE INTEGRATION CHECK:\n` +
              `  1. Conflicting changes between agents (same file modified inconsistently)\n` +
              `  2. Exported symbols that Wave ${waveIdx + 2} agents will depend on\n` +
              `  3. Type mismatches or interface changes that need propagating` : ``) +
              `\n\n` +
              `For each finding, tag with SEVERITY:\n` +
              `  [CRITICAL] — ghost import or broken reference → BLOCK\n` +
              `  [HIGH] — missing error handling or test → FIX\n` +
              `  [MEDIUM] — convention violation or 'any' type → NOTE\n\n` +
              `Fix [CRITICAL] and [HIGH] issues. Use technical language only.`,
          }],
        },
      }

      // ─── W0.4: Write wave scratchpad after each wave's review ──────────────
      yield {
        toolName: 'run_terminal_command',
        input: {
          command: [
            `mkdir -p .agents`,
            `python3 -c "`,
            `import json,os`,
            `existing = {}`,
            `if os.path.exists('.agents/.wave-scratchpad.json'):`,
            `  existing = json.load(open('.agents/.wave-scratchpad.json'))`,
            `existing['wave_${waveIdx + 1}'] = {`,
            `  'changed_files': os.popen('git diff --name-only HEAD 2>/dev/null').read().strip().split('\\n')[:20],`,
            `  'summary': os.popen('git diff --stat HEAD 2>/dev/null | tail -3').read().strip(),`,
            `  'task_count': ${wave.length},`,
            `  'subtasks': ${JSON.stringify(wave.map(a => a.prompt.slice(0, 80))).replace(/'/g, "\\'")}`,
            `}`,
            `open('.agents/.wave-scratchpad.json','w').write(json.dumps(existing,indent=2))`,
            `print('SCRATCHPAD updated: wave ${waveIdx + 1}')`,
            `" 2>/dev/null || echo "SCRATCHPAD_WRITE_FAILED (non-fatal)"`,
          ].join(' && '),
        },
      }

      // 3. Recovery Checkpoint
      yield {
        toolName: 'run_terminal_command',
        input: { command: buildCheckpointCmd('in-progress', `wave-${waveIdx + 1}`, { waveIdx: waveIdx + 1 }) },
      }
    }

    // ── Phase 3: Final synthesis review ───────────────────────────────────────
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'ecc-code-reviewer',
          prompt:
            `Final synthesis review for a ${waves.length}-wave parallel cascade session.\n\n` +
            `${subtasks.length} specialist agents completed work on:\n${prompt}\n\n` +
            `Check specifically for:\n` +
            `  1. Conflicting changes between agents (same file edited inconsistently)\n` +
            `  2. Naming/interface inconsistencies across the codebase\n` +
            `  3. Missing integration glue between subsystems\n` +
            `  4. Any subtask that appears incomplete\n` +
            `  5. TODOs or placeholder comments left by any agent\n` +
            `Fix all issues found — do not just report them.`,
        }],
      },
    }

    // ── Phase 3b: Adversarial critic (W0.5) ──────────────────────────────────
    // v2.0.0 W0.5: Dedicated adversarial agent explicitly tries to BREAK the
    // implementation before the validator runs. Catches interface mismatches,
    // edge cases, and regressions that friendly synthesis reviews miss.
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'metabuff-arch',
          prompt:
            `ADVERSARIAL CRITIC MODE — Your job is to try to BREAK the implementation.\n\n` +
            `Original task: ${prompt}\n\n` +
            `What was just implemented (wave scratchpad):\n` + getScratchpadContext() + `\n\n` +
            `ADVERSARIAL CHECKLIST — check each item and report PASS/FAIL:\n` +
            `  1. INTERFACE CONTRACTS: Do all callers of changed functions pass the right arguments?\n` +
            `     → code_search for every import of changed symbols\n` +
            `  2. EDGE CASES: What inputs would cause the new code to throw or return wrong results?\n` +
            `     → Think: null, empty string, max value, circular reference, concurrent calls\n` +
            `  3. REGRESSION RISK: Did any change break something that was working before?\n` +
            `     → run_terminal_command: git diff HEAD --name-only, then read each changed file\n` +
            `  4. ASSUMPTION VIOLATIONS: Does the implementation assume something about the codebase\n` +
            `     that may not be true? (e.g., hardcoded paths, assumed file existence, env vars)\n` +
            `  5. TYPE SAFETY: Run npx tsc --noEmit and report any new errors\n\n` +
            `For each FAIL: either fix it directly (str_replace) or spawn ecc-code-architect.\n` +
            `For each PASS: briefly state why.\n` +
            `Finish by writing a one-line verdict: ADVERSARIAL: CLEAR / ADVERSARIAL: N ISSUES FIXED.`,
        }],
      },
    }

    // ── Phase 4: Regex guard ───────────────────────────────────────────────────
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'metabuff-regex-guard',
          prompt: `Run regex guard for all code generated in the mega task: ${prompt}`,
        }],
      },
    }

    // ── Phase 5: Full typecheck + tests ────────────────────────────────────────
    yield {
      toolName: 'run_terminal_command',
      input: {
        command:
          'echo "=== TYPE CHECK ===" && ' +
          '(bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -40 && ' +
          'echo "=== TESTS ===" && ' +
          '(bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -30',
      },
    }

    // ── Phase 6: Final validation ──────────────────────────────────────────────
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: 'metabuff-validator',
          prompt:
            `Final validation pass for mega cascade task (${waves.length} waves, ` +
            `${subtasks.length} specialists): ${prompt}`,
        }],
      },
    }

    // 4. Recovery Checkpoint (Complete)
    yield {
      toolName: 'run_terminal_command',
      input: { command: buildCheckpointCmd('completed', 'validation') },
    }
  },
}

export default definition
