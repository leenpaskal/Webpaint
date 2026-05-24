/**
 * /api/v1/invoices/:id
 *
 * GET    fetch one invoice. Clients can only fetch their own.
 *        200: { invoice: Invoice }
 *        403: forbidden / 404: not_found
 *
 * PATCH  update an invoice (admin / manager).
 *        Body:  same shape as POST /invoices
 *        200:   { invoice: Invoice }
 *        400:   validation / 409: invoice_number_in_use
 *
 * DELETE remove an invoice (admin / manager). 204 on success.
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
  deleteInvoice,
  getInvoiceById,
  InvoiceNotFoundError,
  InvoiceNumberInUseError,
  updateInvoice,
  validateInvoiceInput,
} from "@/lib/invoices/invoice-service";
import {
  CURRENCY_VALUES,
  INVOICE_STATUS_VALUES,
  type Currency,
  type InvoiceInput,
  type InvoiceStatus,
} from "@/lib/invoices/invoice-constants";

type Params = Promise<{ id: string }>;

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function readNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Invoice");

  try {
    const invoice = await getInvoiceById(id);
    if (!isManagerRole(user.role) && invoice.clientId !== user.clientId) {
      return apiForbidden();
    }
    return jsonOk({ invoice });
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return apiNotFound("Invoice");
    console.error("api get invoice failed", err);
    return apiInternal();
  }
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Invoice");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiBadRequest("Invalid JSON body.");
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const clientId = Number(obj.clientId);
  const status =
    typeof obj.status === "string" && INVOICE_STATUS_VALUES.includes(obj.status as InvoiceStatus)
      ? (obj.status as InvoiceStatus)
      : ("draft" as InvoiceStatus);
  const currency =
    typeof obj.currency === "string" && CURRENCY_VALUES.includes(obj.currency as Currency)
      ? (obj.currency as Currency)
      : ("EUR" as Currency);

  const input: InvoiceInput = {
    clientId: Number.isFinite(clientId) ? clientId : 0,
    invoiceNumber: typeof obj.invoiceNumber === "string" ? obj.invoiceNumber : "",
    status,
    currency,
    total: typeof obj.total === "string" ? obj.total : String(obj.total ?? ""),
    issuedAt: readNullableString(obj.issuedAt),
    dueAt: readNullableString(obj.dueAt),
  };

  const fieldErrors = validateInvoiceInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return apiBadRequest("Validation failed.", fieldErrors);
  }

  try {
    const invoice = await updateInvoice(id, input);
    return jsonOk({ invoice });
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return apiNotFound("Invoice");
    if (err instanceof InvoiceNumberInUseError) {
      return jsonError(409, "invoice_number_in_use", err.message);
    }
    console.error("api update invoice failed", err);
    return apiInternal();
  }
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Invoice");

  try {
    await deleteInvoice(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return apiNotFound("Invoice");
    console.error("api delete invoice failed", err);
    return apiInternal();
  }
}
