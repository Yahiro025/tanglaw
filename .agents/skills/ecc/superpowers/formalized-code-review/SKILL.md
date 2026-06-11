# Formalized Code Review — SHA-Bounded, No Performative Agreement

> **Applied in**: All MetaBuff review agents (ecc-code-reviewer, ecc-*-reviewer, codebuff/reviewer)
> **Enforced by**: Enhanced review protocol in withReview() wrapper

## Core Principles

### 1. Review is Technically Scoped

Reviews are bounded by Git SHAs, not opinions. The reviewer examines what CHANGED,
not what they wish the codebase looked like.

```
REVIEW SCOPE:
  From: [base SHA or branch]
  To:   [current HEAD]
  Changes: [list of changed files from git diff]
```

### 2. No Performative Agreement

**PROHIBITED PHRASES** (immediate review invalidation):
- "Great point!" — acknowledge technically, not socially
- "Good catch!" — state what's wrong, not praise
- "Nice work!" — irrelevant to code correctness
- "LGTM!" — meaningless without verification
- "Looks good to me" — not evidence of review

**REQUIRED PHRASES** (replacements):
- "Verified: [specific claim about the code]"
- "Checked: [specific file/line] — [finding]"
- "Found: [issue] at [file:line]. Root cause: [analysis]"
- "Confirmed: [assertion] by running [test/check]"

### 3. Verify Before Implementing

When receiving a review suggestion:
1. First, reproduce/verify the claimed issue:
   - Run the test that demonstrates the failure
   - Trace the code path with the reviewer's inputs
   - Ask: "Can I prove this is actually a problem?"
2. THEN implement the fix
3. Re-verify that the fix resolves the issue without regressions

### 4. Technical Argumentation over Social Compromise

Disagreeing with a review is VALID and EXPECTED when technically justified:

```
ACCEPTABLE DISAGREEMENT:
  "I considered [reviewer's suggestion]. The reason I chose [alternative]
   is [technical justification]. Here's the test that validates my approach:
   [test]. Trade-off: [what we give up]."

UNACCEPTABLE DISAGREEMENT:
  "I think it's fine as-is."
  "That would be too much work."
  "Nobody will encounter that edge case."
```

## Review Checklist (Mandatory)

```
FORMAL REVIEW CHECKLIST:

  □ BOUNDING: Review is scoped to specific SHAs or file diffs
  □ IMPORTS: Every import is verified by code_searcher to exist
  □ TYPES: No `any` without explicit justification; types are correct
  □ ERRORS: All error paths are handled (no swallowed errors)
  □ EDGE CASES: Empty/null/undefined/boundary inputs are handled
  □ TESTS: New behavior has tests; tests would FAIL without the new code
  □ CONVENTIONS: Code follows existing project patterns
  □ PERFORMANCE: No N+1 queries, no unnecessary allocations in hot paths
  □ SECURITY: No injection, no hardcoded secrets, proper auth checks
  □ GHOST IMPORTS: No imports from non-existent modules
  □ REGEX SAFETY: Any regex patterns flagged for regex-guard

  FINAL: Review is READ-ONLY — reviewer does not re-implement
```

## Severity Levels

```
[CRITICAL] — Would cause runtime error, data loss, or security breach
  → BLOCK merge; must fix before any further progress

[HIGH]     — Would cause incorrect behavior or broken tests
  → Should fix before merging; may block if in critical path

[MEDIUM]   — Code quality issue, missing test, or convention violation
  → Should fix; can be addressed in immediate follow-up

[LOW]      — Style preference, naming suggestion, optional improvement
  → Consider; do not block merge for these
```

## Integration with MetaBuff

### Enhanced withReview() Protocol

The `withReview()` wrapper now includes formalized review instructions:

```
FORMALIZED REVIEW:
  • Scope your review to git diff changes only
  • Use only technically precise language — no performative praise
  • Verify every claim before asserting it
  • Tag findings with severity: [CRITICAL] [HIGH] [MEDIUM] [LOW]
  • Do NOT re-implement — provide actionable, specific feedback
  • After each finding: provide the test or trace that proves it
```

### Cross-Agent Review Integration

When the review involves output from multiple parallel agents (mega pipeline):
1. Verify no conflicting changes to the same file
2. Check interface consistency across agent outputs
3. Ensure integration points (shared types, APIs) are coherent
