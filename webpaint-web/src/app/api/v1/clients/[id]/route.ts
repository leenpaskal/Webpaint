/**
 * /api/v1/clients/:id
 *
 * GET     fetch one client (admin / manager).
 *         200: { client: Client }
 *         404: { error: { code: "not_found", ... } }
 *
 * PATCH   update a client (admin / manager).
 *         Body:  { name, companyName?, email?, phone?, address?, vatNumber? }
 *         200:   { client: Client }
 *         400:   validation
 *         404:   not_found
 *
 * DELETE  remove a client (admin / manager).
 *         204: empty
 *         404: { error: { code: "not_found", ... } }
 *         409: { error: { code: "has_dependencies", ... } } — invoices /
 *              payments still reference this client; remove or reassign
 *              them first.
 */

import { NextResponse } from "next/server";
import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiBadRequest,
  apiForbidden,
  apiInternal,
  apiNotFound,
  apiUnauthenticated,
  jsonError,
  jsonOk,
} from "@/lib/api/responses";
import {
  ClientHasDependenciesError,
  ClientNotFoundError,
  deleteClient,
  getClientById,
  updateClient,
  validateClientInput,
  type ClientInput,
} from "@/lib/clients/client-service";

type Params = Promise<{ id: string }>;

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function readString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function readNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Client");

  try {
    const client = await getClientById(id);
    return jsonOk({ client });
  } catch (err) {
    if (err instanceof ClientNotFoundError) return apiNotFound("Client");
    console.error("api get client failed", err);
    return apiInternal();
  }
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Client");

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
    const client = await updateClient(id, input);
    return jsonOk({ client });
  } catch (err) {
    if (err instanceof ClientNotFoundError) return apiNotFound("Client");
    console.error("api update client failed", err);
    return apiInternal();
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Params },
) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Client");

  try {
    await deleteClient(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof ClientNotFoundError) return apiNotFound("Client");
    if (err instanceof ClientHasDependenciesError) {
      return jsonError(409, "has_dependencies", err.message);
    }
    console.error("api delete client failed", err);
    return apiInternal();
  }
}
