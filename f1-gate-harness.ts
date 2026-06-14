#!/usr/bin/env npx tsx
/**
 * F1 Runtime Enforcement Gate — Test Harness (Proof-of-Concept)
 *
 * Implements the Tool-Access Gate (TAG) as specified in
 * F1-RUNTIME-GATE-IMPLEMENTATION-SPEC.md and F1-ENFORCEMENT-ADR.md.
 *
 * Usage: npx tsx f1-gate-harness.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

interface F1Config {
  schemaVersion: number;
  guardrail: string;
  enabled: boolean;
  description: string;
  reasoningAgentPrefixes: string[];
  allowedTools: string[];
  autoTerminateOnViolation: boolean;
  blockAllSpawns: boolean;
  blockMessage: string;
  spawnBlockMessage: string;
  failOpenOnError: boolean;
  logViolations: boolean;
}

interface ToolResult {
  status: "executed" | "blocked" | "error";
  error?: string;
  guardrail?: string;
}

interface SpawnResult {
  status: "executed" | "blocked" | "error";
  error?: string;
  guardrail?: string;
}

// ─── Default config (hardcoded fallback) ─────────────────────────────────────

const DEFAULT_F1_CONFIG: F1Config = {
  schemaVersion: 1,
  guardrail: "F1",
  enabled: true,
  description: "Fallback default — config file not found",
  reasoningAgentPrefixes: [
    "metabuff-reasoner",
    "thinker-gpt",
    "thinker-with-files-gemini",
    "metabuff-arch",
  ],
  allowedTools: ["set_output"],
  autoTerminateOnViolation: true,
  blockAllSpawns: true,
  blockMessage:
    "[F1 GUARD] Tool '{toolName}' is blocked for reasoning agents ({agentType}). Reasoning agents may only call: set_output. This call has been blocked at the runtime layer. Aborting tool execution.",
  spawnBlockMessage:
    "[F1 GUARD] Reasoning agents ({agentType}) may not spawn sub-agents. This prevents bypassing the tool-access gate. Use set_output to report your findings instead.",
  failOpenOnError: false,
  logViolations: true,
};

// ─── Config Loader ───────────────────────────────────────────────────────────

function loadF1Config(configPath: string): F1Config {
  try {
    const resolvedPath = path.resolve(configPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(
        `[F1 CONFIG] Config not found at ${resolvedPath}, using defaults`
      );
      return { ...DEFAULT_F1_CONFIG };
    }
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<F1Config>;

    return {
      ...DEFAULT_F1_CONFIG,
      ...parsed,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (DEFAULT_F1_CONFIG.failOpenOnError) {
      console.error(`[F1 CONFIG] Error loading config, failing open: ${msg}`);
      return { ...DEFAULT_F1_CONFIG, enabled: false };
    }
    console.error(`[F1 CONFIG] Error loading config, using defaults: ${msg}`);
    return { ...DEFAULT_F1_CONFIG };
  }
}

// ─── Core Gate Functions ─────────────────────────────────────────────────────

let _config: F1Config | null = null;
let terminatedAgents: Set<string> = new Set();

function getConfig(): F1Config {
  if (!_config) {
    _config = loadF1Config(".impeccable/live/f1-guard.json");
  }
  return _config;
}

/**
 * Re-read the config from disk (useful for testing with modified configs).
 */
function reloadConfig(): void {
  _config = null;
  getConfig();
}

/**
 * Returns true if the agent type is classified as a reasoning agent.
 * Uses prefix matching (startsWith) to catch versioned variants.
 */
function isReasoningAgent(agentType: string): boolean {
  return getConfig().reasoningAgentPrefixes.some((prefix) =>
    agentType.startsWith(prefix)
  );
}

/**
 * Gate for tool dispatch.
 * - Action agents (non-reasoning): full access, pass through
 * - Reasoning agents: only allowedTools are permitted; everything else is blocked
 */
function dispatchToolCall(
  agentType: string,
  toolName: string,
  params: unknown = {}
): ToolResult {
  // If gate is disabled, pass through
  if (!getConfig().enabled) {
    return { status: "executed" };
  }

  // If agent is already terminated, block everything
  if (terminatedAgents.has(agentType)) {
    return {
      status: "blocked",
      error: `[F1 GUARD] Agent '${agentType}' has been terminated.`,
      guardrail: "F1",
    };
  }

  // STEP 1: Classification
  const reasoning = isReasoningAgent(agentType);

  // STEP 2a: Action agent — full access
  if (!reasoning) {
    return { status: "executed" };
  }

  // STEP 2b: Reasoning agent — check allowlist
  if (getConfig().allowedTools.includes(toolName)) {
    return { status: "executed" };
  }

  // STEP 3: Blocked
  if (getConfig().logViolations) {
    console.error(`[F1 VIOLATION] Agent=${agentType} Tool=${toolName}`);
  }

  if (getConfig().autoTerminateOnViolation) {
    terminateAgentSession(agentType);
  }

  const errorMsg = getConfig()
    .blockMessage.replace("{toolName}", toolName)
    .replace("{agentType}", agentType);

  return {
    status: "blocked",
    error: errorMsg,
    guardrail: "F1",
  };
}

