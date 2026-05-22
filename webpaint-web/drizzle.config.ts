/**
 * Drizzle Kit configuration.
 *
 *   npm run db:generate  — generate SQL migrations from src/db/schema.ts
 *   npm run db:migrate   — apply pending migrations to the Neon database
 *   npm run db:studio    — open Drizzle Studio to browse the database
 */

import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
