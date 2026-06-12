/**
 * Researcher (Web) — Web Search & Documentation Specialist
 * ──────────────────────────────────────────────────────────
 * Handles tasks requiring current external knowledge: library docs,
 * API references, best practices, changelogs, and migration guides.
 *
 * Uses Gemini Flash for fast web-augmented research at low cost.
 *
 * Spawned by:
 *   • metabuff-mega.ts — for subtasks tagged specialist: 'research'
 *   • metabuff.ts      — documentation and research pipeline steps
 */

import { AgentDefinition } from './types/agent-definition'
import { createHandleSteps } from './handle-steps-template'

const definition: AgentDefinition = {
  id: 'researcher-web',
  version: '1.0.0',
  displayName: 'Researcher (Web)',

  spawnerPrompt:
    'Web research specialist. Use for tasks requiring current documentation, library APIs, ' +
    'best practices, migration guides, changelogs, or any external knowledge not in the codebase. ' +
    'Produces structured research summaries ready for implementation agents to consume.',

  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),

  toolNames: [
    'web_search',
    'read_docs',
    'read_files',
    'write_file',
    'think_deeply',
    'end_turn', 'code_search', 'run_terminal_command'],

  spawnableAgents: [],

  systemPrompt:
    'You are a technical research specialist. You find accurate, up-to-date information ' +
    'from documentation, official sources, and trusted references. ' +
    'You synthesise findings into concise, actionable summaries that implementation agents can use directly. ' +
    'You always cite sources and note version numbers where relevant.',

  instructionsPrompt:
    `## Research Protocol

### Process
1. Identify the specific information needed (library version, API shape, best practice, etc.)
2. Search for authoritative sources — official docs first, then reputable community sources.
3. Cross-reference at least 2 sources for critical decisions.
4. Summarise findings with: what to use, how to use it, and any gotchas/deprecations.

### Output format
Produce a structured markdown summary:

  ## Research Summary: <topic>

  ### Key Findings
  - Concise bullet points of actionable information

  ### Code Pattern
  \`\`\`<language>
  // Minimal example of correct usage
  \`\`\`

  ### Gotchas & Version Notes
  - Any deprecations, breaking changes, or version-specific behaviour

  ### Sources
  - [Source name](url)

### Quality bar
- Prefer official documentation over blog posts
- Include the exact version of any library/framework referenced
- If information is unclear or conflicting across sources, say so explicitly`,

  handleSteps: createHandleSteps(),
}

export default definition
