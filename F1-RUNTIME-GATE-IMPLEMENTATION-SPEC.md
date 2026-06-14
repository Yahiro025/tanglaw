# F1 Runtime Enforcement Gate — Harness Implementation Specification

**Status**: Draft (ready for implementation)  
**Date**: 2026-06-14  
**Target**: Codebuff CLI agent harness (tool dispatch layer)  

---

## 1. Problem Statement

The F1 Task-Drift Guardrail exists in two forms, both non-functional:

| Layer | What Exists | Why It Fails |
|-------|-------------|--------------|
| **Prompt-level preamble** | Task-verification block + self-abort clause prepended to reasoning agent spawn prompts | Agents fully ignore the preamble and call tools anyway |
| **Runtime config** | `.impeccable/live/f1-guard.json` spec specifying that reasoning agents may only call `set_output` | The harness never reads or enforces this config — tool calls go through to execution unchecked |

**Verified failures** (tested 2026-06-14):  
`metabuff-reasoner` was spawned with explicit "Do NOT call tools" instructions. It immediately called `run_terminal_command` and `code_search`. The preamble was ignored. The runtime gate did not intervene. This was repeated across 3 independent tests with identical results.

---

## 2. Architecture: Tool-Access Gate (TAG)

The gate must sit in the **tool dispatch layer** — between the agent's intent to call a tool and the actual tool execution. This is the single choke point through which all tool calls flow.

