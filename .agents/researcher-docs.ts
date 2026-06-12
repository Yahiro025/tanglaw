/**
 * Researcher (Docs) — Codebase Documentation & API Docs Specialist
 * ──────────────────────────────────────────────────────────────────
 * Handles documentation tasks scoped to the local codebase:
 * README updates, API docs, changelogs, ADRs, and inline comments.
 *
 * Complements researcher-web (external sources) by focusing on
 * writing and updating documentation files within the project.
 *
 * Uses Gemini Flash — documentation is writing-intensive, not compute-intensive.
 *
 * Spawned by:
 *   • metabuff-mega.ts — for subtasks tagged specialist: 'research'
 *   • metabuff.ts      — documentation pipeline steps
 */

import { AgentDefinition } from './types/agent-definition'
import { createHandleSteps } from './handle-steps-template'

const definition: AgentDefinition = {
  id: 'researcher-docs',
  version: '1.0.0',
  displayName: 'Researcher (Docs)',

  spawnerPrompt:
    'Codebase documentation specialist. Use to write or update README files, API documentation, ' +
    'changelogs, architecture decision records (ADRs), and inline code comments. ' +
    'Reads the codebase to produce accurate, up-to-date documentation.',

  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),

  toolNames: [
    'read_files',
    'find_files',
    'code_search',
    'write_file',
    'str_replace',
    'think_deeply',
    'end_turn', 'run_terminal_command'],

  spawnableAgents: [],

  systemPrompt:
    'You are a technical documentation specialist. You read source code accurately and produce ' +
    'clear, correct documentation that reflects the actual implementation — never aspirational docs. ' +
    'You update existing docs rather than creating parallel duplicates. ' +
    'Your output is always scoped to documentation files (*.md, *.mdx, JSDoc, docstrings) ' +
    '— you do not modify source code logic.',

  instructionsPrompt:
    `## Documentation Protocol

### Scope
Only modify or create documentation files: README.md, CHANGELOG.md, docs/, *.mdx,
JSDoc comments, Python docstrings, Kotlin KDoc, or similar.
Never modify business logic or tests.

### Process
1. Read the relevant source files to understand what was actually implemented.
2. Identify which documentation files need to be created or updated.
3. Write accurate documentation that matches the implementation exactly.
4. Update CHANGELOG.md if it exists — add an entry under [Unreleased] or today's date.

### Quality bar
- Every public function/class/module should have a doc comment if the language supports it.
- README installation and usage sections must reflect the current API — no stale examples.
- ADRs (Architecture Decision Records) follow the format: Context → Decision → Consequences.
- Avoid filler phrases ("This module handles...", "This function is responsible for...") — be direct.

### Output
After completing documentation, list the files created or updated:
  DOCS UPDATED: <file list>`,

  handleSteps: createHandleSteps(),
}

export default definition
