import { Pool } from "pg";
import { randomUUID } from "crypto";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;

// @ts-expect-error `family` is valid at runtime but missing from @types/pg v8.20.0 PoolConfig
const pool = connectionString ? new Pool({ connectionString, family: 4 }) : null;

export async function getUserByEmail(email: string) {
  if (!pool) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to query the Supabase user table.");
  }

  const result = await pool.query(
    'SELECT id, email, name, "passwordHash" FROM "User" WHERE email = $1 LIMIT 1',
    [email]
  );

  return result.rows[0] ?? null;
}

export async function getUserById(id: string) {
  if (!pool) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to query the Supabase user table.");
  }

  const result = await pool.query(
    'SELECT id, email, name, "passwordHash" FROM "User" WHERE id = $1 LIMIT 1',
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createUserRecord(input: { email: string; name: string; passwordHash: string }) {
  if (!pool) {
    throw new Error("DATABASE_URL or DIRECT_URL is required to create a Supabase user record.");
  }

  const result = await pool.query(
    'INSERT INTO "User" (id, email, name, "passwordHash", "emailVerified", "createdAt") VALUES ($1, $2, $3, $4, false, NOW()) RETURNING id, email, name',
    [randomUUID(), input.email, input.name, input.passwordHash]
  );

  return result.rows[0] ?? null;
}