/**
 * Gate for agent spawn operations.
 * - Reasoning agents are blocked from spawning any sub-agents.
 * - Action agents can spawn freely.
 */
function dispatchAgentSpawn(
  parentAgentType: string,
  childAgentType: string
): SpawnResult {
  if (!getConfig().enabled || !getConfig().blockAllSpawns) {
    return { status: "executed" };
  }

  if (terminatedAgents.has(parentAgentType)) {
    return {
      status: "blocked",
      error: `[F1 GUARD] Agent '${parentAgentType}' has been terminated and cannot spawn.`,
      guardrail: "F1",
    };
  }

  const isReasoningParent = isReasoningAgent(parentAgentType);

  if (!isReasoningParent) {
    return { status: "executed" };
  }

  // Block the spawn
  if (getConfig().logViolations) {
    console.error(
      `[F1 VIOLATION] Spawn blocked: ${parentAgentType} → ${childAgentType}`
    );
  }

  const errorMsg = getConfig()
    .spawnBlockMessage.replace("{agentType}", parentAgentType);

  return {
    status: "blocked",
    error: errorMsg,
    guardrail: "F1",
  };
}

/**
 * Terminate a reasoning agent's session.
 * Once terminated, all further tool calls and spawns are blocked.
 */
function terminateAgentSession(agentType: string): void {
  terminatedAgents.add(agentType);
  if (getConfig().logViolations) {
    console.error(`[F1 TERMINATE] Agent session terminated: ${agentType}`);
  }
}

/**
 * Reset termination state (for testing).
 */
function resetTerminations(): void {
  terminatedAgents.clear();
}

// ─── Unit Tests ──────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assert(
  name: string,
  condition: boolean,
  detail: string
): TestResult {
  testsRun++;
  if (condition) {
    testsPassed++;
    console.log(`  ✅ PASS: ${name}`);
    return { name, passed: true, detail };
  }
  testsFailed++;
  console.log(`  ❌ FAIL: ${name} — ${detail}`);
  return { name, passed: false, detail };
}

function assertEqual<T>(
  name: string,
  actual: T,
  expected: T,
  detail?: string
): TestResult {
  const pass = actual === expected;
  const d =
    detail || `expected "${expected}", got "${actual}"`;
  return assert(name, pass, d);
}

function assertStatus(
  name: string,
  result: ToolResult | SpawnResult,
  expectedStatus: string
): TestResult {
  return assert(
    name,
    result.status === expectedStatus,
    `expected status "${expectedStatus}", got "${result.status}"${
      result.error ? ` — error: ${result.error}` : ""
    }`
  );
}

function assertGuardrail(
  name: string,
  result: ToolResult | SpawnResult
): TestResult {
  return assert(
    name,
    result.guardrail === "F1",
    `expected guardrail "F1", got "${result.guardrail}"`
  );
}

function assertErrorMessage(
  name: string,
  result: ToolResult | SpawnResult,
  expectedSubstring: string
): TestResult {
  const hasMsg = result.error && result.error.includes(expectedSubstring);
  return assert(
    name,
    !!hasMsg,
    `expected error to contain "${expectedSubstring}", got "${result.error}"`
  );
}

