/**
 * Authenticated PDF download + remove for an invoice.
 *
 * Auth accepts cookie session OR `Authorization: Bearer <jwt>` OR
 * `?token=<jwt>` query param (so mobile can hand the URL to the OS for
 * opening — `Linking.openURL` can't attach headers).
 *
 * Access:
 *   - admin / manager: any invoice
 *   - client: only invoices on their own clients-table row
 */

import { NextResponse } from "next/server";
import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiForbidden,
  apiInternal,
  apiNotFound,
  apiUnauthenticated,
  jsonOk,
} from "@/lib/api/responses";
import {
  clearInvoicePdf,
  getInvoiceById,
  InvoiceNotFoundError,
} from "@/lib/invoices/invoice-service";
import { readInvoicePdf } from "@/lib/storage/invoice-storage";

type Params = Promise<{ id: string }>;

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) {
    return new NextResponse("Authentication required.", { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  let invoice;
  try {
    invoice = await getInvoiceById(id);
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) {
      return new NextResponse("Not found", { status: 404 });
    }
    throw err;
  }

  const isManager = isManagerRole(user.role);
  if (!isManager && invoice.clientId !== user.clientId) {
    // Avoid leaking existence: return 404 for forbidden too.
    return new NextResponse("Not found", { status: 404 });
  }

  if (!invoice.pdfPath) {
    return new NextResponse("No PDF attached", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await readInvoicePdf(invoice.pdfPath);
  } catch (err) {
    console.error("readInvoicePdf failed", err);
    return new NextResponse("Failed to read file", { status: 500 });
  }

  const fileName = invoice.pdfOriginalName ?? `${invoice.invoiceNumber}.pdf`;
  // Inline so the browser previews when possible; users can still save.
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        fileName,
      )}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) return apiNotFound("Invoice");

  try {
    const invoice = await clearInvoicePdf(id);
    return jsonOk({ invoice });
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) return apiNotFound("Invoice");
    console.error("clearInvoicePdf failed", err);
    return apiInternal();
  }
}
