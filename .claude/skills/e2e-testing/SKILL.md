---
name: e2e-testing
description: E2E testing patterns for TANGLAW — Playwright configuration, auth flows, and scholarship browsing tests
---

# E2E Testing with Playwright for TANGLAW

End-to-end testing patterns using the Playwright configuration already set up in the root `playwright.config.ts`.

## When to Activate

- Writing or running E2E tests for user flows
- Testing login, signup, or scholarship browsing
- Verifying the chatbot widget, readiness quiz, or dashboard navigation
- Debugging flaky tests or updating test configuration

## Configuration

TANGLAW's Playwright config is at the project root (`playwright.config.ts`). Tests should be in `e2e/` or alongside features.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
})
```

## Auth Test Patterns

```typescript
import { test, expect } from '@playwright/test'

test('user can sign up with valid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

## Test Data

- Use the seed scholarship data (8 canonical scholarships)
- Create test users via the signup API
- Avoid relying on production data
