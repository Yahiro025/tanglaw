# Writing Plans — Granular, Executable, No Placeholders

> **Applied in**: ecc-planner, meta planner routing, CoT v3 STEP 3 (PLAN)

## Core Rule

**Every plan item must be a concretely executable step. No placeholders. No "TBD".**

If a step says "implement authentication", it's not a plan — it's a wish.

## Plan Format (Required)

```
IMPLEMENTATION PLAN: [task name]

DEPENDENCIES:
  • [dependency 1] must complete before [dependent task]
  • [dependency 2] blocks [dependent task]

  ─── PHASE 1: Foundation ───

  - [ ] 1. [explicit action with specific file and expected change]
         → Creates/modifies: [file path]
         → Command: [exact command if applicable]
         → Verification: [how to verify this step succeeded]

  - [ ] 2. [next explicit action]
         → Creates/modifies: [file path]
         → Verification: [test or check]

  ─── PHASE 2: Core Implementation ───

  - [ ] 3. ...
  ...

  ─── PHASE N: Verification & Polish ───

  - [ ] N-1. Run full test suite
         → Command: bun test
         → Expected: all tests pass

  - [ ] N. Run typecheck
         → Command: bun run typecheck
         → Expected: no errors
```

## Plan Requirements

### Each Step Must Include:

1. **Specific file path** — which file(s) are modified/created
2. **Expected change** — what exactly changes (not "improve", but "add parameter `timeout: number`")
3. **Verification method** — how to confirm the step worked
4. **Dependencies** — which other steps must complete first

### Prohibited in Plans:

✗ "TBD" — every section must be complete
✗ "Implement X" without specifying files, interfaces, or approach
✗ "Add tests" without specifying what behaviors are tested
✗ "Refactor" without specifying what changes and why
✗ "Clean up" without specifying what is being cleaned
✗ Placeholder code comments like `// TODO: implement this`

### Plan Sizing

- Each step should be completable in 2–5 minutes
- If a step takes longer, it should be decomposed further
- Maximum 12 steps per plan (matching MAX_DECOMP_TASKS)
- Minimum 3 steps per plan (even simple tasks need structure)

## Plan Validation

Before executing any plan step, validate:

```
PLAN VALIDATION CHECKLIST:
  □ Every step references specific files
  □ Every step has a verification method
  □ No steps contain "TBD" or "TODO"
  □ Dependencies form a DAG (no cycles)
  □ Phase ordering respects dependencies
  □ Foundation work (types, schemas) precedes implementation
  □ Verification steps are in the final phase
  □ Total plan fits within 12 steps
```

## Plan = Contract

Once written, the plan becomes a contract between the agent and the pipeline:

1. **Deviations must be documented**: if a step needs to change, update the plan first
2. **Unfinished steps block completion**: the finishing workflow checks plan completeness
3. **Verification gates are mandatory**: no step is "done" until its verification passes

## Integration with CoT v3

In CoT v3, STEP 3 (PLAN) now requires:

```
STEP 3 — PLAN (enhanced with Superpowers writing-plans methodology)

  After completing STEP 0 (BRAINSTORM) and STEP 2 (GROUND):
  1. Write your plan in the checkbox format above
  2. VALIDATE the plan against the checklist
  3. Confirm: no TODOs, no placeholders, every step is executable
  4. If uncertain about any step:
     ⚠ UNCERTAIN: [specific question about a step]
     Resolve with a tool call BEFORE proceeding to EXECUTE
```
