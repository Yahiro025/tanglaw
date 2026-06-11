# Superpowers Methodology — Integrated into MetaBuff

> **Source**: [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent
> **Integration**: Tailored for MetaBuff's agent orchestration system
> **Version**: 1.0.0

## What This Is

Superpowers is a structured methodology for AI coding agents that enforces rigorous
software engineering processes. This integration adapts its core principles to MetaBuff's
existing agent pipeline:

- **Brainstorming Gate** → Enhanced CoT v3: Design doc before implementation
- **Writing Plans** → Granular, checkbox-formatted plans with no placeholders
- **Subagent-Driven Development (SDD)** → Two-stage review per task in mega pipeline
- **TDD Iron Law** → No production code without a failing test
- **Formalized Code Review** → SHA-bounded, no performative agreement, verify-before-implement
- **Finishing Workflow** → Structured completion: verify → choose merge/PR/keep/discard

## Core Philosophy

```
QUESTION → DESIGN → PLAN → IMPLEMENT (TDD) → REVIEW → FINISH
   ↑                                              ↓
   └────────── CRITICAL FEEDBACK ONLY ←───────────┘
```

1. **No action without a plan.** Implementation is the LAST step in a chain of deliberation.
2. **Tests are not optional.** The TDD Iron Law: red → green → refactor, always.
3. **Reviews block progress.** Critical feedback must be resolved before advancing.
4. **Subagents are disposable.** Each subagent gets exactly one task, fresh context, no baggage.
5. **Finishing is deliberate.** Choose merge, PR, keep, or discard — never leave a branch dangling.

## How MetaBuff Integrates This

| Superpowers Concept | MetaBuff Implementation |
|----|----|
| Brainstorming Gate | CoT v3 STEP 0: mandatory design doc for complex/mega tasks |
| Writing Plans | Enhanced planner prompts: checkbox format, no placeholders |
| SDD | Mega pipeline: two-stage review (spec compliance → code quality) |
| TDD Iron Law | Skill injection into ecc-tdd-guide + pipeline enforcement |
| Formalized Review | Enhanced review protocol: SHA-bounded, verify-before-implement |
| Finishing Workflow | Validator v1.2.0: project-wide test verification + structured completion |
| Session-start Hooks | hooks.json: auto-inject superpowers methodology on session start |

## Skill Files

- `brainstorming-gate/` — Design doc gate before any implementation
- `sdd-methodology/` — Subagent-Driven Development with two-stage review
- `tdd-iron-law/` — Red-Green-Refactor as non-negotiable workflow
- `formalized-code-review/` — SHA-bounded review with no performative agreement
- `finishing-workflow/` — Structured branch completion verification
- `writing-plans/` — Granular, executable plans with no placeholders
