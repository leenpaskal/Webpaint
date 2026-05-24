/**
 * POST /api/v1/auth/login
 *
 * Body:   { "email": "...", "password": "..." }
 * 200:    { "token": "<jwt>", "user": { id, email, name, role, clientId } }
 * 400:    { error: { code: "validation", fieldErrors: {...} } }
 * 401:    { error: { code: "invalid_credentials", ... } }
 *
 * The token is identical to the web's cookie session token — same secret,
 * same payload — so a single login works for both surfaces.
 */

import { signSessionToken } from "@/lib/auth/jwt";
import {
  authenticateUser,
  InvalidCredentialsError,
} from "@/lib/auth/user-service";
import {
  apiBadRequest,
  apiInternal,
  jsonError,
  jsonOk,
} from "@/lib/api/responses";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiBadRequest("Invalid JSON body.");
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const email = typeof obj.email === "string" ? obj.email.trim() : "";
  const password = typeof obj.password === "string" ? obj.password : "";

  const fieldErrors: Record<string, string> = {};
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email))
    fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Password is required.";

  if (Object.keys(fieldErrors).length > 0) {
    return apiBadRequest("Validation failed.", fieldErrors);
  }

  let user;
  try {
    user = await authenticateUser({ email, password });
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return jsonError(401, "invalid_credentials", err.message);
    }
    console.error("api login failed", err);
    return apiInternal();
  }

  const token = await signSessionToken({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
  });

  return jsonOk({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clientId: user.clientId,
    },
  });
}
