/**
 * Auth service layer — owns the business rules for registering and
 * authenticating users. Routes and server actions delegate to this module
 * rather than touching the database directly.
 */

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthenticatedUser = Pick<
  User,
  "id" | "name" | "email" | "role"
>;

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super("An account with that email already exists.");
    this.name = "EmailAlreadyInUseError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password.");
    this.name = "InvalidCredentialsError";
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthenticatedUser> {
  const email = normaliseEmail(input.email);
  const name = input.name.trim();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    throw new EmailAlreadyInUseError();
  }

  const passwordHash = await hashPassword(input.password);

  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "client",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return created;
}

export async function authenticateUser(
  input: LoginInput,
): Promise<AuthenticatedUser> {
  const email = normaliseEmail(input.email);

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email)))
    .limit(1);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new InvalidCredentialsError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
