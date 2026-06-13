/**
 * MetaBuff Arch — Architecture Analyst Specialist
 * ─────────────────────────────────────────────────
 * Handles the architectural dimension of complex tasks:
 *   • System design and component decomposition
 *   • Data model design (schema, types, interfaces)
 *   • API contracts (REST, GraphQL, RPC definitions)
 *   • Dependency graphs and coupling analysis
 *   • Architectural decision records (ADRs)
 *
 * Spawned by metabuff-mega for the 'arch' subtask category.
 * Can also be spawned directly for design-only tasks.
 */

import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'metabuff-arch',
  version: '1.0.0',
  displayName: 'MetaBuff Architecture Analyst',

  spawnerPrompt:
    'Spawn for architecture concerns: data model design, API contract definition, ' +
    'component structure, dependency analysis, or system-level design decisions.',

  model: resolveModel(),

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'high',  // architecture needs the most careful reasoning
  },

  toolNames: [
    'read_files',
    'code_search',
    'find_files',
    'write_file',
    'str_replace',
    'run_terminal_command',
    'spawn_agents',
    'think_deeply',
    'end_turn',
  ],

  spawnableAgents: [
    'thinker-with-files-gemini',
    'researcher-web',
  ],

  systemPrompt: `You are MetaBuff's architecture specialist.
You think about systems before touching files.

YOUR FOCUS:
  • Data models: schemas, types, interfaces, DTOs, domain objects
  • API contracts: request/response shapes, route definitions, error formats
  • Component boundaries: what each module owns and doesn't own
  • Dependency direction: nothing in the core should import from infra
  • Extensibility: design for the next change, not just this one

ARCHITECTURE PRINCIPLES (apply unless codebase already contradicts them):
  • Single Responsibility: each file/module has one reason to change
  • Dependency Inversion: depend on abstractions, not concretions
  • Explicit over implicit: data shapes should be typed, not inferred as any
  • Co-locate tests with the code they test
  • Never use circular imports

HALLUCINATION PREVENTION:
  Read the existing architecture before proposing changes.
  Grep for patterns already in use — don't introduce a third way of doing something.`,

  instructionsPrompt: `
For your assigned architectural subtask:

1. Read the codebase architecture first:
   - Find and read existing type/interface/schema files
   - Find existing API route definitions
   - Check for any architecture.md, ADR folder, or design docs

2. Identify what already exists that you can extend (don't duplicate)

3. Design your changes:
   - Define all new types/interfaces first (no any, no unknown unless justified)
   - Specify API contracts as TypeScript types or OpenAPI-equivalent comments
   - Draw the component boundary explicitly in your plan

4. Implement:
   - Create/update type files first
   - Update interfaces before updating implementations
   - Add JSDoc comments to all public types you create

5. Verify consistency:
   - code_searcher for every new type you defined to make sure it's used correctly
   - Make sure no circular imports were introduced (check imports in changed files)`,

  handleSteps: function* ({ prompt }) {
    const promptKeywords = prompt.toLowerCase().match(/[a-z]{4,}/g)
      ?.filter(w => !['this','that','with','from','have','will','your','into','when','them','they','what','file','code','make','want','need','just','like','some','more','then','also','than','even','only','over','back','here','there','their','been','were','does','dont','should','would','could','change','update','every','other','same','such','very','much','many','well','still','down','first','last','next'].includes(w))
      ?.slice(0, 6) ?? ['schema', 'interface', 'type', 'component']
    const componentNames = prompt.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? []
    const searchTargets = [...promptKeywords, ...componentNames.slice(0, 4)]
    yield {
      toolName: 'code_search',
      input: { searchQueries: [{ pattern: searchTargets.join('|'), flags: '-g *.ts -g *.tsx', maxResults: 15 }] },
    }
    const filePatterns = prompt.match(/[\w.\/-]+\.(ts|tsx|js|jsx|json)/g) ?? []
    const configPaths = ['package.json', 'tsconfig.json']
    const paths = [...new Set([...filePatterns, ...configPaths])].filter(p => !p.startsWith('node_modules')).slice(0, 8)
    yield {
      toolName: 'read_files',
      input: { paths: paths.length > 0 ? paths : ['package.json'] },
    }
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `Architecture task: ${prompt}. You have discovered the codebase. Design changes — define types first, then interfaces, then implementations. Verify no circular imports. Use str_replace for targeted edits, write_file for new files.`,
      },
    }
    yield {
      toolName: 'run_terminal_command',
      input: { command: 'echo "=== TYPE CHECK ===" && (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30' },
    }
  },
}

export default definition
