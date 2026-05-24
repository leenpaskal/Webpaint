/**
 * /api/v1/clients
 *
 * GET  list clients (admin / manager).
 *      Query: ?q=<search>  (matches name, company or email — case-insensitive)
 *      200:  { clients: Client[] }
 *
 * POST create a client (admin / manager).
 *      Body:  { name, companyName?, email?, phone?, address?, vatNumber? }
 *      201:   { client: Client }
 *      400:   { error: { code: "validation", fieldErrors: {...} } }
 */

import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiBadRequest,
  apiForbidden,
  apiInternal,
  apiUnauthenticated,
  jsonOk,
} from "@/lib/api/responses";
import {
  createClient,
  listClients,
  validateClientInput,
  type ClientInput,
} from "@/lib/clients/client-service";

function readString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const url = new URL(req.url);
  const q = url.searchParams.get("q");

  try {
    const clients = await listClients({ search: q ?? null });
    return jsonOk({ clients });
  } catch (err) {
    console.error("api list clients failed", err);
    return apiInternal();
  }
}

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiBadRequest("Invalid JSON body.");
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const input: ClientInput = {
    name: readString(obj.name),
    companyName: readNullableString(obj.companyName),
    email: readNullableString(obj.email),
    phone: readNullableString(obj.phone),
    address: readNullableString(obj.address),
    vatNumber: readNullableString(obj.vatNumber),
  };

  const fieldErrors = validateClientInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return apiBadRequest("Validation failed.", fieldErrors);
  }

  try {
    const client = await createClient(input);
    return jsonOk({ client }, 201);
  } catch (err) {
    console.error("api create client failed", err);
    return apiInternal();
  }
}
