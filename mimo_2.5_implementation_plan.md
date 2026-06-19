# Implementation Plan: Tanglaw Database & Auth Integration
**Target Agent:** MiMo 2.5

## Context & Guardrails for MiMo 2.5
*   **Strengths to Leverage:** You have a 1-million token context window and excel at complex agentic loops. Use your strong code reasoning to understand the full stack.
*   **Limitations & Anti-Hallucination Measures:** You can sometimes hallucinate or aggressively autocomplete if unrestricted. **Do not guess file contents or line numbers.** Always use `view_file` and `grep_search` before applying edits. Validate your changes iteratively to prevent cascading errors.
*   **Strict Adherence:** Follow this plan step-by-step. Do not deviate into "reasoning loops" without executing tools to verify your assumptions.

---

## Step 1: Grounding & Verification
1.  **Read Schema:** Use `view_file` on `backend/prisma/schema.prisma` to understand the `Scholarship` model.
2.  **Read Auth Middleware:** Use `view_file` on `backend/src/middleware/auth.ts` to understand how `authenticateToken` works.
3.  **Read NextAuth:** Use `view_file` on `frontend/src/lib/nextauth.ts` to understand how the frontend stores the JWT token.

## Step 2: Backend Implementation (Express + Prisma)
1.  **Create the Router:**
    *   Create a new file: `backend/src/routes/scholarshipsRouter.ts`.
    *   Import `express`, the `authenticateToken` middleware, and the `prisma` client.
    *   Create a `GET /` route that requires `authenticateToken`.
    *   Inside the route, execute `const scholarships = await prisma.scholarship.findMany();` and return it as JSON.
2.  **Wire the Router:**
    *   Edit `backend/src/server.ts` (or `app.ts`).
    *   Import the new `scholarshipsRouter` and register it: `app.use('/api/scholarships', scholarshipsRouter)`.

## Step 3: Frontend Implementation (Next.js)
1.  **Create API Utility:**
    *   Create `frontend/src/lib/api.ts`.
    *   Write a helper function `fetchWithAuth(url, options)` that dynamically attaches the NextAuth token (`session.user.token`) to the `Authorization: Bearer <token>` header.
2.  **Integrate:**
    *   Ensure any frontend component fetching scholarships uses this secure API utility instead of making unauthenticated requests or calling Supabase directly.

## Step 4: Dead Code & Dependency Cleanup
1.  **Uninstall Unused Supabase Clients:**
    *   The backend currently connects to Supabase entirely through Prisma (`@prisma/adapter-pg` and `pg`).
    *   The packages `@supabase/supabase-js` and `@supabase/ssr` are installed in the backend but are *unused dead code*.
    *   Run `npm uninstall @supabase/supabase-js @supabase/ssr` in the `backend` directory.
2.  **Clean Up Unused Files:**
    *   Use `grep_search` to ensure there are no stray references to `supabase-js` in `backend/src/`. If there are any dead utility files or unused imports, delete them.
    *   Remove any dead frontend code that attempts to query Supabase directly, ensuring everything routes through the Express backend.

## Step 5: Final Validation
*   Run `npm run build` in both `frontend` and `backend` directories.
*   Ensure there are no TypeScript compilation errors.
*   If errors occur, use your reasoning capabilities to debug and fix them immediately before completing the task.
