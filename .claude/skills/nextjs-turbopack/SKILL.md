---
name: nextjs-turbopack
description: Next.js 16 + Turbopack patterns for TANGLAW — App Router, route handlers, server components, and build optimization
---

# Next.js 16 + Turbopack for TANGLAW

Next.js 16 App Router patterns used by TANGLAW, including server components, API route handlers, layout nesting, and Turbopack dev server.

## When to Activate

- Working in `frontend/src/app/` — pages, layouts, API routes
- Configuring `next.config.ts` or `vercel.json`
- Debugging build or dev server issues
- Optimizing bundle size, image loading, or metadata

## Key Config Files

| File | Purpose |
|------|---------|
| `frontend/next.config.ts` | Next.js config (standalone output, bundle analyzer) |
| `frontend/vercel.json` | Vercel deploy config (build command, function regions) |
| `frontend/postcss.config.mjs` | PostCSS with `@tailwindcss/postcss` plugin (Tailwind v4) |
| `frontend/tsconfig.json` | Strict TypeScript, ESNext modules, bundler resolution |

## App Router Patterns

### Page Structure

```
frontend/src/app/
  page.tsx                    # Landing page (hero, features, mascot)
  layout.tsx                  # Root layout (fonts, providers, footer)
  (auth)/
    login/page.tsx            # Login page (NextAuth Credentials)
    signup/page.tsx           # Signup page
  (main)/
    scholarships/page.tsx     # Redirects to /dashboard/scholarships
    readiness/page.tsx        # Redirects to /dashboard/readiness
  dashboard/
    page.tsx                  # Dashboard home (module cards)
    layout.tsx                # Dashboard layout (AuthGuard, nav, chatbot)
    scholarships/page.tsx     # Scholarship browser (mounted inside dashboard)
    readiness/page.tsx        # Readiness assessment
    reviewer/page.tsx         # Exam reviewer
  api/
    chat/route.ts             # LangChain agent executor endpoint
    auth/[...nextauth]/route.ts # NextAuth.js API handler
```

### API Route Handler Pattern

```typescript
// frontend/src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message } = body
    // ... LangChain agent executor ...
    return NextResponse.json({ response: result })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
```

### Font Loading

```typescript
// In layout.tsx — using next/font
import { Inter, Outfit } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
```

### Metadata

```typescript
export const metadata: Metadata = {
  title: 'TANGLAW — Scholarship Navigation Portal',
  description: 'Find and apply for scholarships at PUP Manila'
}
```

## Vercel Deploy

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "functions": {
    "api/*.ts": { "memory": 512 }
  }
}
```
