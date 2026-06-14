---
name: backend-patterns
description: TANGLAW backend patterns — Express.js, TypeScript (CommonJS), Prisma v7, Supabase PostgreSQL, JWT auth, LangChain RAG
---

# TANGLAW Backend Development Patterns

Backend patterns specific to the TANGLAW API server — an Express.js TypeScript project using CommonJS modules, Prisma v7 with Supabase PostgreSQL, custom JWT authentication, and LangChain-based AI chat.

## When to Activate

- Creating or modifying Express routes, controllers, or middleware in `backend/src/`
- Working with Prisma schema, queries, or migrations (in `backend/prisma/`)
- Implementing JWT authentication or authorization
- Building LangChain RAG pipelines for scholarship search
- Deploying to Render (free tier) with cold-start awareness

## Critical Project Constraints

```typescript
// ✅ CommonJS modules — NO ESM imports
const express = require('express')
// or TypeScript with CommonJS output
import express from 'express'   // ✅ OK (compiled to CommonJS)

// ❌ NO top-level await
// ❌ NO ESM-only packages
```

## Route Structure

Routes are defined in `backend/src/routes/index.ts` and use Express Router:

```typescript
// backend/src/routes/index.ts
import { Router } from 'express'
import { signup, login, logout, me } from '../controllers/authController'
import { getScholarships } from '../controllers/scholarshipController'
import { authenticateToken } from '../middleware/auth'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

router.post('/auth/signup', signup)
router.post('/auth/login', login)
router.post('/auth/logout', authenticateToken, logout)
router.get('/auth/me', authenticateToken, me)
router.get('/scholarships', authenticateToken, getScholarships)
router.post('/messages', authenticateToken, createMessage)
router.get('/messages', authenticateToken, getMessagesForUser)
```

## Controller Pattern

Controllers are async handlers with try-catch:

```typescript
// backend/src/controllers/authController.ts
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../services/prismaClient'

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, passwordHash }
    })

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}
```

## Middleware Pattern

```typescript
// backend/src/middleware/auth.ts
import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; name?: string }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedRequest['user']
    req.user = decoded
    next()
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}
```

## Prisma v7 Patterns

TANGLAW uses Prisma v7 with `@prisma/adapter-pg` and raw `pg.Pool`:

```typescript
// backend/src/services/prismaClient.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

export default prisma
```

Query patterns:
```typescript
// Filtered + paginated
const scholarships = await prisma.scholarship.findMany({
  where: {
    sector: 'PUBLIC',
    minGwa: { lte: gwa },
    programCategories: { hasSome: [program] }
  },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { name: 'asc' }
})
```

## LangChain RAG Pattern

```typescript
// backend/src/services/scholarshipSearchService.ts
// PostgreSQL ILIKE search → formatted context for LLM
export async function searchScholarships(query: string) {
  const results = await prisma.scholarship.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { provider: { contains: query, mode: 'insensitive' } }
      ]
    }
  })
  return results.map(s => formatScholarshipContext(s))
}
```

## AI Chat Cascade

The backend has a 6-model fallback chain: Gemini 3.1 Flash-Lite → owl-alpha → nemotron → gpt-oss → llama-3 → qwen-2.5 → gemma-2.

```typescript
// Primary: Gemini (GOOGLE_API_KEY)
// Fallback: OpenRouter free models
// Cache result; handle cold starts with retries
```

## Error Handling

```typescript
// Global error handler (registered last in server.ts)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})
```

## Deployment Notes

- Render free tier spins down after 15 mins of inactivity (30-60s cold start)
- `start.sh` runs: `prisma db push` + `prisma db seed` + `node dist/server.js`
- Seed script creates 8 canonical scholarships
