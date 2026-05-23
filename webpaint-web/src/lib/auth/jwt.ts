/**
 * JWT helpers backed by `jose` — Edge-runtime safe.
 * Used by both the session module (Node) and the middleware (Edge).
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import {
  JWT_ALG,
  JWT_AUDIENCE,
  JWT_ISSUER,
  SESSION_MAX_AGE_SECONDS,
} from "./config";

export type UserRole = "admin" | "manager" | "client";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

let cachedKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (!isSessionPayload(payload)) return null;
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

function isSessionPayload(p: JWTPayload): p is JWTPayload & SessionPayload {
  return (
    typeof p.sub === "string" &&
    typeof (p as Record<string, unknown>).email === "string" &&
    typeof (p as Record<string, unknown>).name === "string" &&
    ["admin", "manager", "client"].includes(
      (p as Record<string, unknown>).role as string,
    )
  );
}
