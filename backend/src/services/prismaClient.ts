import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for Prisma adapter");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export default prisma;
