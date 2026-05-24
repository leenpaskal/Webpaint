/**
 * /api/v1/invoices
 *
 * GET  list invoices (admin / manager see all, role='client' is restricted
 *      to their own clientId).
 *      Query: ?q=<search>&status=all|unpaid|paid&clientId=<id>
 *      200:  { invoices: InvoiceListItem[] }
 *
 * POST create an invoice (admin / manager).
 *      Body:  { clientId, invoiceNumber, status, currency, total,
 *               issuedAt?, dueAt? }
 *      201:   { invoice: Invoice }
 *      400:   { error: { code: "validation", fieldErrors: {...} } }
 *      409:   { error: { code: "invoice_number_in_use", ... } }
 */

import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiBadRequest,
  apiForbidden,
  apiInternal,
  apiUnauthenticated,
  jsonError,
  jsonOk,
} from "@/lib/api/responses";
import {
  createInvoice,
  InvoiceNumberInUseError,
  listInvoices,
  validateInvoiceInput,
} from "@/lib/invoices/invoice-service";
import {
  CURRENCY_VALUES,
  INVOICE_STATUS_VALUES,
  type Currency,
  type InvoiceInput,
  type InvoiceStatus,
  type InvoiceStatusFilter,
} from "@/lib/invoices/invoice-constants";

function parseStatusFilter(raw: string | null): InvoiceStatusFilter {
  if (raw === "unpaid" || raw === "paid" || raw === "all") return raw;
  return "all";
}

function parseClientId(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const statusFilter = parseStatusFilter(url.searchParams.get("status"));
  const clientIdParam = parseClientId(url.searchParams.get("clientId"));

  // Clients only see their own invoices, regardless of any query override.
  const scopedClientId = isManagerRole(user.role)
    ? clientIdParam
    : user.clientId ?? -1;

  try {
    const invoices = await listInvoices({
      search: q,
      statusFilter,
      clientId: scopedClientId,
    });
    return jsonOk({ invoices });
  } catch (err) {
    console.error("api list invoices failed", err);
    return apiInternal();
  }
}

function readNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
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
    const invoice = await createInvoice(input);
    return jsonOk({ invoice }, 201);
  } catch (err) {
    if (err instanceof InvoiceNumberInUseError) {
      return jsonError(409, "invoice_number_in_use", err.message);
    }
    console.error("api create invoice failed", err);
    return apiInternal();
  }
}
