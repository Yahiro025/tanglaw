# ADR-001: F1 Task-Drift Guardrail — Runtime Enforcement Layer

**Status**: Implemented  
**Date**: 2026-06-14  
**Author**: Buffy (MetaBuff orchestrator)

---

## Context

The F1 Task-Drift Guardrail was originally defined as a **prompt-level preamble** prepended to reasoning agent spawn directives. It instructed agents like `metabuff-reasoner`, `thinker-gpt`, `thinker-with-files-gemini`, and `metabuff-arch` to stay on task and avoid calling tools.

### The Failure

On 2026-06-14, a live demonstration showed:

1. **`metabuff-reasoner`** received the F1 preamble with explicit instructions ("Do NOT call terminal commands, search the codebase, read files, or edit files") — then immediately called `npx tsc --noEmit` and attempted `code_search`.
2. **`metabuff-arch`** repeated the same pattern — same preamble, same drift, same tool misuse.

The preamble was fully ignored in both cases. The agent harness routed the tool calls to execution without any awareness that a reasoning agent should be constrained.

### Root Cause

The F1 guardrail existed only at the **prompt layer** — a suggestion the agent could choose to ignore. The **tool dispatch layer** had no classification logic, no allowlist, and no enforcement mechanism. The result: the guardrail was advisory, not binding.

---

## Decision

Implement a **system-level runtime enforcement layer** — the Tool-Access Gate (TAG) — that sits between an agent's intent to call a tool and the actual tool execution.

### Architecture

```
┌─────────────────────────────────────────────┐
│              Agent Tool Request             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          STEP 1: CLASSIFICATION             │
│                                             │
│   Is this agent_type in the reasoning set?  │
│   • metabuff-reasoner                       │
│   • thinker-gpt                             │
│   • thinker-with-files-gemini              │
│   • metabuff-arch                           │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
   ┌──────────────┐  ┌──────────────┐
   │  REASONING   │  │   ACTION     │
   │   AGENT      │  │   AGENT      │
   └──────┬───────┘  └──────┬───────┘
          │                 │
          ▼                 ▼
   ┌──────────────┐  ┌──────────────┐
   │STEP 2: CHECK │  │   FULL       │
   │  ALLOWLIST   │  │   ACCESS     │
   │              │  │              │
   │ Allowed:     │  │ All tools    │
   │ • set_output │  │ unrestricted │
   └──────┬───────┘  └──────────────┘
          │
   ┌──────┴──────┐
   │  BLOCKED?   │
   └──┬──────┬───┘
      ▼      ▼
  ┌────────┐ ┌──────────┐
  │ EXECUTE│ │RETURN F1 │
  │ TOOL   │ │  ERROR   │
  └────────┘ │ + ABORT  │
             └──────────┘
```

### Spawn Prevention (Anti-Bypass)

A reasoning agent could bypass the tool gate by spawning a sub-agent with full tool access (e.g., spawn a `basher` and ask it to run `rm -rf`). To close this:

```
┌─────────────────────────────────────────────┐
│          STEP 3: SPAWN CHECK               │
│                                             │
│   Is parent_agent_type in reasoning set?    │
│                                             │
│   YES → Block spawn, return F1 error       │
│   NO  → Allow spawn normally               │
└─────────────────────────────────────────────┘
```

### Gate Pseudocode

```typescript
const F1_CONFIG = {
  reasoningAgentPrefixes: [
    "metabuff-reasoner",
    "thinker-gpt",
    "thinker-with-files-gemini",
    "metabuff-arch",
  ],
  allowedTools: ["set_output"],
  autoTerminateOnViolation: true,
  blockAllSpawns: true,
};

function isReasoningAgent(agentType: string): boolean {
  return F1_CONFIG.reasoningAgentPrefixes.some(
    (prefix) => agentType.startsWith(prefix)
  );
}

function dispatchToolCall(
  agentType: string,
  toolName: string,
  params: unknown
): ToolResult {
  if (!isReasoningAgent(agentType)) {
    return executeTool(agentType, toolName, params);
  }

  if (F1_CONFIG.allowedTools.includes(toolName)) {
    return executeTool(agentType, toolName, params);
  }

  // Block the call and optionally terminate
  if (F1_CONFIG.autoTerminateOnViolation) {
    terminateAgentSession(agentType);
  }

  return {
    status: "blocked",
    error: `[F1 GUARD] Tool '${toolName}' is blocked for reasoning agents (${agentType}).`,
    guardrail: "F1",
  };
}

function dispatchAgentSpawn(
  parentAgentType: string,
  childAgentType: string,
  prompt: string
): SpawnResult {
  if (!isReasoningAgent(parentAgentType)) {
    return executeSpawn(parentAgentType, childAgentType, prompt);
  }

  return {
    status: "blocked",
    error: `[F1 GUARD] Reasoning agents (${parentAgentType}) may not spawn sub-agents.`,
    guardrail: "F1",
  };
}
```

---

## Configuration

The enforcement configuration lives in `.impeccable/live/f1-guard.json`, following the same schema pattern as the existing `.impeccable/live/config.json`.

```json
{
  "schemaVersion": 1,
  "guardrail": "F1",
  "enabled": true,
  "reasoningAgentPrefixes": [
    "metabuff-reasoner",
    "thinker-gpt",
    "thinker-with-files-gemini",
    "metabuff-arch"
  ],
  "allowedTools": ["set_output"],
  "autoTerminateOnViolation": true,
  "blockAllSpawns": true,
  "failOpenOnError": false,
  "logViolations": true
}
```

---

## Consequences

### Positive

- **Runtime enforcement** — reasoning agents physically cannot call blocked tools
- **Bypass-proof** — sub-agent spawn is also blocked for reasoning agents
- **Configurable** — prefix list, allowlist, and behavior flags are in a JSON config
- **Auditable** — violations are logged when `logViolations: true`
- **Fail-close** — when `failOpenOnError: false`, any error in the gate logic blocks the call (safe default)

### Negative

- **False positive risk** — if an agent type is misclassified as reasoning, its tools will be blocked
- **Maintenance burden** — new reasoning agent types must be added to `reasoningAgentPrefixes`
- **Cannot enforce at the prompt generation layer** — the gate can only block tool calls, not prevent the agent from *intending* to call them (but this is acceptable — blocking execution is what matters)

### Mitigations

- `failOpenOnError: false` is the safe default — if the gate itself errors, the call is blocked
- Agent type prefixes are matched with `startsWith`, not exact match, to catch versioned variants
- Unclassified agents default to **unrestricted access** (fail open by default) — only known reasoning prefixes trigger the gate

---

## Verification Strategy

| Test | Method | Expected |
|------|--------|----------|
| Unit: tool blocked | Stub dispatchToolCall with a reasoning agent type and a disallowed tool | Returns `status: "blocked"` |
| Unit: tool allowed | Stub dispatchToolCall with a reasoning agent type and `set_output` | Returns `status: "executed"` |
| Unit: spawn blocked | Stub dispatchAgentSpawn with a reasoning parent | Returns `status: "blocked"` |
| Unit: action agent unaffected | Stub dispatchToolCall with a `basher` agent type | Returns `status: "executed"` |
| Integration: live test | Spawn `metabuff-reasoner`, attempt a command | Session terminates with F1 error |
| Integration: bypass test | Spawn `metabuff-reasoner`, attempt to spawn basher | Spawn returns F1 error |

---

## Related Documents

- `knowledge.md` — F1 guardrail definition (updated to reference this ADR)
- `.impeccable/live/f1-guard.json` — Runtime enforcement configuration