```
┌──────────────────────────────────────────────────┐
│                  AGENT LIFECYCLE                  │
├──────────────────────────────────────────────────┤
│                                                    │
│  1. Agent decides to call a tool                   │
│  2. Agent outputs tool-call JSON                   │
│  3. ┌─▶ Harness parses tool-call ──────────────┐  │
│     │   ↓                                       │  │
│     │   F1 GATE (INSERT HERE)                   │  │
│     │   ├─ Classify agent type                  │  │
│     │   ├─ If reasoning: check allowlist        │  │
│     │   ├─ If allowed: pass through             │  │
│     │   ├─ If blocked: return F1 error, abort   │  │
│     │   └───────────────────────────────────────│  │
│     │   ↓                                       │  │
│     │  4. Tool dispatched to execution          │  │
│     └───────────────────────────────────────────┘  │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Key principle

The gate is **not** a new microservice or process. It is a **function call** inserted into the existing tool dispatch pipeline. The harness already has a function that receives tool-call JSON and dispatches it to the appropriate handler. The F1 gate wraps that dispatch with a classification + allowlist check.

---

## 3. Implementation

### 3.1 Configuration Loading

**What**: On harness startup, read `.impeccable/live/f1-guard.json` into memory.  
**Where**: In the harness initialization / config loading phase.  
**Why**: The config must be loaded once at startup and cached for performance. It should be re-readable on SIGHUP or config change detection for live updates.

**Config schema** (already exists at `.impeccable/live/f1-guard.json`):

```
Field                   | Type      | Default          | Description
------------------------|-----------|------------------|-----------------------------------------------
enabled                 | boolean   | true             | Master kill switch for the entire gate
reasoningAgentPrefixes  | string[]  | [see below]      | Agent type prefixes classified as reasoning
allowedTools            | string[]  | ["set_output"]   | Tools reasoning agents are permitted to call
autoTerminateOnViolation| boolean   | true             | Whether to kill the agent session on violation
blockAllSpawns          | boolean   | true             | Whether to block sub-agent spawns from reasoning agents
blockMessage            | string    | [see below]      | Template for blocked tool error (supports {toolName}, {agentType})
spawnBlockMessage       | string    | [see below]      | Template for blocked spawn error (supports {agentType})
failOpenOnError         | boolean   | false            | If true, gate errors pass through (unsafe); if false, block
logViolations           | boolean   | true             | Whether to log all violations to stderr
```

**Default reasoning agent prefixes** (hardcoded fallback if config is missing):
- `metabuff-reasoner`
- `thinker-gpt`
- `thinker-with-files-gemini`
- `metabuff-arch`

### 3.2 Core Function: `dispatchToolCall(agentType, toolName, params)`

This is the **critical change**. The harness currently has something like:

```
function dispatchToolCall(agentType, toolName, params) {
  const handler = toolRegistry[toolName];
  if (!handler) return { status: "error", error: "Unknown tool" };
  return handler(params);
}
```

**Change**: Wrap the dispatch with the F1 gate:

```
function dispatchToolCall(agentType, toolName, params) {
  // STEP 1: Classification
  const isReasoning = F1_CONFIG.reasoningAgentPrefixes.some(
    (prefix) => agentType.startsWith(prefix)
  );

  if (!isReasoning) {
    // STEP 2a: Action agent — full access, pass through
    return executeTool(agentType, toolName, params);
  }

  // STEP 2b: Reasoning agent — check allowlist
  if (F1_CONFIG.allowedTools.includes(toolName)) {
    return executeTool(agentType, toolName, params);
  }

  // STEP 3: Blocked — log, optionally terminate, return error
  if (F1_CONFIG.logViolations) {
    console.error(`[F1 VIOLATION] Agent=${agentType} Tool=${toolName}`);
  }

  if (F1_CONFIG.autoTerminateOnViolation) {
    terminateAgentSession(agentType);
  }

  const errorMsg = F1_CONFIG.blockMessage
    .replace("{toolName}", toolName)
    .replace("{agentType}", agentType);

  return {
    status: "blocked",
    error: errorMsg,
    guardrail: "F1",
  };
}
```

### 3.3 Core Function: `dispatchAgentSpawn(parentAgentType, childAgentType, prompt)`

**Current state**: The harness spawns sub-agents by calling a spawn function that creates a new agent session.

**Change**: Add an F1 check before allowing the spawn:

```
function dispatchAgentSpawn(parentAgentType, childAgentType, prompt) {
  if (!F1_CONFIG.blockAllSpawns) {
    return executeSpawn(parentAgentType, childAgentType, prompt);
  }

  const isReasoningParent = F1_CONFIG.reasoningAgentPrefixes.some(
    (prefix) => parentAgentType.startsWith(prefix)
  );

  if (!isReasoningParent) {
    return executeSpawn(parentAgentType, childAgentType, prompt);
  }

  // Block the spawn
  if (F1_CONFIG.logViolations) {
    console.error(`[F1 VIOLATION] Spawn blocked: ${parentAgentType} → ${childAgentType}`);
  }

  const errorMsg = F1_CONFIG.spawnBlockMessage
    .replace("{agentType}", parentAgentType);

  return {
    status: "blocked",
    error: errorMsg,
    guardrail: "F1",
  };
}
```

### 3.4 Integration Points

The following locations in the harness need modification:

| Integration Point | File (example path) | Change |
|-------------------|---------------------|--------|
| Tool dispatch handler | `src/tool-executor.ts` or similar | Wrap `dispatchToolCall` with F1 gate |
| Agent spawn handler | `src/agent-manager.ts` or similar | Wrap `dispatchAgentSpawn` with F1 gate |
| Config loader | `src/config.ts` or similar | Add F1 config loading from `.impeccable/live/f1-guard.json` |
| Agent session termination | `src/agent-session.ts` or similar | Ensure `terminateAgentSession()` exists and works cleanly |

### 3.5 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Config file missing | Use hardcoded defaults (fail-close) |
| Config file malformed JSON | Log error, use hardcoded defaults (fail-close when `failOpenOnError: false`) |
| `allowedTools` is empty | Reasoning agents can call nothing — intentional lock-down |
| `reasoningAgentPrefixes` is empty | No agents are classified as reasoning — gate is effectively off |
| Agent type is unknown (not in prefixes, not an action agent) | Default to full access (action agent treatment) |
| Multiple tool calls in a single agent turn | Check each call individually against the gate |
| Nested agent spawns (A spawns B spawns C) | Check at each level; if any parent is reasoning, block |

---

## 4. Error Messages

The following message strings are configured in `.impeccable/live/f1-guard.json`:

### Blocked Tool
```
[F1 GUARD] Tool '{toolName}' is blocked for reasoning agents ({agentType}).
Reasoning agents may only call: set_output. This call has been blocked
at the runtime layer. Aborting tool execution.
```

### Blocked Spawn
```
[F1 GUARD] Reasoning agents ({agentType}) may not spawn sub-agents.
This prevents bypassing the tool-access gate. Use set_output to
report your findings instead.
```

### Violation Log (stderr)
```
[F1 VIOLATION] Agent=<agentType> Tool=<toolName>
[F1 VIOLATION] Spawn blocked: <parentType> → <childType>
```

---

## 5. Termination Logic

When `autoTerminateOnViolation: true`, the harness must:

1. **Return the F1 error** to the parent agent (the orchestrator that spawned the reasoning agent)
2. **Terminate the reasoning agent's session** — stop processing its output, kill any pending work
3. **Do NOT crash the harness** — only the violating agent session is terminated
4. **Log the violation** (if `logViolations: true`)

The termination function signature:

```
function terminateAgentSession(agentType: string): void {
  // 1. Mark session as terminated
  // 2. Stop accepting tool calls from this agent
  // 3. Notify parent orchestrator
  // 4. Clean up any resources held by this agent
}
```

---

## 6. Verification & Testing

### 6.1 Unit Tests

After implementation, the following unit tests should pass:

| # | Test | Input | Expected |
|---|------|-------|----------|
| 1 | Reasoning agent, blocked tool | `dispatchToolCall("metabuff-reasoner", "run_terminal_command", ...)` | `status: "blocked"`, error includes `[F1 GUARD]` |
| 2 | Reasoning agent, allowed tool | `dispatchToolCall("metabuff-reasoner", "set_output", ...)` | `status: "executed"` (pass through) |
| 3 | Reasoning agent, spawn blocked | `dispatchAgentSpawn("metabuff-reasoner", "basher", ...)` | `status: "blocked"`, error includes `[F1 GUARD]` |
| 4 | Action agent, unaffected | `dispatchToolCall("basher", "run_terminal_command", ...)` | `status: "executed"` (full access) |
| 5 | Thinking agent, blocked tool | `dispatchToolCall("thinker-gpt", "code_search", ...)` | `status: "blocked"` |
| 6 | Prefix-matched variant | `dispatchToolCall("metabuff-reasoner-v2", "run_terminal_command", ...)` | `status: "blocked"` (startsWith match) |
| 7 | Confg disabled | Set `enabled: false`, call blocked tool | `status: "executed"` (gate bypassed) |
| 8 | Empty agent type | `dispatchToolCall("", "run_terminal_command", ...)` | `status: "executed"` (default to action) |

### 6.2 Integration Tests

| # | Test | Method | Expected |
|---|------|--------|----------|
| 1 | Live: reasoning agent blocked | Spawn `metabuff-reasoner`, instruct it to call a tool | Agent terminates with F1 error; no tool executes |
| 2 | Live: reasoning agent bypass | Spawn `metabuff-reasoner`, instruct it to spawn a `basher` | Spawn returns F1 error; basher is never created |
| 3 | Live: action agent unaffected | Spawn `basher`, instruct it to run a command | Command executes normally |

### 6.3 Test Commands

These are the commands to run after implementation:

```bash
# Unit tests (if the harness has a test suite)
npm test -- --grep "F1 guardrail"
npm test -- --grep "Tool-Access Gate"

