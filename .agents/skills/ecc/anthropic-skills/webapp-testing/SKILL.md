# Webapp Testing — Playwright Reconnaissance-First Testing

> **Adapted from**: [anthropics/skills/webapp-testing](https://github.com/anthropics/skills/blob/main/skills/webapp-testing/SKILL.md)  
> **Metabuff-Tailored**: Integrated with MetaBuff's basher agent for local server management

## Purpose

Test local web applications using Playwright. **Reconnaissance-first**: understand the page
structure BEFORE interacting. Screenshot-driven debugging for visual verification.

## When to Use

- Testing a locally running Next.js, React, or other web app
- Verifying UI changes render correctly
- Debugging browser-specific issues
- Running end-to-end test scenarios
- Validating form submissions, navigation flows, or state changes

## Instructions

### 1. Start the Application (if not running)

```bash
# Next.js
cd /path/to/project && npm run dev &
# Wait for server to be ready
sleep 3
```

Use MetaBuff's `basher` agent to manage the server process.

### 2. Reconnaissance Phase (ALWAYS FIRST)

Before any interaction, understand the page:

```
RECONNAISSANCE CHECKLIST:
  □ Screenshot: Take a full-page screenshot for visual context
  □ DOM snapshot: Dump the page's HTML structure
  □ Console: Check for JavaScript errors (consoleErrors)
  □ Network: Verify all resources loaded (no 404s)
  □ Accessibility: Run axe-core or similar for a11y violations
```

**Use Playwright's `browser_use` agent from MetaBuff for this phase.**

### 3. Interaction Phase

Only after reconnaissance is complete:

```
INTERACTION PATTERN (for each test step):
  1. LOCATE: Find the target element using semantic selectors
     • Prefer: data-testid, role, aria-label
     • Avoid: CSS class names, XPath, nth-child
  2. VERIFY: Confirm the element is visible and enabled
  3. ACT: Click, type, select — the single interaction
  4. WAIT: Wait for the result (network idle, element visible, timeout)
  5. ASSERT: Screenshot + text assertion to confirm expected state
```

### 4. Common Test Patterns

**Form Submission:**
```
1. Navigate to form page
2. Screenshot (empty form)
3. Fill each field (one at a time, verify each)
4. Screenshot (filled form)
5. Click submit
6. Wait for success/error feedback
7. Screenshot (result state)
8. Assert: success message visible OR error message matches expected
```

**Navigation Flow:**
```
1. Start at page A
2. Screenshot (page A)
3. Click navigation link to page B
4. Wait for page B to load
5. Screenshot (page B)
6. Assert: URL changed, expected content visible
7. Click back
8. Assert: returned to page A
```

**Error Handling:**
```
1. Trigger error condition (invalid input, network failure)
2. Screenshot (error state)
3. Assert: error message is user-friendly (not a stack trace)
4. Assert: recovery path is available (retry button, go back link)
```

### 5. Reporting

After testing, produce a structured report:

```
WEBAPP TEST REPORT:

APP: [name/URL]
DATE: [timestamp]
SERVER: [start command + PID]

RESULTS:
  ✅ [N] tests passed
  ❌ [N] tests failed
  ⚠ [N] console errors found

FAILURES:
  [test name]: [what went wrong]
    Screenshot: [path]
    Expected: [what should happen]
    Actual: [what happened]

CONSOLE ERRORS:
  [error message] at [URL:line]

ACCESSIBILITY:
  [N] violations found
  [list critical violations]
```

## Anti-Patterns

### ❌ WRONG
- Interacting with elements before reconnaissance (missing DOM context)
- Using brittle selectors (`.css-abc123` — auto-generated classes)
- Not waiting for async operations to complete
- Expecting exact pixel-perfect screenshots (use fuzzy matching)
- Testing without checking console errors

### ✅ CORRECT
- Screenshot BEFORE and AFTER every major interaction
- Use `data-testid` attributes for test selectors (add them if missing)
- Wait for `networkidle` or specific element visibility after each action
- Check console errors as part of every test (they're bugs too)
- Report user-visible behavior, not implementation details

## Integration with MetaBuff

- **Server management**: Use `basher` to start/stop the dev server
- **Browser interaction**: Use `browser_use` agent (requires Chrome)
- **Validation**: Follow with `metabuff-validator` for ghost import/type safety checks
- **E2E pipeline**: Combine with `ecc-e2e-runner` for full end-to-end flows
