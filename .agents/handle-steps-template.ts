/**
 * Shared handleSteps Template — 6-Phase Discovery Workflow v2.0.0
 * ─────────────────────────────────────────────────────────────────
 * Provides a handleSteps generator that actually discovers files, reads code,
 * and guides the agent through a complete analysis/implementation cycle.
 *
 * v2.0.0: Replaces the broken 2-yield shim (think → typecheck) with a 6-phase
 *         workflow that yields code_search, read_files, and execution guidance.
 *         The agent DOES real work now — it discovers code, reads it, plans,
 *         and produces actionable output.
 *
 * WHY THIS WORKS:
 *   handleSteps provides the high-level structure (yielded tool calls).
 *   Between yields, the agent autonomously uses its toolNames (read_files,
 *   code_search, str_replace, write_file) guided by think_deeply prompts.
 *   The more structure we provide (yields + guidance), the better the agent
 *   stays on track and produces useful output.
 *
 *   Previous v1 only yielded think_deeply + typecheck (2 yields).
 *   v2 yields code_search + read_files on top of guidance (6 yields),
 *   giving the agent concrete discovery triggers and more structure.
 */

import { AgentDefinition } from './types/agent-definition'

export function createHandleSteps(): AgentDefinition['handleSteps'] {
  return function* ({ prompt }: { prompt: string }) {

    // ═══════════════════════════════════════════════════════
    // PHASE 0 — ORIENT: Understand the task and your role
    // ═══════════════════════════════════════════════════════
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 0: ORIENT ===`,
          ``,
          `TASK: ${prompt}`,
          ``,
          `You are a specialist agent. Your instructionsPrompt contains your specific methodology.`,
          `Read your instructionsPrompt and systemPrompt now to understand your role and approach.`,
          ``,
          `1. CLASSIFY the task domain. What kind of work is this?`,
          `   (performance audit? code review? build fix? architecture? security? testing?)`,
          ``,
          `2. MAP to your methodology. Your instructionsPrompt has domain-specific checklists.`,
          `   Identify the exact section that applies to this task.`,
          ``,
          `3. IDENTIFY likely files. Based on the task description, what files are probably relevant?`,
          `   Extract keywords, component names, module names.`,
          ``,
          `Proceed to Phase 1 (DISCOVER) where you will search the codebase.`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 1 — DISCOVER: Search the codebase for relevant code
    // ═══════════════════════════════════════════════════════
    // Build keyword patterns from the prompt for code_search.
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
      ?.slice(0, 6) ?? ['typescript', 'component', 'function', 'export']

    // Also extract PascalCase component names as search targets
    const componentNames = prompt.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? []
    const searchTargets = [
      ...promptKeywords,
      ...componentNames.slice(0, 4),
    ]

    yield {
      toolName: 'code_search',
      input: {
        searchQueries: [
          {
            pattern: searchTargets.join('|'),
            flags: '-g *.ts -g *.tsx -g *.js -g *.jsx',
            maxResults: 15,
          },
        ],
      },
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 2 — READ: Load files discovered in Phase 1
    // ═══════════════════════════════════════════════════════
    // Use prompt-derived file paths and component name patterns.
    const filePatterns = prompt.match(/[\w.\/-]+\.(ts|tsx|js|jsx|json)/g) ?? []
    const kebabComponents = componentNames
      .map(c => {
        const kebab = c.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
        return `frontend/src/components/${kebab}.tsx`
      })
      .slice(0, 3)

    const configPaths = ['package.json', 'tsconfig.json']
    const allPathsToRead = [...new Set([...filePatterns, ...kebabComponents, ...configPaths])]
      .filter(p => !p.startsWith('node_modules') && !p.startsWith('.git'))
      .slice(0, 8)

    // Also try to read backend paths if the prompt mentions backend/API
    const backendMatch = prompt.match(/backend\/src\/[\w\/-]+\.ts/g) ?? []
    const finalPaths = [...new Set([...allPathsToRead, ...backendMatch])].slice(0, 10)

    yield {
      toolName: 'read_files',
      input: { paths: finalPaths.length > 0 ? finalPaths : ['package.json'] },
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 3 — PLAN: Formulate an action plan
    // ═══════════════════════════════════════════════════════
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 3: PLAN ===`,
          ``,
          `You have now searched the codebase and read relevant files.`,
          `Based on: (1) your instructionsPrompt methodology, (2) the task, (3) the code you found:`,
          ``,
          `Create an ACTION PLAN.`,
          ``,
          `If you need to make code changes:`,
          `  FILE: <path>`,
          `  ACTION: <str_replace | write_file | no_change>`,
          `  WHAT: <specific description of the change>`,
          `  WHY: <reason this change is needed>`,
          ``,
          `If this is an analysis-only task (no code changes):`,
          `  State your findings clearly.`,
          `  What did you discover? What recommendations do you have?`,
          ``,
          `Proceed to Phase 4 (EXECUTE).`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 4 — EXECUTE: Apply changes or produce output
    // ═══════════════════════════════════════════════════════
    yield {
      toolName: 'think_deeply',
      input: {
        thought: [
          `=== PHASE 4: EXECUTE ===`,
          ``,
          `Carry out your plan from Phase 3.`,
          ``,
          `For code changes:`,
          `  • Use str_replace for targeted edits (match exact whitespace/indentation)`,
          `  • Use write_file only for new files`,
          `  • Add comments explaining non-obvious changes`,
          `  • Match existing code style and conventions`,
          ``,
          `For analysis tasks:`,
          `  • Produce a clear, structured report of your findings`,
          `  • Include specific file paths, line numbers, and concrete recommendations`,
          ``,
          `After completing your work, proceed to Phase 5 (VERIFY).`,
        ].join('\n'),
      },
    }

    // ═══════════════════════════════════════════════════════
    // PHASE 5 — VERIFY: Run typecheck to confirm nothing broke
    // ═══════════════════════════════════════════════════════
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'echo "=== TYPE CHECK ===" && (npx tsc --noEmit 2>&1) | head -30',
      },
    }

    // Generator returns → Freebuff calls end_turn automatically.
  }
}
