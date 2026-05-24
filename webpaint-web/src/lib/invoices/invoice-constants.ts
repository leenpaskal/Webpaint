/**
 * Invoices — client-safe types and enum constants.
 *
 * No `"server-only"` marker, no DB imports. Client components import from
 * here; the service module imports from here too.
 */

import type { Invoice } from "@/db/schema";

export type InvoiceStatus = Invoice["status"];
export type Currency = Invoice["currency"];

export type InvoiceInput = {
  clientId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  /** Stored as a numeric string to match the DB column. */
  total: string;
  issuedAt: string | null;
  dueAt: string | null;
};

export type InvoiceFieldErrors = Partial<Record<keyof InvoiceInput, string>>;

export type InvoiceStatusFilter = "all" | "unpaid" | "paid";

export const INVOICE_STATUS_VALUES: readonly InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const CURRENCY_VALUES: readonly Currency[] = ["BGN", "EUR", "USD"];

export const CURRENCY_LABELS: Record<Currency, string> = {
  BGN: "лв (BGN)",
  EUR: "€ (EUR)",
  USD: "$ (USD)",
};

export const INVOICE_STATUS_FILTERS: readonly InvoiceStatusFilter[] = [
  "all",
  "unpaid",
  "paid",
];

/** Statuses considered "unpaid" — money is owed but not received. */
export const UNPAID_STATUSES: readonly InvoiceStatus[] = ["sent", "overdue"];
