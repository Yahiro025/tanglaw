---
name: verification-loop
description: Verification system for TANGLAW — typechecking, linting, and build validation workflows
---

# Verification Loop for TANGLAW

A structured verification system for making code changes to the TANGLAW project.

## When to Activate

- After making significant changes to frontend or backend code
- Before committing or deploying
- When debugging build, type, or lint errors

## Verification Steps

### 1. TypeScript Typecheck

```bash
# Frontend (ESM)
cd frontend && npx tsc --noEmit

# Backend (CommonJS)
cd backend && npx tsc --noEmit
```

### 2. ESLint

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
```

### 3. Build

```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build
```

### 4. Test

```bash
# Frontend (vitest)
cd frontend && npx vitest run
```

## Common Issues

- **Backend CommonJS**: Ensure no top-level await or ESM-only imports
- **Prisma schema**: Changes to `backend/prisma/schema.prisma` must be mirrored in `frontend/prisma/schema.prisma`
- **Render cold start**: Backend on Render spins down after 15 mins of inactivity (30-60s cold start)

## Quick Fix Checklist

```
[ ] TypeScript typecheck passes (both frontend + backend)
[ ] ESLint passes (both frontend + backend)
[ ] Build succeeds (both frontend + backend)
[ ] No secrets committed
[ ] Imports use correct module system (ESM for FE, CommonJS for BE)
[ ] Prisma schema changes mirrored in both schemas if applicable
```
