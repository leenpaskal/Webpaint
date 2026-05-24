/**
 * GET /api/v1/auth/me
 *
 * Headers: Authorization: Bearer <token>
 * 200:     { user: { id, email, name, role, clientId } }
 * 401:     { error: { code: "unauthenticated", ... } }
 *
 * Useful for validating a stored token on mobile app startup.
 */

import { getApiUser } from "@/lib/api/auth";
import { apiUnauthenticated, jsonOk } from "@/lib/api/responses";

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  return jsonOk({ user });
}
