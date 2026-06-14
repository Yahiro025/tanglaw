---
name: frontend-patterns
description: TANGLAW frontend patterns — Next.js 16 App Router, React 19, Tailwind CSS v4, Framer Motion, lucide-react
---

# TANGLAW Frontend Development Patterns

Frontend patterns specific to the TANGLAW scholarship portal — a Next.js 16 App Router project with React 19, Tailwind CSS v4, Framer Motion, and lucide-react icons.

## When to Activate

- Creating or modifying React components in `frontend/src/components/` or `frontend/src/app/`
- Working with Next.js App Router pages, layouts, and routes
- Implementing animations with Framer Motion
- Styling with Tailwind CSS v4 (CSS custom properties via `--theme-*`)
- Building forms with Zod validation
- Handling authentication with NextAuth.js v4 (Credentials provider)
- Developing the dashboard layout, scholarship browser, readiness quiz, or chatbot

## Import Conventions

```typescript
// Use @/ path alias (maps to frontend/src/)
import { ScholarshipBrowser } from '@/components/scholarship-browser'
import { prisma } from '@/lib/db'
import { BackendScholarship } from '@/lib/backend'

// All imports use ESM syntax
// No Pages Router — App Router only
```

## Component Patterns

### Client Components (use `"use client"`)

```typescript
"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ScholarshipCardProps {
  name: string
  provider: string
  benefits: string[]
}

export function ScholarshipCard({ name, provider, benefits }: ScholarshipCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      className="rounded-xl border border-[var(--theme-surface)] p-4"
      onClick={() => setExpanded(v => !v)}
    >
      <h3 className="font-outfit text-lg">{name}</h3>
      <p className="text-sm text-[var(--theme-typography-main)]">{provider}</p>
      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {benefits.map((b, i) => (
              <li key={i} className="text-sm">{b}</li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

### Server Components (default)

```typescript
// No "use client" directive — rendered on server
// Fetch data directly, pass to client children
import { prisma } from '@/lib/db'
import { ScholarshipList } from './scholarship-list'

export default async function ScholarshipsPage() {
  const scholarships = await prisma.scholarship.findMany({
    take: 20,
    orderBy: { name: 'asc' }
  })

  return <ScholarshipList scholarships={scholarships} />
}
```

### Dashboard Layout Pattern

```typescript
// frontend/src/app/dashboard/layout.tsx
// Wraps all dashboard pages with AuthGuard + navigation + OwelChatbot
import { AuthGuard } from '@/components/AuthGuard'
import { DashboardNav } from '@/components/dashboard-nav'
import { OwelChatbot } from '@/components/owel-chatbot'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <DashboardNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <OwelChatbot />
    </AuthGuard>
  )
}
```

## Styling with Tailwind CSS v4

TANGLAW uses CSS custom properties (not Tailwind's default color palette) defined in `globals.css`:

```css
/* Theme variables */
--theme-canvas: #...        /* Background */
--theme-surface: #...       /* Card/surface */
--theme-typography-main: #... /* Text */
--theme-accent: #...        /* Accent/primary */
```

Usage:
```tsx
<div className="bg-[var(--theme-canvas)] text-[var(--theme-typography-main)]">
```

## Animation Patterns (Framer Motion)

```typescript
// Stagger children animation — used in dashboard module cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

## Icon Usage (lucide-react)

```typescript
import { Search, BookOpen, GraduationCap, MessageCircle } from 'lucide-react'

// Use as inline SVGs — no icon font needed
<Search className="h-5 w-5 text-[var(--theme-typography-main)]" />
```

## Form Handling with Zod

```typescript
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})
```

## State Management

- Client state: `useState` / `useEffect` (no Redux or Zustand)
- Auth state: NextAuth.js `useSession()` hook
- API tokens: `localStorage` (`tanglaw-token` key)
- Cache: `sessionStorage` with 5-minute TTL (scholarship browser)
