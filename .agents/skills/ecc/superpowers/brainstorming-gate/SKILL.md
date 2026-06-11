# Brainstorming Gate — Design Before Implementation

> **Applied in**: CoT v3 STEP 0 (complex/mega pipelines), metabuff-reasoner pre-flight

## Core Rule

**NO CODE SHALL BE WRITTEN until a design document is authored, committed, and approved.**

This is a hard gate. Implementation begins only after the design passes review.

## Process

### 1. One Question at a Time

When the task is ambiguous or the scope is unclear:
- Ask ONE clarifying question
- Wait for the user's answer before asking another
- Accumulate answers into the design document
- Do NOT assume — every ambiguity is a question

### 2. Design Document (Mandatory)

Before writing ANY code, produce a design document covering:

```
DESIGN DOCUMENT: [task name]

GOAL:
  One-sentence statement of what this accomplishes.

SCOPE:
  ✅ In scope: [list]
  ❌ Out of scope: [list]

ASSUMPTIONS:
  • [Verified assumption 1]
  • [Verified assumption 2]
  • [⚠ Assumption to validate before implementation]

ARCHITECTURE:
  • Files to create: [list with roles]
  • Files to modify: [list with what changes]
  • Data flow: [describe]

CONSTRAINTS:
  • [Performance, compatibility, API contract, etc.]

EDGE CASES:
  • [What happens when input is empty?]
  • [What happens when it fails?]
  • [What are the boundaries?]

TEST STRATEGY (TDD Iron Law applies):
  • [What tests will be written FIRST?]
  • [What edge cases must pass?]

RISKS:
  • [Risk 1] → Mitigation: [plan]
  • [Risk 2] → Mitigation: [plan]
```

### 3. Transition Gate

Once the design document is complete:
1. Review it for completeness (no blank sections)
2. Commit it: `git add . && git commit -m "design: [task name]"`
3. **Only then** transition to implementation planning

## When This Applies

- **Complex pipeline**: CoT v3 enforces this gate before STEP 3 (PLAN)
- **Mega pipeline**: enforced before decomposition
- **Reasoner**: enforced as pre-flight before STEP 1 (UNDERSTAND)
- **Simple pipeline**: optional — applies when `isAmbiguousTask()` returns true

## Anti-Patterns (Prohibited)

✗ Starting implementation during brainstorming
✗ Filling design sections with "TBD" or placeholder text
✗ Skipping the commit step
✗ Proceeding with unresolved assumptions marked ⚠
✗ Writing code before answering all user clarification questions

## Transition Signal

When the design is complete and committed, signal transition with:
```
DESIGN COMPLETE → Transitioning to implementation planning.
```
