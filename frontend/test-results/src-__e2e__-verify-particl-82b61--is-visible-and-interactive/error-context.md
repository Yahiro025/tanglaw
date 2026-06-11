# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: src/__e2e__/verify-particles.spec.ts >> tsParticles background is visible and interactive
- Location: src/__e2e__/verify-particles.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "networkidle"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("tsParticles background is visible and interactive", async ({ page }) => {
  4  |   const consoleErrors: string[] = [];
  5  |   page.on("console", msg => {
  6  |     if (msg.type() === "error") consoleErrors.push(msg.text());
  7  |   });
  8  |   page.on("pageerror", err => consoleErrors.push(err.message));
  9  | 
> 10 |   await page.goto("/", { waitUntil: "networkidle", timeout: 30000 });
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  11 |   await page.waitForTimeout(3000); // allow particles to initialize
  12 | 
  13 |   // Check the particles container div exists
  14 |   const container = await page.locator("#tanglaw-particles");
  15 |   await expect(container).toBeVisible();
  16 | 
  17 |   // Check that canvas was created inside the div
  18 |   const canvas = page.locator("#tanglaw-particles canvas");
  19 |   await expect(canvas).toBeVisible();
  20 | 
  21 |   // Test hover interactivity (mouse move should not error)
  22 |   await page.mouse.move(400, 300);
  23 |   await page.waitForTimeout(500);
  24 | 
  25 |   // Test click interactivity
  26 |   await page.mouse.click(400, 300);
  27 |   await page.waitForTimeout(500);
  28 | 
  29 |   // Take screenshot for visual verification
  30 |   await page.screenshot({ path: "/tmp/particles-screenshot.png", fullPage: true });
  31 | 
  32 |   // Assert no tsParticles-related console errors
  33 |   const tsParticlesErrors = consoleErrors.filter(e =>
  34 |     e.toLowerCase().includes("tsparticles") ||
  35 |     e.toLowerCase().includes("particlesprovider")
  36 |   );
  37 |   expect(tsParticlesErrors).toEqual([]);
  38 | });
  39 | 
```