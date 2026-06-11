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
  ],

  handleSteps: function* ({ prompt }) {
    // [MetaBuff: Arch] v1.1.0 — orient, discover, read, design, implement, verify

    // Phase 0: ORIENT — understand the architecture task
    yield { toolName: 'think_deeply', input: { thought: `Architecture task: ${prompt}. Read the existing architecture first — find schema files, API routes, component structure, type definitions. Identify what exists before proposing changes. NEVER write code before understanding the codebase.` } }

    // Phase 1: DISCOVER — search for existing architecture patterns
    yield {
      toolName: 'code_search',
      input: {
        searchQueries: [
          { pattern: 'interface|type\\s+\\w+|Schema|export\\s+(const|function|class|interface|type)', flags: '-g *.ts', maxResults: 10 },
          { pattern: prompt.match(/\b[A-Z][a-zA-Z]+\b/g)?.join('|') ?? 'Component', flags: '-g *.ts -g *.tsx', maxResults: 8 },
        ],
      },
    }

    // Phase 2: READ — load discovered architecture files
    const archFiles = prompt.match(/[\w.\/-]+\.(ts|tsx|js|prisma)/g) ?? []
    const archPaths = [...new Set([...archFiles, 'backend/prisma/schema.prisma', 'frontend/package.json', 'backend/package.json'])].slice(0, 8)
    yield { toolName: 'read_files', input: { paths: archPaths } }

    // Phase 3: DESIGN — formulate architecture changes
    yield { toolName: 'think_deeply', input: { thought: `Design changes for: ${prompt}. Based on the code you just read, define types first, then interfaces, then implementations. Verify no circular imports. Use code_search to verify every import exists. Produce an ADR-style design.` } }

    // Phase 4: IMPLEMENT — apply architectural changes
    yield { toolName: 'think_deeply', input: { thought: `Implement your architecture design. Use str_replace for surgical edits — create/update type files first, then update interfaces, then update implementations. Add JSDoc comments to all public types.` } }

    // Phase 5: VERIFY
    yield { toolName: 'run_terminal_command', input: { command: 'echo "=== TYPE CHECK ===" && (npx tsc --noEmit 2>&1) | head -30' } }
  },

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
   - code_search for every new type you defined to make sure it's used correctly
   - Make sure no circular imports were introduced (check imports in changed files)`,

  stepPrompt:
    'Continue the architectural work. ' +
    'If you have completed the design and implementation, verify consistency and call end_turn.',
}

export default definition
