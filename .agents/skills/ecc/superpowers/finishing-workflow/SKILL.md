# Finishing Workflow — Structured Branch Completion

> **Applied in**: MetaBuff validator post-pipeline (all tiers)

## Core Principle

**Never leave a branch in an undefined state.** Every development session must end with a deliberate, verified completion choice.

## Completion Checklist

Before finishing, verify EVERY item:

```
FINISHING CHECKLIST:

  □ TESTS PASS: Full project test suite passes (bun test / npx jest / pytest)
  □ TYPECHECK: No TypeScript/compiler errors (bun run typecheck / tsc --noEmit)
  □ NO TODOS: No TODO, FIXME, HACK, or placeholder comments remain
  □ IMPORTS VERIFIED: Every import resolves to an existing module
  □ NO DEAD CODE: No unused variables, imports, or functions
  □ EDGE CASES: Explicitly verified at least 3 edge cases
  □ DESIGN DOC: Design document matches final implementation
  □ REGEX SAFE: All regex patterns validated by regex-guard
  □ GIT STATUS CLEAN: All changes are staged or committed
  □ BRANCH UP TO DATE: No merge conflicts with base branch
```

## Structured Completion Options

After verification, choose exactly ONE:

### Option A: Merge (Ready)
```
✅ All checks pass → Ready to merge

  git add .
  git commit -m "[final commit message]"
  git checkout main
  git merge --no-ff [branch]
  git push origin main
  git branch -d [branch]
```

### Option B: Create PR (Needs Review)
```
⚠ Some checks pass, but human review needed

  git add .
  git commit -m "[draft commit message]"
  git push origin [branch]
  # Create PR on GitHub/GitLab with:
  #   - Link to design document
  #   - Summary of changes
  #   - Test results
  #   - Known limitations
```

### Option C: Keep Branch (Work in Progress)
```
⏳ More work needed → Keep branch alive

  git add .
  git commit -m "WIP: [description of current state]"
  git push origin [branch]
  # Document what remains to be done in the commit message

  REMAINING WORK:
    • [Item 1]
    • [Item 2]
```

### Option D: Discard (Not Worth Keeping)
```
❌ Experimental / wrong approach → Discard cleanly

  git checkout main
  git branch -D [branch]
  # Document what was learned in a note or ADR
```

## Workspace Detection

MetaBuff's validator auto-detects the workspace type and adapts the finishing workflow:

| Workspace Type | Detection Signal | Adapted Behavior |
|----|----|----|
| Git repo | `.git/` exists | Full git-based finishing workflow |
| Non-git project | No `.git/` | Skip git steps; verify files only |
| Monorepo | Multiple `package.json` | Check each sub-project independently |
| Clean (no changes) | `git status --porcelain` is empty | Report: "No changes to finish" |

## Integration with MetaBuff Validator (v1.2.0)

The validator now includes a FINISHING phase after its standard audit:

```
VALIDATOR FLOW (enhanced with finishing workflow):

  1. Standard audit (ghost imports, phantom edits, broken tests, TODOs, regex)
  2. [NEW] Finishing Verification:
     a. Run full test suite → report pass/fail
     b. Run typecheck → report pass/fail
     c. Check for remaining TODOs/FIXMEs → report count
     d. Detect workspace type
     e. Present structured completion options
```

## Anti-Patterns

✗ Ending a session without running the full test suite
✗ Leaving a branch with uncommitted changes
✗ Merging without verifying tests pass
✗ Keeping stale branches indefinitely
✗ "I'll clean this up later" (Iron Law: finish discipline prevents technical debt)
