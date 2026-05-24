/**
 * Authentication for REST API routes (mobile + any non-cookie client).
 *
 * Reads an `Authorization: Bearer <jwt>` header first, falling back to the
 * cookie session so the same helper works for browser-context calls.
 *
 * The JWT is the same token the web's cookie session uses — same secret,
 * same payload — so mobile + web sessions are interchangeable.
 */

import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/jwt";
import type { CurrentUser } from "@/lib/auth/session";

function readBearer(req: Request): string | null {
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  return m ? m[1].trim() : null;
}

export async function getApiUser(req: Request): Promise<CurrentUser | null> {
  let token = readBearer(req);
  if (!token) {
    const store = await cookies();
    token = store.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
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

export function isManagerRole(role: CurrentUser["role"]): boolean {
  return role === "admin" || role === "manager";
}
