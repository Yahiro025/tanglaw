---
name: coding-standards
description: Baseline coding conventions for TANGLAW — TypeScript/React naming, imports, and code-quality patterns
---

# TANGLAW Coding Standards

Baseline cross-project coding conventions for the TANGLAW monorepo.

## When to Activate

- Writing new TypeScript files, React components, or Express routes
- Reviewing code for consistency with project conventions
- Setting up new modules or services

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files (frontend) | kebab-case | `scholarship-browser.tsx` |
| Files (backend) | camelCase | `authController.ts` |
| React components | PascalCase | `ScholarshipBrowser`, `AuthGuard`, `OwelChatbot` |
| Functions | camelCase | `fetchScholarships`, `generateChatResponse` |
| Backend controllers | camelCase named exports | `signup`, `login`, `getScholarships` |
| Prisma models | PascalCase | `Scholarship`, `Question`, `User`, `Message` |
| Prisma fields | camelCase | `incomeBracket`, `programCategories`, `passwordHash` |
| Enums | PascalCase (name), UPPER_SNAKE (values) | `Sector.PUBLIC`, `QuestionType.MATH` |
| CSS custom properties | `--theme-*` prefix | `--theme-canvas`, `--theme-typography-main` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `SESSION_TTL` |

## Import Conventions

```typescript
// Frontend (ESM) — use @/ path alias
import { prisma } from '@/lib/db'
import { ScholarshipBrowser } from '@/components/scholarship-browser'

// Backend (CommonJS) — relative imports
import prisma from '../services/prismaClient'
import { authenticateToken } from '../middleware/auth'
```

## Code Quality Rules

1. **No `any` type casts** — use proper types instead
2. **No unused variables or imports** — clean up after changes
3. **No TODO comments** — implement or file an issue
4. **Handle errors** — every async operation needs try-catch
5. **Validate input** — use Zod schemas on both client and server
6. **Reuse helpers** — don't reimplement what exists in `backend.ts`, `tools.ts`, etc.
7. **No console.log in production** — use proper logging
8. **No magic strings/numbers** — use constants or enums
