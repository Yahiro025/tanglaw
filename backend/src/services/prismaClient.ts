import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from "dotenv";

for (const file of [".env.local", ".env"]) {
  dotenv.config({ path: file });
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const prisma = connectionString
  ? (() => {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      return new PrismaClient({ adapter });
    })()
  : new Proxy({} as PrismaClient, {
      get: (_target, property) => {
        throw new Error(
          "Database configuration is missing. Set DATABASE_URL or DIRECT_URL in backend/.env.local before using Prisma."
        );
      },
    });

export default prisma;