# Integration test: reason agent blocked
codebuff --spawn metabuff-reasoner "read /etc/hostname"

# Integration test: spawn bypass blocked
codebuff --spawn metabuff-reasoner "spawn a basher to read /etc/hostname"
```

---

## 7. Rollout Strategy

### Phase 1: Implement (1 session)
- Add the F1 gate functions to the harness tool dispatch layer
- Load `.impeccable/live/f1-guard.json` at startup
- Wire `dispatchToolCall` and `dispatchAgentSpawn` with the gate
- Implement `terminateAgentSession`

### Phase 2: Test (1 session)
- Run all unit tests
- Run integration tests with live agent spawns
- Verify that reasoning agents are blocked and action agents are not
- Verify that sub-agent spawn bypass is blocked

### Phase 3: Monitor (1 week)
- Set `logViolations: true` and monitor stderr for any unexpected blocks
- Check for false positives (action agents misclassified as reasoning)
- Adjust `reasoningAgentPrefixes` if needed

### Phase 4: Harden (as needed)
- If false positives are found, improve the classification logic
- Consider adding a `bypassToken` or `--unsafe` flag for emergency overrides
- Add metrics/tracking for blocked calls

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| False positive: action agent classified as reasoning | Low (prefix-based, additive only) | High (agent loses tool access) | `enabled: false` kill switch; add `--unsafe` flag; log violations |
| False negative: reasoning agent not classified | Medium (missing prefix) | High (gate bypassed) | Regular audit of agent types; warn on unknown agent types |
| Config file not found at runtime | Low | Medium (uses defaults) | Hardcoded fallback with warning log |
| Gate itself has a bug that crashes harness | Low | Critical | `failOpenOnError: false` means gate errors block calls (safe); wrap gate in try/catch |
| Performance overhead | Very low (O(1) string check) | Negligible | Prefix match is a string operation; no network or I/O |

---

## 9. File Checklist

Files to create:
- (none — the config exists, the spec exists)

Files to modify (in the Codebuff CLI harness):
| File | Change |
|------|--------|
| `src/tool-executor.ts` (example) | Add F1 classification + allowlist check in `dispatchToolCall` |
| `src/agent-manager.ts` (example) | Add F1 parent check in `dispatchAgentSpawn` |
| `src/config.ts` (example) | Add F1 config loader for `.impeccable/live/f1-guard.json` |
| `src/agent-session.ts` (example) | Add `terminateAgentSession()` function |

---

## 10. Prior Art

This spec references:
- `F1-ENFORCEMENT-ADR.md` — Original ADR with architecture diagram and pseudocode
- `.impeccable/live/f1-guard.json` — Current runtime enforcement config (correct schema, not enforced)
- `knowledge.md` section "F1 — Task-Drift Guard" — Policy definition with preamble and enforcement rules

The pseudocode in the ADR is directly implementable. This spec adds integration points, edge case handling, testing strategy, and rollout phases that the ADR did not cover.
