# TDD Iron Law — Red-Green-Refactor

> **Applied in**: All MetaBuff pipelines when testing domain is detected
> **Enforced by**: ecc-tdd-guide + skill injection + pipeline verification

## The Iron Law

**Production code SHALL NOT be written without a prior, failing test that demonstrates the desired behavior.**

This is non-negotiable. Violations are bugs waiting to happen.

## The Cycle

```
┌──────────────────────────────────────────┐
│           TDD IRON LAW CYCLE             │
│                                          │
│   RED      →    GREEN    →   REFACTOR    │
│   │              │              │        │
│   └── mandatory ─┴── mandatory ─┘        │
│         (no code before RED)             │
└──────────────────────────────────────────┘
```

### RED Phase

1. Write a test that specifies the desired behavior
2. The test must FAIL (confirm it fails for the right reason)
3. The test name should document the behavior:
   ```
   ✓ "returns empty array when input is null"
   ✓ "throws ValidationError when email format is invalid"
   ✓ "handles concurrent writes without data loss"
   ```

**Rule**: If the test passes before writing implementation code, the test is wrong.

### GREEN Phase

1. Write the MINIMAL code to make the test pass
2. Do NOT write code for future requirements
3. Do NOT optimize prematurely
4. Hard-coding the expected value is acceptable if it makes the test pass
5. Run ALL tests — make sure nothing else broke

**Rule**: If you wrote more code than needed to pass the test, you violated the Iron Law.

### REFACTOR Phase

1. Clean up the code WHILE ALL TESTS STAY GREEN
2. Remove duplication
3. Improve names
4. Extract helpers
5. Do NOT add new behavior during refactoring

**Rule**: If any test goes red during refactoring, revert to the last green state and try again.

## Enforcement in MetaBuff

### Detecting TDD Tasks

MetaBuff's orchestrator detects TDD tasks via keyword matching:
- "test", "tests", "testing", "tdd", "test-driven"
- "write tests", "add tests", "test coverage"
- "red green refactor"

When detected, routes to `ecc-tdd-guide` with Iron Law enforcement injected.

### Pipeline Verification

After any implementation, the validator checks:
```
TDD VERIFICATION:
  □ Are there tests for the new/changed behavior?
  □ Do tests cover edge cases (empty input, error paths, boundaries)?
  □ Were tests committed BEFORE or WITH the implementation?
  □ Does removing the implementation code cause those tests to FAIL?
```

### What Counts as a Test

✓ Unit test with clear assertions
✓ Integration test that exercises the new behavior
✓ Type-level test (e.g., `expectTypeOf<T>(...).toEqualTypeOf<U>()`)
✓ Snapshot test (when behavior is visual/output-based)

✗ A console.log in the implementation (not a test)
✗ Manual testing instructions in a comment (not automated)
✗ "Trust me, it works" (not evidence)

## When Tests Can't Be Written First

Some tasks make TDD impractical upfront (UI layout experiments, exploratory data analysis).
In these cases:

1. **Declare the exception explicitly**:
   ```
   ⚠ TDD EXCEPTION: [reason — e.g., exploratory UI prototyping]
   ACCEPTANCE CRITERIA: [specific, verifiable criteria]
   ```
2. Write tests IMMEDIATELY after confirming the approach works
3. The validator will flag missing tests but accept the declared exception

## Anti-Patterns

✗ Writing implementation first, then tests to "verify" it works
✗ Tests that don't assert anything meaningful (`expect(true).toBe(true)`)
✗ Skipping the RED phase ("the test will pass, I'm sure")
✗ Tests that are copies of the implementation (tautological tests)
✗ "I'll add tests later" (Iron Law says: no, you won't)
