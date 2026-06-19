# Spec Plan: Fixing Next.js Type Errors

## Issue Analysis
The TypeScript compilation errors are all originating from `frontend/.next/dev/types/validator.ts`:
```
.next/dev/types/validator.ts(5,50): error TS2305: Module '"./routes.js"' has no exported member 'AppRouteHandlerRoutes'.
.next/dev/types/validator.ts(52,52): error TS2344: Type '"/login"' does not satisfy the constraint 'never'.
...
```
These errors are **not** in your actual `src/` codebase. They are inside Next.js's auto-generated `.next` build directory. This typically occurs when Next.js's experimental `typedRoutes` feature generates corrupted route types, or when the cached `.next` directory falls out of sync with your current routes.

## Fix Implementation Plan

### Step 1: Clear the Next.js Cache
The auto-generated types are corrupted. We need to force Next.js to regenerate them from scratch.
1. Navigate to the frontend directory: `cd frontend`
2. Delete the `.next` directory: `rm -rf .next`

### Step 2: (Optional) Disable Typed Routes
If the error persists after clearing the cache, it indicates a bug with typed routes in your specific Next.js version.
1. Open `frontend/next.config.mjs` (or `next.config.js`).
2. If you see `experimental: { typedRoutes: true }`, set it to `false` or remove the block entirely.

### Step 3: Regenerate Types and Verify
1. Run `npm run build` or `npm run dev` in the `frontend` directory. Next.js will cleanly rebuild the `.next` folder and correctly regenerate the types.
2. Run `npx tsc --noEmit` again to verify that the errors have disappeared and the build is clean.
