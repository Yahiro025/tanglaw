#!/usr/bin/env bash
# Tanglaw Backend — Startup Script
# Runs on every Render deploy to ensure the database schema and seed data
# are always up to date before the server starts.
#
# Dependencies are already installed by Render's build phase.
# Render supports IPv6, so this works with Supabase IPv6-only databases.

echo "=== Tanglaw Backend Startup ==="
date -u

echo "[1/3] Generating Prisma client..."
npx prisma generate 2>&1 || echo "⚠️ Prisma generate failed, continuing..."

echo "[2/3] Pushing database schema..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️ Schema push failed, continuing..."

echo "[3/3] Seeding scholarship data..."
npx ts-node --transpile-only prisma/seed.ts 2>&1 || echo "⚠️ Seeding failed, continuing..."

echo "=== Starting server ==="
exec node dist/server.js
