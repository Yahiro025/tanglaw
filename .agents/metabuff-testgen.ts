/**
 * MetaBuff TestGen — Test Generation Specialist
 * ───────────────────────────────────────────────
 * Generates comprehensive test coverage for code changed during a MetaBuff
 * pipeline run. Understands the project's existing test patterns and writes
 * tests in the same style rather than inventing a new approach.
 *
 *   • Unit tests for changed functions and classes
 *   • Integration tests for changed API endpoints
 *   • Edge case coverage (null, empty, boundary, error paths)
 *   • Mock/stub generation for external dependencies
 *   • Snapshot tests for UI components (React, Vue)
 *
 * Spawned by metabuff-mega for the 'testgen' subtask category.
 * Can also be spawned directly for test coverage work.
 */

import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'metabuff-testgen',
  version: '1.0.0',
  displayName: 'MetaBuff Test Generator',

  spawnerPrompt:
    'Spawn to generate tests for changed or new code. ' +
    'Writes unit tests, integration tests, and edge-case coverage ' +
    'matching the project\'s existing test style.',

  model: resolveModel(),

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'medium',
  },

  toolNames: [
    'read_files',
    'code_search',
    'find_files',
    'write_file',
    'str_replace',
    'run_terminal_command',
    'end_turn',
    'think_deeply',
  ],

  spawnableAgents: [],

  systemPrompt: `You are MetaBuff's test generation specialist.
You write tests that actually catch bugs — not tests that just exercise the happy path.

TESTING PHILOSOPHY:
  • Test behavior, not implementation — tests should survive refactors
  • Cover the contract (public API), not the internals
  • Every non-trivial function needs: happy path, error path, edge cases
  • Mocks should be minimal — over-mocking makes tests useless
  • Test names should read like specifications: "should return 404 when user not found"

COVERAGE TARGETS (aim for):
  • All public functions/methods: at least happy + error path
  • All API endpoints: valid input, invalid input, unauthorized, not found
  • All data transformations: identity, empty, boundary values
  • All state machines: all transitions + invalid transitions

MATCHING EXISTING STYLE:
  Before writing any test, read 2-3 existing test files to understand:
  - The test framework (Jest, Vitest, pytest, Go testing, etc.)
  - The assertion style (expect().toBe vs assert.equal vs t.Equal)
  - How mocks/stubs are set up (jest.mock, vi.mock, sinon, etc.)
  - How async is handled (async/await, done callbacks, etc.)
  - File naming convention (*.test.ts, *.spec.ts, _test.go, test_*.py)

NEVER:
  • Write tests that test implementation details (private methods, internal state)
  • Write tests that always pass regardless of the code
  • Copy the function's logic into the test
  • Leave empty test bodies or pending tests in the final output`,

  instructionsPrompt: `
For your test generation subtask:

1. Discover the test setup:
   - Use file_picker or glob to locate existing test files (e.g., glob("**/*.test.ts") for TypeScript, glob("**/test_*.py") for Python)
   - Read 2-3 representative test files to learn the testing style
   - Check package.json for the test runner and any test utilities
   - Look for test helpers, factories, or fixtures

2. Find the code that needs tests:
   - Read all changed/new source files
   - List every public function, class, and API endpoint they contain

3. For each item that needs tests:
   A. Check if a test file already exists — if so, ADD to it
   B. If not, create a new test file following the naming convention
   C. Write tests in this order:
      - Happy path (typical correct usage)
      - Error/edge cases (null, empty, invalid types, out-of-range)
      - Boundary conditions (max length, zero, negative numbers)
      - Concurrent access (if relevant)

4. Run the tests immediately after writing them:
   npx vitest run [your-test-file] 2>&1 | tail -30
   OR: npx jest [your-test-file] 2>&1 | tail -30
   OR: bun test [your-test-file] 2>&1 | tail -30

5. Fix any test failures before calling end_turn:
   - If the test is wrong, fix the test
   - If the SOURCE CODE is wrong, fix the source code and report it
   - All tests must pass before you finish`,

  handleSteps: function* ({ prompt }) {
    const promptKeywords = prompt.toLowerCase().match(/[a-z]{4,}/g)
      ?.filter(w => !['this','that','with','from','have','will','your','into','when','them','they','what','file','code','make','want','need','just','like','some','more','then','also','than','even','only','over'].includes(w))
      ?.slice(0, 6) ?? ['test', 'spec', 'function', 'export']
    yield {
      toolName: 'code_search',
      input: { searchQueries: [{ pattern: promptKeywords.join('|'), flags: '-g *.test.ts -g *.spec.ts -g *.test.tsx', maxResults: 10 }] },
    }
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `Test generation task: ${prompt}. Read 2-3 existing test files to match project style. Plan your test files covering happy path, error paths, edge cases.`,
      },
    }
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `Write tests for: ${prompt}. Use write_file for new test files, str_replace to add to existing ones. Run each test as you write it.`,
      },
    }
    yield {
      toolName: 'run_terminal_command',
      input: { command: 'echo "=== RUN TESTS ===" && (bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -30' },
    }
  },
}

export default definition
