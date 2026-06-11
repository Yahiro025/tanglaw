# Skill Creator — AI-Assisted Skill Development

> **Adapted from**: [anthropics/skills/skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md)  
> **Metabuff-Tailored**: Integrated with skill hot-load cache and eval harness

## Purpose

Guide users through creating high-quality MetaBuff skills (or improving existing ones)
using a structured interview-and-iteration workflow with built-in evaluation benchmarks.

## Workflow

### Phase 1: Discovery Interview

Ask the user ONE question at a time to understand the skill they need:

```
1. "What specific task should this skill accomplish? Describe the input and desired output."
2. "What are 3 concrete examples of this task? (include edge cases)"
3. "What common mistakes should the skill prevent?"
4. "What tools, libraries, or APIs does the skill need access to?"
5. "What existing MetaBuff skills or agents could this complement?"
```

Wait for each answer before asking the next. Accumulate answers into a design brief.

### Phase 2: Skill Scaffolding

Create the skill directory structure:

```
.agents/skills/ecc/<skill-name>/
├── SKILL.md          # Required: YAML frontmatter + instructions
├── scripts/          # Optional: executable helpers (Python/Bash/JS)
├── references/       # Optional: documentation loaded as context
└── assets/           # Optional: templates, icons, configs
```

### Phase 3: Write SKILL.md

Use the standardized format:

```yaml
---
name: <skill-name>
description: >
  Clear description of WHEN this skill triggers and WHAT it accomplishes.
  Include trigger keywords that help the routing system match this skill.
---

# <Skill Title>

## Purpose
[One sentence describing what this skill does]

## When to Use
[Specific conditions/triggers that activate this skill]

## Instructions
[Step-by-step workflow — use imperative language]

## Anti-Patterns
### ❌ WRONG
[Common mistakes with concrete examples]

### ✅ CORRECT
[The right way with concrete examples]

## Verification
[How to confirm the skill worked correctly]
```

### Phase 4: Create Evaluation Benchmarks

Create 3–5 test cases in `.agents/skills/ecc/<skill-name>/eval/`:

```
eval/
├── case-1-input.md     # What the agent receives
├── case-1-expected.md  # What the agent should produce
├── case-2-input.md
├── case-2-expected.md
...
```

### Phase 5: Iterate with Eval Loop

```
┌─────────────────────────────────────┐
│         SKILL EVAL LOOP             │
│                                     │
│   RUN: Execute skill on test case   │
│     ↓                               │
│   EVAL: Compare output to expected  │
│     ↓                               │
│   SCORE: Pass/Fail per test case    │
│     ↓                               │
│   IMPROVE: Edit skill instructions  │
│     ↓                               │
│   RE-RUN: Verify improvement        │
│     └── Repeat until ≥80% pass ──┘  │
└─────────────────────────────────────┘
```

### Phase 6: Register and Cache

1. Rebuild the skill cache: `npx tsx scripts/ts/build-skill-cache.ts`
2. Record the new skill in known-issues.md as an instinct
3. Verify the skill is discoverable via keyword search

## Anti-Patterns (Skill Creator)

### ❌ WRONG
- Writing a skill without concrete examples
- Using vague descriptions ("handles documents")
- Skipping the eval loop ("I'm confident it works")
- Creating a skill that duplicates existing ECC/MetaBuff functionality

### ✅ CORRECT
- Every instruction references specific tools, file paths, or APIs
- Anti-patterns are illustrated with real code examples
- Eval cases cover happy path AND edge cases
- The skill name is discoverable (matches common user keywords)
