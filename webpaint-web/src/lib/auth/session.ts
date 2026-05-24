/**
 * Server-only session helpers. Reads/writes the httpOnly session cookie
 * and resolves the currently-logged-in user from the JWT payload.
 *
 * Do NOT import from middleware — `next/headers` is server-component only.
 */

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "./config";
import {
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./jwt";

export type CurrentUser = {
  id: number;
  email: string;
  name: string;
  role: SessionPayload["role"];
  /** Linked clients-table row (required for role='client', null otherwise). */
  clientId: number | null;
};

export async function createSession(user: CurrentUser): Promise<void> {
  const token = await signSessionToken({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const id = Number(payload.sub);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    clientId: payload.clientId,
  };
}

/**
 * Resolve the current user or bounce to /login. Use in server components,
 * route handlers and server actions to defend against unauthenticated calls
 * that bypass middleware.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
