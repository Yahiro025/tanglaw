/**
 * MetaBuff Reasoner — Deep Logic Specialist v1.0.0
 * ───────────────────────────────────────────────────
 * Handles tasks that require genuine algorithmic thinking rather than
 * pattern matching. Uses maximum reasoning effort + 6-step Socratic
 * protocol to close the single-model reasoning gap vs Claude Opus 4.8.
 *
 * TARGET TASKS (base agent: ~55/100, this agent targets: ~75+):
 *   • Novel algorithm design (sorting, graph, DP, string parsing)
 *   • Complex state machine logic (auth flows, multi-step workflows)
 *   • Performance optimization (bottleneck analysis, algorithmic improvements)
 *   • Mathematical / numerical computation (precision, overflow, rounding)
 *   • Concurrency and race condition analysis
 *   • API design with non-trivial constraint satisfaction
 *   • Parsers, transpilers, and transformation pipelines
 *   • Dynamic programming / memoization problems
 *
 * PROTOCOL: 6-step Socratic method
 *   1. UNDERSTAND — restate the problem; identify inputs/outputs/constraints
 *   2. CHALLENGE  — critique the naive solution before accepting it
 *   3. EXPLORE    — generate 2–3 alternative approaches
 *   4. SELECT     — choose best and justify with explicit trade-off analysis
 *   5. IMPLEMENT  — execute with surgical edits + inline complexity annotations
 *   6. PROVE      — write the test that would catch the bug you almost made
 *
 * Spawned by:
 *   • metabuff.ts      — when isAlgorithmTask is true in the complex pipeline
 *   • metabuff-mega.ts — for subtasks tagged specialist: 'reason'
 *
 * INLINING NOTE:
 *   Has handleSteps v1.1.0 — 6-step Socratic protocol with code discovery
 *   and implementation phases. systemPrompt + instructionsPrompt provide
 *   detailed methodology that the agent reads on every step.
 */

import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const REASONER_SYSTEM = `You are MetaBuff's deep reasoning specialist.
You are invoked for tasks that require genuine algorithmic thinking — not code lookup or boilerplate.

CORE PRINCIPLE:
  Never accept the first solution that comes to mind.
  The "obvious" solution is where bugs hide. Your job is to find them first.

REASONING STANDARDS (apply to every task):
  • Time complexity  — state Big-O and justify with a brief argument
  • Space complexity — state Big-O and identify dominant allocation
  • Edge cases       — enumerate ALL before writing a single line of code
  • Correctness      — for non-trivial algorithms, argue why the approach is correct
  • Test-first       — write the test you'd use to verify correctness before the impl

GROUNDING RULES (same as all MetaBuff agents — stricter enforcement here):
  ✗ Do not hallucinate standard-library methods — verify via code_search or run_terminal_command
  ✗ Do not assume language semantics — test edge cases in run_terminal_command node/python/go
  ✗ Do not leave proofs as TODO — incomplete reasoning is a shipped bug
  ✗ Do not choose O(n²) when O(n log n) is achievable without complexity trade-offs
  ✗ Do not write a loop that could be off-by-one without proving the bounds

CALIBRATION:
  State every uncertainty explicitly before proceeding:
  "⚠ UNCERTAIN [topic]: I'm choosing [A] over [B] because [reason].
   I'll validate this assumption via [tool/test] before continuing."`

const REASONER_INSTRUCTIONS = `
STEP 1 — UNDERSTAND (mandatory, do not skip)
  • Restate the problem in your OWN words (not copied from the prompt)
  • Identify: inputs, expected outputs, hard constraints, performance targets
  • List every assumption you are making — each one is a potential bug
  • Ask explicitly: "What would a WRONG implementation look like?" (to avoid it)

STEP 2 — CHALLENGE (devil's advocate, do not skip)
  • State the naive / obvious solution in one sentence
  • Identify at least 2 failure modes of the naive solution:
    - Correctness failures (wrong output for edge cases)
    - Performance failures (O(n²) where O(n log n) is needed)
    - Safety failures (integer overflow, floating-point precision loss, race condition)
  • State the baseline complexity of the naive solution

STEP 3 — EXPLORE
  • Generate 2–3 fundamentally different approaches
  • For each, state:
    - Core idea in one sentence
    - Time complexity (and proof sketch)
    - Space complexity
    - Strengths and weaknesses
  • Consider opposites: iterative ↔ recursive, greedy ↔ DP, exact ↔ approximate
  • Consider data structure choices: array ↔ map ↔ tree ↔ graph

STEP 4 — SELECT
  • Choose the best approach given the stated constraints
  • Write: "I chose [X] over [Y] and [Z] because: [specific reason]"
  • State explicitly what you are trading off (speed? memory? code clarity?)
  • If the choice is close, state: "⚠ UNCERTAIN: both [X] and [Y] are viable.
    I'll proceed with [X] and add a comment explaining why."

STEP 5 — IMPLEMENT
  1. Read all relevant existing code FIRST:
     • read_files for every file you plan to touch
     • code_search for every function, type, or symbol you plan to call
  2. Write the TEST CASE before the implementation:
     • The test should fail on a naive/wrong implementation
     • The test should pass only if the algorithm is correct
  3. Implement with inline annotations:
     • // O(n) — linear scan; each element visited once
     • // Invariant: lo ≤ mid ≤ hi at every iteration
     • // Edge case: empty input returns early here
  4. After each function: state its preconditions and postconditions as comments

STEP 6 — PROVE
  1. Run the tests via run_terminal_command:
     bun test [test-file] OR npx vitest run [test-file] OR npx jest [test-file]
  2. Manually trace the algorithm with your HARDEST edge case:
     (empty input / single element / max-size / all-same / already sorted / reversed)
  3. State explicitly: "This is correct because [argument]"
  4. Run typecheck: (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -20
  5. If any step fails → fix BEFORE calling end_turn

GROUNDING REMINDER (before every tool call):
  code_search for every function, type, or library method you plan to use.
  Never write an import you haven't confirmed exists in this project.`

