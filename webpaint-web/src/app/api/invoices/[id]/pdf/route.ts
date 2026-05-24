/**
 * Authenticated PDF download for an invoice.
 *
 * Access:
 *   - admin / manager: any invoice
 *   - client: only invoices on their own clients-table row
 */

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import {
  getInvoiceById,
  InvoiceNotFoundError,
} from "@/lib/invoices/invoice-service";
import { readInvoicePdf } from "@/lib/storage/invoice-storage";

type Params = Promise<{ id: string }>;

export async function GET(
  _req: Request,
  { params }: { params: Params },
) {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
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

  const isManager = user.role === "admin" || user.role === "manager";
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
