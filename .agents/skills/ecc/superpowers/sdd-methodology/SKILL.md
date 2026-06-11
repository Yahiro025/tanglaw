# Subagent-Driven Development (SDD) — Two-Stage Review

> **Applied in**: MetaBuff Mega pipeline (inter-wave + synthesis review)

## Core Principle

**Every task gets a FRESH subagent with NO context baggage from previous work.**

Subagents are disposable. They receive exactly: the task description, the spec,
and relevant code context. They do ONE thing, then terminate.

## Two-Stage Review Protocol

### Stage 1: Spec Compliance Review (MANDATORY)

After a subagent completes its task, review against the SPECIFICATION:

```
SPEC COMPLIANCE CHECKLIST:
  □ Does the implementation match the task description EXACTLY?
  □ Are all acceptance criteria met?
  □ Does the output match the contract/interface defined in the spec?
  □ Are there any extra changes beyond the spec? (→ flag as scope creep)
  □ Does it handle the edge cases listed in the design document?

RESULT: PASSS / FAILS
  If FAILS → return to subagent with: "Spec mismatch: [specific finding]"
```

### Stage 2: Code Quality Review

Only after Stage 1 PASSES:

```
CODE QUALITY CHECKLIST:
  □ Are all imports valid and verified? (no ghost imports)
  □ Are there any TODOs, FIXMEs, or placeholder comments?
  □ Is error handling present for all failure modes?
  □ Are types explicit (no `any`, no `unknown` without justification)?
  □ Does it follow existing codebase conventions?
  □ Are there performance concerns (N+1 queries, unnecessary allocations)?
  □ Is there test coverage for the new/changed behavior?

RESULT: PASS ✓ / FAIL ✗
  If FAILS → return to subagent with severity-tagged issues:
    [CRITICAL] → block merge, must fix
    [MEDIUM]   → should fix before merge
    [LOW]      → can address in follow-up
```

## Context Isolation (Critical)

Each subagent receives ONLY:
1. The task description
2. The design document / spec
3. Relevant file contents (via read_files)
4. Anti-hallucination protocol instructions

Subagents MUST NOT:
- Access conversation history from other subagents
- Assume knowledge of work done in parallel
- Make changes to files not in their task scope
- Reference implementation details from other subtasks (they may be stale)

## Integration with MetaBuff Mega

```
MEGA PIPELINE (enhanced with SDD):

  Decompose → Wave 1 (≤6 agents)
    ↓
  [NEW] Stage 1 Review: Spec compliance for each Wave 1 agent
    ↓
  [NEW] Stage 2 Review: Code quality for Wave 1 agents' output
    ↓
  Wave 2 (≤6 agents, with verified Wave 1 context)
    ↓
  [NEW] Stage 1+2 Review for Wave 2 agents
    ↓
  Synthesis Review (cross-wave conflict detection)
    ↓
  Regex guard → Typecheck → Tests → Validator
```

## Anti-Patterns

✗ One subagent doing multiple subtasks (context pollution)
✗ Subagent reading conversation history from other subagents (stale context)
✗ Skipping Stage 1 review and going straight to code quality
✗ "Great point!" responses in review (Superpowers ban on performative agreement)
✗ Reviewers re-implementing instead of providing actionable feedback
