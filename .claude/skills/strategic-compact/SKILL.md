---
name: strategic-compact
description: Context management for long TANGLAW development sessions — checkpoint patterns and compaction triggers
---

# Strategic Context Compaction for TANGLAW

Context compaction strategies for long development sessions on the TANGLAW monorepo.

## When to Activate

- During long coding sessions (10+ tool calls)
- After completing a major feature (e.g., a new dashboard page, API endpoint, or schema change)
- Before switching between frontend and backend work
- When context feels bloated with irrelevant conversation history

## Compaction Triggers

| Trigger | Action |
|---------|--------|
| Completed a feature | Compact before moving to next task |
| 15+ tool calls without pruning | Request context pruning |
| Switching FE ↔ BE | Compact current side before switching |
| Debugging a difficult issue | Keep debug context; compact surrounding noise |

## TANGLAW-Specific Checkpoints

```
Phase 1: Schema/Prisma changes
Phase 2: Backend API endpoints
Phase 3: Frontend components and pages
Phase 4: Integration and testing
Phase 5: Deployment configuration
```

## Using the Context Pruner Agent

The `context-pruner` agent can be spawned directly for automatic compaction:

```
Spawn context-pruner with params: {
  maxContextLength: <number>,      // Token limit for compacted context
  assistantToolBudget: <number>,    // Tool call budget to retain
  cacheExpiryMs: <number>          // Cache expiry in ms
}
```

Use this skill to decide when to trigger the `context-pruner` agent.
