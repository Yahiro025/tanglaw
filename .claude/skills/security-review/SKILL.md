---
name: security-review
description: Security patterns for TANGLAW — JWT auth, NextAuth, bcrypt, input validation, API protection, and secrets management
---

# TANGLAW Security Patterns

Security conventions specific to TANGLAW's dual-auth architecture (NextAuth.js v4 on frontend + custom JWT on backend).

## When to Activate

- Implementing authentication or session management
- Handling user input on any endpoint
- Working with secrets, tokens, or password hashing
- Adding API endpoints that serve user data
- Modifying the NextAuth configuration in `frontend/src/lib/nextauth.ts`

## Critical: Two Auth Systems Coexist

TANGLAW uses **two separate auth layers** — never conflate them:

| Layer | Technology | Purpose | Token Location |
|-------|-----------|---------|---------------|
| Frontend session | NextAuth.js v4 (Credentials) | Session cookies, `useSession()` | NextAuth JWT in session |
| Backend API | Custom JWT (jsonwebtoken + bcryptjs) | Authenticate API calls | `localStorage` as `tanglaw-token`, sent as Bearer header |

## Password Handling

```typescript
// ✅ CORRECT: bcrypt with cost factor 12
const passwordHash = await bcrypt.hash(password, 12)

// ✅ CORRECT: constant-time comparison
const valid = await bcrypt.compare(password, user.passwordHash)
```

## JWT Patterns

```typescript
// ✅ CORRECT: sign with expiry
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '7d' }
)

// ✅ CORRECT: verify and extract
const decoded = jwt.verify(token, process.env.JWT_SECRET!)
```

## API Protection

```typescript
// ✅ CORRECT: protect routes with auth middleware
router.get('/scholarships', authenticateToken, getScholarships)
router.post('/messages', authenticateToken, createMessage)

// ❌ NEVER: expose user data without auth
router.get('/users', getUsers) // WRONG
```

## Input Validation

```typescript
import { z } from 'zod'

// ✅ CORRECT: validate on both client (Zod) and server (manual or Zod)
const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8)
})

// Server-side validation
const parsed = signupSchema.safeParse(req.body)
if (!parsed.success) {
  return res.status(400).json({ error: 'Invalid input' })
}
```

## Secrets Management

- `JWT_SECRET` — in backend `.env.local` (NOT committed)
- `GOOGLE_API_KEY` — in backend `.env.local` (NOT committed, used for Gemini)
- `OPENROUTER_API_KEY` — in backend `.env.local` (NOT committed, fallback)
- `DATABASE_URL` / `DIRECT_URL` — Supabase credentials (NOT committed)

### Security Rules

1. NEVER log passwords, tokens, or secrets
2. NEVER expose JWT_SECRET or API keys client-side
3. ALWAYS use HTTPS in production
4. ALWAYS rate-limit auth endpoints (future consideration)
5. ALWAYS validate input server-side (don't trust client-only validation)
6. NEVER commit `.env.local` files to git
