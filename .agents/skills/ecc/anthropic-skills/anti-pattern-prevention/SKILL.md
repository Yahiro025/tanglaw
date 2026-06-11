# Anti-Pattern Prevention — ❌ WRONG vs ✅ CORRECT

> **Adapted from**: Anthropic Skills methodology (explain reasoning, show counterexamples)  
> **Metabuff-Tailored**: Applied across all MetaBuff coding agents

## Core Principle

**Show, don't just tell.** For every instruction, provide concrete examples of what NOT
to do alongside what TO do. LLMs learn patterns more reliably from counterexamples than
from positive examples alone.

## Why This Works (Anthropic Philosophy)

- **Theory of mind**: The model understands WHY a pattern is wrong when shown the consequence
- **Pattern recognition**: LLMs are pattern matchers; negative examples define pattern boundaries
- **Error prevention**: Showing the mistake prevents it before it happens
- **Self-correction**: The model can recognize when it's about to make a known anti-pattern

## MetaBuff Anti-Pattern Catalog

### 1. Ghost Imports

```typescript
// ❌ WRONG — imports module that doesn't exist
import { doSomething } from '@/utils/helper'  // file doesn't exist!

// ✅ CORRECT — verify with code_searcher first, then import
import { doSomething } from '@/lib/utils'  // verified: file exists, export confirmed
```

### 2. Type Casting to 'any'

```typescript
// ❌ WRONG — swallows type errors, hides bugs
const data = response as any

// ✅ CORRECT — define the expected type
interface ApiResponse { items: Item[]; total: number }
const data = response as ApiResponse  // type-safe
```

### 3. Swallowed Errors

```typescript
// ❌ WRONG — error disappears silently
try { await fetchData() } catch (e) {}

// ✅ CORRECT — log, rethrow, or handle explicitly
try {
  await fetchData()
} catch (e) {
  console.error('Data fetch failed:', e)
  throw new DataFetchError('Unable to load data', { cause: e })
}
```

### 4. Missing Edge Cases

```typescript
// ❌ WRONG — assumes input is always valid
function getFirst(items: string[]): string {
  return items[0]  // undefined if array is empty!
}

// ✅ CORRECT — handles edge case explicitly
function getFirst(items: string[]): string | undefined {
  if (items.length === 0) return undefined
  return items[0]
}
```

### 5. Hardcoded Values

```typescript
// ❌ WRONG — magic number, no explanation
const TIMEOUT = 5000

// ✅ CORRECT — named constant with rationale
/** API timeout in ms — matches upstream's documented 5s SLA */
const API_REQUEST_TIMEOUT_MS = 5000
```

### 6. TODO Placeholders

```typescript
// ❌ WRONG — unfinished code in production path
function calculateTotal(items: Item[]): number {
  // TODO: implement discount logic
  return items.reduce((sum, i) => sum + i.price, 0)
}

// ✅ CORRECT — implement fully OR throw explicit error
function calculateTotal(items: Item[]): number {
  const subtotal = items.reduce((sum, i) => sum + i.price, 0)
  const discount = calculateDiscount(items)  // implemented
  return subtotal - discount
}
```

## Application in MetaBuff

These anti-patterns are injected into agent context via `withECCContext()` when the
skill cache matches relevant keywords. The CoT protocol STEP 2.5 (QUESTION) explicitly
asks agents to check for these patterns before writing code.

## Adding New Anti-Patterns

When you discover a recurring mistake in MetaBuff agent output:

1. Add it to this catalog with ❌ WRONG and ✅ CORRECT examples
2. Tag it with the domain (e.g., `[typescript]`, `[python]`, `[react]`)
3. Rebuild the skill cache to make it discoverable
4. Record it in known-issues.md as a learned instinct
