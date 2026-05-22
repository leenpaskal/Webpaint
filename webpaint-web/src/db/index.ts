/**
 * Database client — Drizzle ORM over the Neon serverless HTTP driver.
 *
 * Import the `db` instance anywhere a database query is needed:
 *
 *   import { db } from "@/db";
 *   import { clients } from "@/db/schema";
 *   const allClients = await db.select().from(clients);
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export * from "./schema";
