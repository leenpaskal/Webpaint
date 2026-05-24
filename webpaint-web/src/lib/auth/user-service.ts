/**
 * Auth service layer — owns the business rules for issuing client portal
 * logins and authenticating existing accounts. Self-registration is
 * disabled; admins create client accounts via `createClientLogin`.
 */

import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, users, type User } from "@/db/schema";
import { hashPassword, verifyPassword } from "./password";

export type CreateClientLoginInput = {
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
  "id" | "name" | "email" | "role" | "clientId"
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

export class ClientNotFoundError extends Error {
  constructor(id: number) {
    super(`Client ${id} not found.`);
    this.name = "ClientNotFoundError";
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Provision a portal login for an existing clients-table row. Only the
 * admin / manager UI calls this — there is no self-registration path.
 */
export async function createClientLogin(
  clientId: number,
  input: CreateClientLoginInput,
): Promise<AuthenticatedUser> {
  const email = normaliseEmail(input.email);
  const name = input.name.trim();

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);
  if (!client) throw new ClientNotFoundError(clientId);

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) throw new EmailAlreadyInUseError();

  const passwordHash = await hashPassword(input.password);

  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      role: "client",
      clientId,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      clientId: users.clientId,
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
    .where(eq(users.email, email))
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
    clientId: user.clientId,
  };
}

/** Returns the portal user linked to a client, if one exists. */
export async function findClientPortalUser(
  clientId: number,
): Promise<AuthenticatedUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      clientId: users.clientId,
    })
    .from(users)
    .where(eq(users.clientId, clientId))
    .limit(1);
  return row ?? null;
}

/**
 * Revoke a client's portal access. Used by the admin when they want to
 * disable a login or rotate credentials (revoke then create again).
 *
 * Restricted to deleting users that are linked to the given client and
 * have role='client' so the admin can't accidentally nuke an admin
 * account from the clients UI.
 */
export async function revokeClientPortalUser(
  clientId: number,
  userId: number,
): Promise<void> {
  await db
    .delete(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.clientId, clientId),
        eq(users.role, "client"),
      ),
    );
}
