# Verify-Iterate — Run → Inspect → Fix → Re-verify Loop

> **Adapted from**: Anthropic Skills verification cycle methodology  
> **Metabuff-Tailored**: Integrated into CoT v3 STEP 5 (VERIFY) and validator pipeline

## Core Principle

**Never ship on the first attempt.** Every change must pass through a verification loop
before being considered complete. The loop catches:
- Typos and syntax errors (caught at compile/run time)
- Logic errors (caught by test assertions)
- Integration issues (caught by typecheck + test suite)
- Visual regressions (caught by screenshot comparison)
- Accessibility regressions (caught by a11y audit)

## The Verify-Iterate Loop

```
┌─────────────────────────────────────────────┐
│           VERIFY-ITERATE LOOP               │
│                                             │
│   RUN: Execute the change (compile, test)   │
│     ↓                                       │
│   INSPECT: Examine results, find issues     │
│     ↓                                       │
│   FIX: Apply minimal, targeted fix          │
│     ↓                                       │
│   RE-VERIFY: Confirm fix resolved issue     │
│     ↓                                       │
│   No more issues? → MERGE READY             │
│     └── Issues remain? → Loop again ──────┘ │
│                                             │
│   MAX ITERATIONS: 3 (after 3 loops, flag    │
│   as ⚠ NEEDS REVIEW — human decision needed) │
└─────────────────────────────────────────────┘
```

## When to Apply

| Change Type | Verification Method | Iteration Target |
|---|---|---|
| New function | Unit test → typecheck → lint | 1 loop |
| API change | Integration test → typecheck → all tests | 1–2 loops |
| UI change | Screenshot compare → a11y audit → console check | 2–3 loops |
| Refactoring | Full test suite → typecheck → lint | 1–2 loops |
| Bug fix | Reproduction test → fix → full suite | 1–3 loops |

## Verification Checklist (per iteration)

```
VERIFICATION CHECKLIST (run EVERY iteration):

  □ COMPILE: Does the code build/typecheck without errors?
    Command: bun run typecheck || npx tsc --noEmit

  □ TESTS: Do all existing tests still pass?
    Command: bun test || npx vitest run || npx jest

  □ NEW TESTS: Do new behaviors have tests?
    Check: git diff HEAD --name-only → find test files for changed code

  □ LINT: Are there any lint warnings?
    Command: npx eslint --quiet [changed files]

  □ IMPORTS: Are all imports valid?
    Check: code_searcher for every new import

  □ TODOS: Any TODO/FIXME/HACK left behind?
    Check: grep -r "TODO\|FIXME\|HACK" [changed files]

  □ REGEX: Any regex patterns? → spawn metabuff-regex-guard
    Check: grep -E "/[^/]+/[gimsuy]*" [changed files]
```

## Anti-Patterns

### ❌ WRONG
- "It compiled, ship it" — compilation is the minimum bar, not the finish line
- Skipping test re-run after a fix ("the fix was tiny, what could go wrong?")
- Iterating more than 3 times without escalating ("the 4th attempt rarely succeeds")
- Fixing the test instead of the code (if the test is correct and code fails, fix the code)

### ✅ CORRECT
- Every fix is followed by re-running the FULL test suite (not just the failing test)
- After 2 iterations, reconsider the approach (maybe the test expectation is wrong)
- After 3 iterations, flag ⚠ NEEDS REVIEW and escalate
- Each iteration produces a concrete diff — no "I'll fix it in the next one"

## Integration with MetaBuff

- **CoT v3 STEP 5 (VERIFY)**: Agents run the verify-iterate loop before calling end_turn
- **metabuff-validator (v1.2.0)**: Runs full verification as part of finishing workflow
- **Mega pipeline**: Each wave's two-stage review includes verify-iterate checks
- **Instinct recording**: Each iteration's findings are recorded in known-issues.md
