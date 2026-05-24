/**
 * Invoices service — business logic for the invoices tab.
 * Only the functions the UI actually needs live here.
 */

import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices, type Invoice } from "@/db/schema";
import {
  deleteInvoicePdf,
  type StoredInvoicePdf,
} from "@/lib/storage/invoice-storage";
import {
  CURRENCY_VALUES,
  INVOICE_STATUS_VALUES,
  UNPAID_STATUSES,
  type InvoiceFieldErrors,
  type InvoiceInput,
  type InvoiceStatusFilter,
} from "./invoice-constants";

export class InvoiceNotFoundError extends Error {
  constructor(id: number) {
    super(`Invoice ${id} not found.`);
    this.name = "InvoiceNotFoundError";
  }
}

export class InvoiceNumberInUseError extends Error {
  constructor(invoiceNumber: string) {
    super(`Invoice number "${invoiceNumber}" is already in use.`);
    this.name = "InvoiceNumberInUseError";
  }
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_REGEX = /^\d+(\.\d{1,2})?$/;

export function validateInvoiceInput(
  input: InvoiceInput,
): InvoiceFieldErrors {
  const errors: InvoiceFieldErrors = {};

  if (!Number.isInteger(input.clientId) || input.clientId <= 0) {
    errors.clientId = "Pick a client.";
  }
  if (!input.invoiceNumber.trim()) {
    errors.invoiceNumber = "Invoice number is required.";
  } else if (input.invoiceNumber.length > 50) {
    errors.invoiceNumber = "Invoice number must be at most 50 characters.";
  }
  if (!INVOICE_STATUS_VALUES.includes(input.status)) {
    errors.status = "Invalid status.";
  }
  if (!CURRENCY_VALUES.includes(input.currency)) {
    errors.currency = "Invalid currency.";
  }
  if (!input.total.trim()) {
    errors.total = "Total is required.";
  } else if (!MONEY_REGEX.test(input.total.trim())) {
    errors.total = "Enter a valid amount (e.g. 1200 or 1200.50).";
  }
  if (input.issuedAt && !DATE_REGEX.test(input.issuedAt)) {
    errors.issuedAt = "Use the YYYY-MM-DD format.";
  }
  if (input.dueAt && !DATE_REGEX.test(input.dueAt)) {
    errors.dueAt = "Use the YYYY-MM-DD format.";
  }

  return errors;
}

function normaliseTotal(value: string): string {
  // Strip leading zeros but keep two decimals if present.
  const n = Number(value);
  return n.toFixed(2);
}

function blank(v: string | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export type ListInvoicesOptions = {
  search?: string | null;
  statusFilter?: InvoiceStatusFilter;
  clientId?: number | null;
};

export type InvoiceListItem = Invoice & {
  clientName: string | null;
  clientCompany: string | null;
};

export async function listInvoices({
  search,
  statusFilter = "all",
  clientId,
}: ListInvoicesOptions = {}): Promise<InvoiceListItem[]> {
  const conditions: SQL[] = [];

  if (statusFilter === "unpaid") {
    conditions.push(inArray(invoices.status, [...UNPAID_STATUSES]));
  } else if (statusFilter === "paid") {
    conditions.push(eq(invoices.status, "paid"));
  }

  if (clientId != null) {
    conditions.push(eq(invoices.clientId, clientId));
  }

  const term = search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      or(
        ilike(invoices.invoiceNumber, pattern),
        ilike(clients.name, pattern),
        ilike(clients.companyName, pattern),
      ) as SQL,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
      clientCompany: clients.companyName,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(where)
    .orderBy(desc(invoices.issuedAt), desc(invoices.createdAt), asc(invoices.id));

  return rows.map((r) => ({
    ...r.invoice,
    clientName: r.clientName,
    clientCompany: r.clientCompany,
  }));
}

export async function countUnpaidInvoices(
  { clientId }: { clientId?: number | null } = {},
): Promise<number> {
  const conditions: SQL[] = [inArray(invoices.status, [...UNPAID_STATUSES])];
  if (clientId != null) {
    conditions.push(eq(invoices.clientId, clientId));
  }
  const [row] = await db
    .select({ value: count() })
    .from(invoices)
    .where(and(...conditions));
  return Number(row?.value ?? 0);
}

export async function getInvoiceById(id: number): Promise<Invoice> {
  const [row] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);
  if (!row) throw new InvoiceNotFoundError(id);
  return row;
}

async function assertInvoiceNumberAvailable(
  invoiceNumber: string,
  ignoreId?: number,
): Promise<void> {
  const [row] = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(eq(invoices.invoiceNumber, invoiceNumber))
    .limit(1);
  if (row && row.id !== ignoreId) {
    throw new InvoiceNumberInUseError(invoiceNumber);
  }
}

export async function createInvoice(input: InvoiceInput): Promise<Invoice> {
  const invoiceNumber = input.invoiceNumber.trim();
  await assertInvoiceNumberAvailable(invoiceNumber);

  const total = normaliseTotal(input.total);

  const [row] = await db
    .insert(invoices)
    .values({
      clientId: input.clientId,
      invoiceNumber,
      status: input.status,
      currency: input.currency,
      // The PDF is the source of truth — we don't expose subtotal / tax
      // separately in the UI. Store the total in all three so future
      // reports still add up.
      subtotal: total,
      taxTotal: "0.00",
      total,
      issuedAt: blank(input.issuedAt),
      dueAt: blank(input.dueAt),
    })
    .returning();
  return row;
}

export async function updateInvoice(
  id: number,
  input: InvoiceInput,
): Promise<Invoice> {
  const invoiceNumber = input.invoiceNumber.trim();
  await assertInvoiceNumberAvailable(invoiceNumber, id);

  const total = normaliseTotal(input.total);

  const [row] = await db
    .update(invoices)
    .set({
      clientId: input.clientId,
      invoiceNumber,
      status: input.status,
      currency: input.currency,
      subtotal: total,
      taxTotal: "0.00",
      total,
      issuedAt: blank(input.issuedAt),
      dueAt: blank(input.dueAt),
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, id))
    .returning();
  if (!row) throw new InvoiceNotFoundError(id);
  return row;
}

/**
 * Attach (or replace) the PDF for an invoice. The new file is already on
 * disk — this function updates the DB row and best-effort deletes the
 * previous file, so the storage stays in sync with the DB.
 */
export async function attachPdfToInvoice(
  invoiceId: number,
  stored: StoredInvoicePdf,
): Promise<Invoice> {
  const existing = await getInvoiceById(invoiceId);

  const [row] = await db
    .update(invoices)
    .set({
      pdfPath: stored.path,
      pdfOriginalName: stored.originalName,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  if (existing.pdfPath && existing.pdfPath !== stored.path) {
    await deleteInvoicePdf(existing.pdfPath);
  }

  return row;
}

export async function clearInvoicePdf(invoiceId: number): Promise<Invoice> {
  const existing = await getInvoiceById(invoiceId);

  const [row] = await db
    .update(invoices)
    .set({
      pdfPath: null,
      pdfOriginalName: null,
      updatedAt: new Date(),
    })
    .where(eq(invoices.id, invoiceId))
    .returning();

  if (existing.pdfPath) {
    await deleteInvoicePdf(existing.pdfPath);
  }

  return row;
}

export async function deleteInvoice(id: number): Promise<void> {
  const existing = await getInvoiceById(id);
  await db.delete(invoices).where(eq(invoices.id, id));
  if (existing.pdfPath) {
    await deleteInvoicePdf(existing.pdfPath);
  }
}
