/**
 * /api/v1/clients/:id
 *
 * GET     fetch one client (admin / manager).
 *         200: { client: Client }
 *         404: { error: { code: "not_found", ... } }
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
} from "@/lib/clients/client-service";

type Params = Promise<{ id: string }>;

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
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
