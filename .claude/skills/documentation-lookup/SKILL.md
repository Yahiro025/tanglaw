---
name: documentation-lookup
description: Library documentation lookup for TANGLAW — Context7 CLI integration for Prisma, Next.js, React, Tailwind CSS v4, LangChain, Express, and NextAuth.js
---

# Documentation Lookup for TANGLAW

Use live documentation for TANGLAW's libraries and frameworks via Context7 CLI to avoid hallucinated APIs.

## When to Activate

- Using a framework API that might have changed (Next.js App Router, React 19 hooks)
- Writing Prisma queries with relations, raw SQL, or connection pooling
- Configuring Tailwind CSS v4 patterns or custom themes
- Implementing LangChain tools, chains, or agent executors
- Setting up NextAuth.js providers or callbacks
- Using any library where the version matters (`next@16.2.6`, `react@19.2.4`, `prisma@7.x`)

## Context7 Usage

```bash
# Step 1: Resolve library to Context7 ID
npx ctx7 library next.js "App Router route handlers with search params"

# Step 2: Fetch live docs
npx ctx7 docs /vercel/next.js "How to access searchParams in route handlers in Next.js 16"
```

## Key Library IDs

| Library | Context7 ID |
|---------|-------------|
| Prisma | `/prisma/web` or `/prisma/prisma` |
| Next.js | `/vercel/next.js` |
| React | `/facebook/react` |
| Tailwind CSS | `/tailwindlabs/tailwindcss` |
| Framer Motion | `/framer/motion` |
| Express | `/expressjs/express` |
| LangChain | `/langchain/langchain` |
| Supabase | `/supabase/supabase` |
| NextAuth.js | `/nextauthjs/next-auth` |

## When to Always Use Context7

- Framework APIs (Next.js route handlers, layouts, metadata, middleware)
- ORM queries (Prisma relations, raw queries, connection pooling, migrations)
- UI libraries (Tailwind CSS v4 patterns, Framer Motion, lucide-react)
- React hooks and patterns (`useActionState`, `useOptimistic`, Server Components)
- Database (PostgreSQL, Supabase, pg.Pool)
- Package configuration (`next.config.ts`, `postcss.config.mjs`, `tsconfig.json`)
- Authentication (NextAuth.js, JWT, bcrypt)
