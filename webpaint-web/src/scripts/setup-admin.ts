/**
 * Idempotent admin bootstrap.
 *
 *   ADMIN_EMAIL=you@example.com \
 *   ADMIN_PASSWORD='strong-password' \
 *   ADMIN_NAME='Your Name' \         # optional, defaults to "Webpaint Admin"
 *   npm run setup:admin
 *
 * Creates the admin user if it doesn't exist, otherwise resets the
 * password and ensures role='admin' / client_id=NULL. Safe to re-run.
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

async function main(): Promise<void> {
  const rawEmail = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Webpaint Admin";

  if (!rawEmail || !password) {
    console.error(
      "Missing required env vars. Usage:\n" +
        "  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='secret' npm run setup:admin",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        passwordHash,
        role: "admin",
        clientId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`✅ Updated admin user: ${email}`);
  } else {
    const [created] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: "admin",
        clientId: null,
      })
      .returning({ id: users.id });
    console.log(`✅ Created admin user: ${email} (id=${created.id})`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ setup-admin failed:", err);
    process.exit(1);
  });
