# Local Development Guide - Tanglaw

This guide explains how to set up and run the Tanglaw project locally. Since `.env.local` files are not tracked in the repository for security, you must create them manually using the templates below.

## Prerequisites

- **Node.js**: v20 or higher (v24 recommended)
- **PostgreSQL**: A running instance (local or remote via Supabase)
- **NPM**: Standard package manager

---

## 1. Backend Setup

The backend is an Express server with Prisma ORM.

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Environment Variables
Create a file named `backend/.env.local` and fill in the following:

```env
# Server Configuration
PORT=4000
FRONTEND_URL=http://localhost:3000

# Database Configuration (PostgreSQL)
# Use a local Postgres URL for maximum performance
DATABASE_URL="postgresql://user:password@localhost:5432/tanglaw?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/tanglaw?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"

# AI Services (At least one is required for Chat functionality)
GOOGLE_API_KEY="your-google-gemini-api-key"
OPENAI_API_KEY="your-openai-api-key"
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Step 3: Database Initialization
Sync your database schema and seed initial data:

```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations (or push schema for development)
npx prisma db push

# Seed initial scholarship data
npm run seed
```

### Step 4: Run the Backend
```bash
npm run dev
```
The server will be available at `http://localhost:4000`.

---

## 2. Frontend Setup

The frontend is a Next.js application.

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Environment Variables
Create a file named `frontend/.env.local` and fill in the following:

```env
# Backend Connection
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-next-auth-secret-key"
```

### Step 3: Run the Frontend
```bash
npm run dev
```
The website will be available at `http://localhost:3000`.

---

## 🚀 Performance Optimizations for Local Development

To make your development experience faster, consider the following:

### 1. Enable Next.js Turbo Mode (Recommended)
Next.js 15+ supports "Turbo" which significantly speeds up development compilation.
Change your run command to:
```bash
# Inside /frontend
npm run dev -- --turbo
```

### 2. Use a Local PostgreSQL Container
Connecting to a remote database (like Supabase) adds network latency to every query. Running Postgres locally reduces this to <1ms.
**Quick Docker command for Postgres:**
```bash
docker run --name tanglaw-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=tanglaw -p 5432:5432 -d postgres
```

### 3. Parallel Start (One Command)
You can run both backend and frontend simultaneously from the frontend directory using the built-in scripts:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2 (from root or frontend):
cd backend && npm run dev
```

### 4. Prisma Performance
- Use `npx prisma generate --watch` in a separate terminal if you are making frequent schema changes to keep types updated instantly.
- The `transpile-only` flag is already enabled in the backend `dev` script to skip type-checking during development for faster restarts.

### 5. Dependency Management
If `npm install` is slow, consider using **pnpm** which caches packages globally.
```bash
npm install -g pnpm
pnpm install
```

---

## Troubleshooting

- **CORS Errors**: Ensure `FRONTEND_URL` in `backend/.env.local` matches exactly with your frontend address (usually `http://localhost:3000`).
- **Prisma Schema Mismatch**: If you see errors about missing tables, run `npx prisma db push` in the backend folder.
- **NextAuth Token Issues**: Clear your browser cookies if you change the `NEXTAUTH_SECRET` or `JWT_SECRET`.
