# MCP Builder — Structured Model Context Protocol Server Development

> **Adapted from**: [anthropics/skills/mcp-builder](https://github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md)  
> **Metabuff-Tailored**: Integrated with MetaBuff's architecture and code review pipeline

## Purpose

Guide the creation of high-quality MCP (Model Context Protocol) servers that enable
LLMs to interact with external services through well-designed tools. Follows a
structured Plan → Implement → Review → Test workflow.

## When to Use

- Building a new MCP server for an external API or service
- Adding tools to an existing MCP server
- Designing tool interfaces for LLM-consumable APIs
- Auditing MCP server security and error handling

## Instructions

### Phase 1: Planning

Before writing code, answer these questions:

```
MCP SERVER DESIGN BRIEF:

  1. SERVICE: What external service/API is being wrapped?
  2. TOOLS: List each tool the server will expose:
     - Tool name (camelCase, verb-led: getWeather, searchDocs, createIssue)
     - Input schema (JSON Schema for parameters)
     - Output description (what the tool returns)
     - Error modes (what can go wrong)
  3. AUTH: How does the server authenticate? (API key, OAuth, etc.)
     - NEVER hardcode credentials — use environment variables
  4. RESOURCES: What static/dynamic resources does the server expose?
  5. TRANSPORT: stdio, SSE, or streamable HTTP?
```

### Phase 2: Implementation

Follow MetaBuff's architecture guidelines:

```
IMPLEMENTATION ORDER:
  1. Type definitions (tool schemas, response types) — NO 'any' types
  2. Service client (API wrapper with error handling)
  3. Tool handlers (one function per tool)
  4. Server setup (transport, logging, error boundaries)
  5. Tests (unit + integration for each tool)
```

**Key principles:**
- **Descriptive tool names AND descriptions**: The LLM uses descriptions to decide when to call a tool. Be specific about what the tool does, when to use it, and what it returns.
- **Validate all inputs**: Never trust LLM-provided parameters. Validate types, ranges, and formats.
- **Error messages, not stack traces**: Return user-readable error messages. Log full errors server-side.
- **Rate limiting awareness**: If the upstream API has rate limits, communicate them in tool descriptions.
- **Idempotency**: Read tools should be idempotent. Write tools should document whether they are.

### Phase 3: Code Review

Apply MetaBuff's Superpowers-enhanced formalized review:

```
MCP SERVER REVIEW CHECKLIST:
  □ All tool schemas use strict JSON Schema (no 'any' types)
  □ Tool descriptions include: purpose, parameters, return format, error conditions
  □ Authentication is via environment variables (no hardcoded secrets)
  □ All inputs are validated before use
  □ Error handling catches upstream failures gracefully
  □ No unbounded operations (timeouts on all external calls)
  □ Server startup/shutdown is clean (no resource leaks)
  □ Tests exist for at least: happy path + auth failure + upstream error
```

### Phase 4: Testing

```
MCP SERVER TEST PLAN:

  UNIT TESTS (per tool):
    □ Happy path: valid inputs → expected output
    □ Invalid input: malformed params → clear error
    □ Missing input: required param omitted → clear error
    □ Auth failure: bad credentials → appropriate error
    □ Upstream error: API returns 500 → graceful degradation

  INTEGRATION TESTS:
    □ Server starts and stops cleanly
    □ Multiple sequential tool calls work correctly
    □ Concurrent requests don't interfere

  MANUAL VERIFICATION:
    □ Connect with MCP Inspector (npx @modelcontextprotocol/inspector)
    □ Test each tool interactively
    □ Verify error messages are user-friendly
```

## Anti-Patterns

### ❌ WRONG
- Tool names like `doThing` or `processData` (too vague for LLM)
- Returning raw API errors to the LLM (exposes implementation details)
- No input validation (trusting LLM-provided parameters)
- Hardcoded API keys in source code
- Synchronous blocking calls without timeouts

### ✅ CORRECT
- Tool names: `searchDocuments`, `createGitHubIssue`, `getWeatherForecast`
- Error responses: `{ error: "Weather API unavailable. Try again in 30 seconds." }`
- Input validation: Zod schemas, JSON Schema, or manual guards on every parameter
- Auth: `process.env.API_KEY` from environment, documented in README
- Timeouts: `Promise.race([apiCall(), timeout(5000)])` with clear error messages
