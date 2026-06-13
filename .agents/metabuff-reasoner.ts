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
 *   Uses createHandleSteps() template for structured 6-phase workflow.
 *   Reasoning behaviour is driven by systemPrompt + instructionsPrompt.
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
  ✗ Do not hallucinate standard-library methods — verify via code_searcher or basher
  ✗ Do not assume language semantics — test edge cases in basher node/python/go
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
     • code_searcher for every function, type, or symbol you plan to call
  2. Write the TEST CASE before the implementation:
     • The test should fail on a naive/wrong implementation
     • The test should pass only if the algorithm is correct
  3. Implement with inline annotations:
     • // O(n) — linear scan; each element visited once
     • // Invariant: lo ≤ mid ≤ hi at every iteration
     • // Edge case: empty input returns early here
  4. After each function: state its preconditions and postconditions as comments

STEP 6 — PROVE
  1. Run the tests via basher:
     bun test [test-file] OR npx vitest run [test-file] OR npx jest [test-file]
  2. Manually trace the algorithm with your HARDEST edge case:
     (empty input / single element / max-size / all-same / already sorted / reversed)
  3. State explicitly: "This is correct because [argument]"
  4. Run typecheck: (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -20
  5. If any step fails → fix BEFORE calling end_turn

GROUNDING REMINDER (before every tool call):
  code_searcher for every function, type, or library method you plan to use.
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
    'find_files',      // [FIX v1.0.1, 'think_deeply', 'run_terminal_command'] was 'file_picker' — correct Freebuff tool name is 'find_files'
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

  includeMessageHistory: true,

  systemPrompt: REASONER_SYSTEM,
  instructionsPrompt: REASONER_INSTRUCTIONS,

  handleSteps: function* ({ prompt }) {
    // Phase 0: ORIENT
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          '=== PHASE 0: ORIENT ===',
          '',
          `TASK: ${prompt}`,
          '',
          'You are the MetaBuff Deep Reasoner. Follow the 6-step Socratic protocol in your systemPrompt.',
          'Read your instructionsPrompt to understand the methodology.',
          '',
          '1. CLASSIFY the task domain.',
          '2. MAP to your Socratic methodology (UNDERSTAND → CHALLENGE → EXPLORE → SELECT → IMPLEMENT → PROVE).',
          '3. IDENTIFY likely files based on the task description.',
          '',
          'Proceed to Phase 1 (DISCOVER).',
        ].join('\n'),
      },
    }

    // Phase 1: DISCOVER
    const promptKeywords = prompt
      .toLowerCase()
      .match(/[a-z]{4,}/g)
      ?.filter(w =>
        !['this','that','with','from','have','will','your','into','when',
          'them','they','what','file','code','make','want','need','just',
          'like','some','more','then','also','than','even','only','over',
          'back','here','there','their','been','were','does','dont','should',
          'would','could','change','update','every','other','same','such',
          'very','much','many','well','still','down','first','last','next',
        ].includes(w)
      )
      ?.slice(0, 6) ?? ['typescript', 'algorithm', 'function', 'export']

    const componentNames = prompt.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? []
    const searchTargets = [...promptKeywords, ...componentNames.slice(0, 4)]

    yield {
      toolName: 'code_search',
      input: {
        searchQueries: [{
          pattern: searchTargets.join('|'),
          flags: '-g *.ts -g *.tsx -g *.js -g *.jsx',
          maxResults: 15,
        }],
      },
    }

    // Phase 2: READ
    const filePatterns = prompt.match(/[\w.\/-]+\.(ts|tsx|js|jsx|json)/g) ?? []
    const kebabComponents = componentNames
      .map(c => c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
      .slice(0, 3)
    const configPaths = ['package.json', 'tsconfig.json']
    const allPathsToRead = [...new Set([...filePatterns, ...kebabComponents, ...configPaths])]
      .filter(p => !p.startsWith('node_modules') && !p.startsWith('.git'))
      .slice(0, 8)

    yield {
      toolName: 'read_files',
      input: { paths: allPathsToRead.length > 0 ? allPathsToRead : ['package.json'] },
    }

    // Phase 3: PLAN
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          '=== PHASE 3: PLAN ===',
          '',
          'You have searched the codebase and read relevant files.',
          'Based on your Socratic protocol (UNDERSTAND → CHALLENGE → EXPLORE → SELECT):',
          '',
          'Create an ACTION PLAN with:',
          '  FILE: <path>',
          '  ACTION: <str_replace | write_file | no_change>',
          '  WHAT: <specific description>',
          '  WHY: <reason>',
          '',
          'Proceed to Phase 4 (IMPLEMENT).',
        ].join('\n'),
      },
    }

    // Phase 4: IMPLEMENT
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          '=== PHASE 4: IMPLEMENT ===',
          '',
          'Execute your plan from Phase 3.',
          'Use str_replace for targeted edits. Use write_file only for new files.',
          'Add inline complexity annotations (e.g. // O(n) — linear scan).',
          'Write the TEST CASE before the implementation.',
          '',
          'After completing your work, proceed to Phase 5 (PROVE).',
        ].join('\n'),
      },
    }

    // Phase 5: PROVE — run tests + typecheck
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'echo "=== TESTS ===" && (bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -20',
      },
    }

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30',
      },
    }

    // Generator returns → Freebuff calls end_turn automatically.
  },
}

export default definition