function runAllTests(): void {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  F1 Runtime Enforcement Gate — Unit Tests");
  console.log("═══════════════════════════════════════════════════════════\n");

  // Reset state before tests
  resetTerminations();
  reloadConfig();

  const results: TestResult[] = [];

  // ── Test 1: Reasoning agent, blocked tool ──────────────────────────────
  console.log("▶ Test Group: Reasoning Agent Tool Blocking");
  const r1 = dispatchToolCall("metabuff-reasoner", "run_terminal_command", {
    command: "echo test",
  });
  results.push(
    assertStatus("T1a: reasoning agent, blocked tool returns 'blocked'", r1, "blocked")
  );
  results.push(assertGuardrail("T1b: blocked response includes guardrail 'F1'", r1));
  results.push(
    assertErrorMessage(
      "T1c: blocked error contains '[F1 GUARD]'",
      r1,
      "[F1 GUARD]"
    )
  );
  results.push(
    assertErrorMessage(
      "T1d: blocked error contains tool name",
      r1,
      "run_terminal_command"
    )
  );

  // ── Test 2: Reasoning agent, allowed tool (set_output) ──────────────────
  console.log("\n▶ Test Group: Reasoning Agent Allowed Tool");
  // Reset terminations because test 1 terminated metabuff-reasoner
  resetTerminations();
  const r2 = dispatchToolCall("metabuff-reasoner", "set_output", {
    message: "test",
  });
  results.push(
    assertStatus("T2a: reasoning agent, allowed tool returns 'executed'", r2, "executed")
  );

  // ── Test 3: Reasoning agent, spawn blocked ──────────────────────────────
  console.log("\n▶ Test Group: Reasoning Agent Spawn Blocking");
  const r3 = dispatchAgentSpawn("metabuff-reasoner", "basher");
  results.push(
    assertStatus("T3a: reasoning parent, spawn returns 'blocked'", r3, "blocked")
  );
  results.push(assertGuardrail("T3b: blocked spawn includes guardrail 'F1'", r3));
  results.push(
    assertErrorMessage("T3c: blocked spawn error contains '[F1 GUARD]'", r3, "[F1 GUARD]")
  );

  // ── Test 4: Action agent, unaffected ────────────────────────────────────
  console.log("\n▶ Test Group: Action Agent Full Access");
  const r4a = dispatchToolCall("basher", "run_terminal_command", {
    command: "echo hello",
  });
  results.push(
    assertStatus("T4a: basher calls tool → 'executed'", r4a, "executed")
  );

  const r4b = dispatchToolCall("file-picker", "str_replace", {});
  results.push(
    assertStatus("T4b: file-picker calls tool → 'executed'", r4b, "executed")
  );

  const r4c = dispatchToolCall("code-searcher", "code_search", {});
  results.push(
    assertStatus("T4c: code-searcher calls tool → 'executed'", r4c, "executed")
  );

  const r4d = dispatchAgentSpawn("basher", "some-agent");
  results.push(
    assertStatus("T4d: basher spawns agent → 'executed'", r4d, "executed")
  );

  // ── Test 5: thinker-gpt blocked (different reasoning agent) ─────────────
  console.log("\n▶ Test Group: Other Reasoning Agents");
  resetTerminations();
  const r5 = dispatchToolCall("thinker-gpt", "code_search", { pattern: "test" });
  results.push(
    assertStatus("T5a: thinker-gpt, blocked tool → 'blocked'", r5, "blocked")
  );
  results.push(assertGuardrail("T5b: blocked includes guardrail 'F1'", r5));

  // ── Test 6: Prefix-matched variant (startsWith) ─────────────────────────
  console.log("\n▶ Test Group: Prefix Matching");
  resetTerminations();
  const r6 = dispatchToolCall(
    "metabuff-reasoner-v2",
    "read_files",
    { paths: ["test.txt"] }
  );
  results.push(
    assertStatus(
      "T6a: metabuff-reasoner-v2, blocked tool → 'blocked' (startsWith match)",
      r6,
      "blocked"
    )
  );

  // ── Test 7: Config disabled (enabled: false) ───────────────────────────
  console.log("\n▶ Test Group: Disabled Gate");
  // Temporarily modify config to disabled
  const tempConfig = getConfig();
  tempConfig.enabled = false;
  resetTerminations();
  const r7 = dispatchToolCall("metabuff-reasoner", "run_terminal_command", {
    command: "rm -rf /",
  });
  results.push(
    assertStatus(
      "T7a: gate disabled, reasoning agent → 'executed'",
      r7,
      "executed"
    )
  );
  // Restore
  tempConfig.enabled = true;

  // ── Test 8: Empty agent type (default to action agent treatment) ────────
  console.log("\n▶ Test Group: Edge Cases");
  resetTerminations();
  const r8 = dispatchToolCall("", "run_terminal_command", { command: "ls" });
  results.push(
    assertStatus(
      "T8a: empty agent type → 'executed' (default to action)",
      r8,
      "executed"
    )
  );

  // ── Test 9: Termination prevents further calls ─────────────────────────
  console.log("\n▶ Test Group: Session Termination");
  resetTerminations();
  // First call triggers termination
  dispatchToolCall("metabuff-reasoner", "run_terminal_command", {});
  // Second call should be blocked because agent is terminated
  const r9 = dispatchToolCall("metabuff-reasoner", "set_output", {
    message: "should be blocked",
  });
  results.push(
    assertStatus(
      "T9a: terminated agent, even allowed tool → 'blocked'",
      r9,
      "blocked"
    )
  );
  results.push(
    assertErrorMessage(
      "T9b: terminated error mentions 'terminated'",
      r9,
      "terminated"
    )
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log(`  Results: ${testsPassed}/${testsRun} passed`);
  if (testsFailed > 0) {
    console.log(`  ⚠️  ${testsFailed} test(s) FAILED`);
  } else {
    console.log("  ✅ All tests PASSED");
  }
  console.log("═══════════════════════════════════════════════════════════\n");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("F1 Runtime Enforcement Gate — Test Harness");
  console.log(`Config loaded from: .impeccable/live/f1-guard.json`);
  console.log(`Gate enabled: ${getConfig().enabled}`);
  console.log(
    `Reasoning agents: ${getConfig().reasoningAgentPrefixes.join(", ")}`
  );
  console.log(`Allowed tools: ${getConfig().allowedTools.join(", ")}`);
  console.log(`Auto-terminate: ${getConfig().autoTerminateOnViolation}`);
  console.log(`Block spawns: ${getConfig().blockAllSpawns}`);

  runAllTests();

  process.exit(testsFailed > 0 ? 1 : 0);
}

main();