const definition: AgentDefinition = {
  id: 'metabuff-reasoner',
  version: '1.0.0',
  displayName: 'MetaBuff Deep Reasoner',

  spawnerPrompt:
    'Spawn for tasks requiring genuine algorithmic thinking: novel algorithm design, ' +
    'complex state machines, performance optimization, mathematical computation, ' +
    'concurrency / race condition analysis, parsers, or any problem where the naive ' +
    'solution is known to be wrong. Uses maximum reasoning effort and a 6-step ' +
    'Socratic protocol (understand → challenge → explore → select → implement → prove).',

  model: resolveModel(),

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'high',  // Always max — this is the point of the reasoner
  },

  toolNames: [
    'read_files',
    'code_search',
    'find_files',      // [FIX v1.0.1] was 'file_picker' — correct Freebuff tool name is 'find_files'
    'str_replace',
    'write_file',
    'run_terminal_command',
    // 'glob' removed — not a valid Freebuff tool, causes agent-load validation error
    'think_deeply',
    'spawn_agents',
    'end_turn',
  ],

  spawnableAgents: [
    'thinker-with-files-gemini',  // escalation for especially thorny problems
  ],

  handleSteps: function* ({ prompt }) {
    // [MetaBuff: Reasoner] 6-step Socratic protocol v1.1.0 — now with real code discovery + implementation phases

    // Steps 1-4: Pure reasoning (Socratic protocol)

    // Phase 1: UNDERSTAND
    yield { toolName: 'think_deeply', input: { thought: `STEP 1 UNDERSTAND: ${prompt}. Restate the problem, identify inputs/outputs/constraints, list every assumption. What would a WRONG implementation look like?` } }

    // Phase 2: CHALLENGE
    yield { toolName: 'think_deeply', input: { thought: `STEP 2 CHALLENGE: State the naive solution in one sentence. Identify 2+ failure modes (correctness, performance, safety). State baseline time/space complexity.` } }

    // Phase 3: EXPLORE
    yield { toolName: 'think_deeply', input: { thought: `STEP 3 EXPLORE: Generate 2-3 fundamentally different approaches. For each: core idea, time/space complexity, strengths and weaknesses. Consider: iterative vs recursive, greedy vs DP, exact vs approximate.` } }

    // Phase 4: SELECT
    yield { toolName: 'think_deeply', input: { thought: `STEP 4 SELECT: Choose best approach and justify with explicit trade-off analysis. "I chose [X] over [Y] and [Z] because [specific reason]." State what you are trading off.` } }

    // ═══ NEW v1.1.0: GROUND — discover and read codebase files before implementing ═══
    // Extract keyword patterns from the prompt for code_search
    const reasonKeywords = prompt.toLowerCase().match(/[a-z]{4,}/g)
      ?.filter(w => !['this','that','with','from','have','will','your','into','when','them','they','what'].includes(w))
      ?.slice(0, 8) ?? ['function', 'algorithm', 'compute']

    yield {
      toolName: 'code_search',
      input: {
        searchQueries: [
          { pattern: reasonKeywords.join('|'), flags: '-g *.ts -g *.tsx -g *.js', maxResults: 15 },
          { pattern: 'export (function|class|const|interface|type)', flags: '-g *.ts -g *.tsx', maxResults: 10 },
        ],
      },
    }

    // Read files discovered via prompt patterns
    const reasonFiles = prompt.match(/[\w.\/-]+\.(ts|tsx|js|jsx)/g) ?? []
    const pascalNames = prompt.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? []
    const kebabPaths = pascalNames.map(c => {
      const kebab = c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      return `frontend/src/components/${kebab}.tsx`
    }).slice(0, 3)
    const reasonPaths = [...new Set([...reasonFiles, ...kebabPaths, 'package.json'])].slice(0, 8)

    if (reasonPaths.length > 0) {
      yield { toolName: 'read_files', input: { paths: reasonPaths } }
    }
    // ═══ END NEW ═══════════════════════════════════════════════════════════════════

    // Phase 5: IMPLEMENT (now with real code context from the GROUND phase)
    yield { toolName: 'think_deeply', input: { thought: `STEP 5 IMPLEMENT: You have now read the relevant codebase files. Write the TEST CASE before the implementation. Implement using str_replace for surgical edits. Add inline complexity annotations (// O(n), // Invariant: ..., // Edge case: ...). State preconditions and postconditions as comments.` } }

    // ═══ NEW v1.1.0: Apply implementation via str_replace / write_file ═══
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `Execute your chosen implementation now.`,
          `Use str_replace for targeted edits to existing files.`,
          `Use write_file only for new files.`,
          `Match the existing code style and conventions exactly.`,
        ].join('\n'),
      },
    }
    // ═══ END NEW ═════════════════════════════════════════════════════════════

    // Phase 6: PROVE
    yield { toolName: 'run_terminal_command', input: { command: '(npx vitest run 2>&1 || npx jest 2>&1) | tail -20' } }
    yield { toolName: 'run_terminal_command', input: { command: '(npx tsc --noEmit 2>&1) | head -20' } }
  },

  includeMessageHistory: true,

  systemPrompt: REASONER_SYSTEM,
  instructionsPrompt: REASONER_INSTRUCTIONS,

  stepPrompt:
    'Continue reasoning through the Socratic protocol. ' +
    'If you are on STEP 5 or 6, run your tests before calling end_turn. ' +
    'Do not call end_turn while any ⚠ UNCERTAIN items are unresolved or any tests are failing.',
}

export default definition
