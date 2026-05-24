"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  attachPdfToInvoice,
  clearInvoicePdf,
  createInvoice,
  deleteInvoice,
  InvoiceNotFoundError,
  InvoiceNumberInUseError,
  updateInvoice,
  validateInvoiceInput,
} from "@/lib/invoices/invoice-service";
import type {
  Currency,
  InvoiceFieldErrors,
  InvoiceInput,
  InvoiceStatus,
} from "@/lib/invoices/invoice-constants";
import {
  PDF_MAX_BYTES,
  PDF_MIME,
  saveInvoicePdf,
} from "@/lib/storage/invoice-storage";

/* -------------------------------------------------------------------------- */
/* Metadata CRUD — admin / manager only                                       */
/* -------------------------------------------------------------------------- */

export type InvoiceFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: InvoiceFieldErrors;
  values?: InvoiceInput;
};

function readInvoiceForm(formData: FormData): InvoiceInput {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };
  const clientIdRaw = get("clientId").trim();
  const parsedClientId = clientIdRaw ? Number(clientIdRaw) : NaN;
  return {
    clientId: Number.isFinite(parsedClientId) ? parsedClientId : 0,
    invoiceNumber: get("invoiceNumber"),
    status: (get("status") || "draft") as InvoiceStatus,
    currency: (get("currency") || "EUR") as Currency,
    total: get("total"),
    issuedAt: get("issuedAt") || null,
    dueAt: get("dueAt") || null,
  };
}

function requireManager(role: string): role is "admin" | "manager" {
  return role === "admin" || role === "manager";
}

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const user = await requireUser();
  if (!requireManager(user.role)) {
    return { ok: false, formError: "Not authorized." };
  }

  const input = readInvoiceForm(formData);
  const fieldErrors = validateInvoiceInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  let newId: number;
  try {
    const created = await createInvoice(input);
    newId = created.id;
  } catch (err) {
    if (err instanceof InvoiceNumberInUseError) {
      return {
        ok: false,
        fieldErrors: { invoiceNumber: err.message },
        values: input,
      };
    }
    console.error("createInvoiceAction failed", err);
    return {
      ok: false,
      formError: "Failed to create invoice. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  redirect(`/dashboard/invoices/${newId}`);
}

export async function updateInvoiceAction(
  id: number,
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const user = await requireUser();
  if (!requireManager(user.role)) {
    return { ok: false, formError: "Not authorized." };
  }

  const input = readInvoiceForm(formData);
  const fieldErrors = validateInvoiceInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  try {
    await updateInvoice(id, input);
  } catch (err) {
    if (err instanceof InvoiceNumberInUseError) {
      return {
        ok: false,
        fieldErrors: { invoiceNumber: err.message },
        values: input,
      };
    }
    if (err instanceof InvoiceNotFoundError) {
      return {
        ok: false,
        formError: "This invoice no longer exists.",
        values: input,
      };
    }
    console.error("updateInvoiceAction failed", err);
    return {
      ok: false,
      formError: "Failed to save changes. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, values: input };
}

export type DeleteInvoiceState = { error: string | null };

export async function deleteInvoiceAction(
  id: number,
  _prev: DeleteInvoiceState,
  _formData: FormData,
): Promise<DeleteInvoiceState> {
  const user = await requireUser();
  if (!requireManager(user.role)) {
    return { error: "Not authorized." };
  }

  try {
    await deleteInvoice(id);
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) {
      return { error: "This invoice no longer exists." };
    }
    console.error("deleteInvoiceAction failed", err);
    return { error: "Failed to delete invoice. Please try again." };
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  redirect("/dashboard/invoices");
}

/* -------------------------------------------------------------------------- */
/* PDF upload / remove — admin / manager only                                 */
/* -------------------------------------------------------------------------- */

export type UploadPdfState = { error: string | null; ok: boolean };

export async function uploadInvoicePdfAction(
  invoiceId: number,
  _prev: UploadPdfState,
  formData: FormData,
): Promise<UploadPdfState> {
  const user = await requireUser();
  if (!requireManager(user.role)) {
    return { ok: false, error: "Not authorized." };
  }

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PDF file to upload." };
  }
  if (file.size > PDF_MAX_BYTES) {
    return {
      ok: false,
      error: `File is too large. Max ${Math.round(PDF_MAX_BYTES / (1024 * 1024))} MB.`,
    };
  }
  if (file.type && file.type !== PDF_MIME) {
    return { ok: false, error: "Only PDF files are accepted." };
  }
  if (!/\.pdf$/i.test(file.name)) {
    return { ok: false, error: "File must have a .pdf extension." };
  }

  try {
    const stored = await saveInvoicePdf(file);
    await attachPdfToInvoice(invoiceId, stored);
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) {
      return { ok: false, error: "This invoice no longer exists." };
    }
    console.error("uploadInvoicePdfAction failed", err);
    return { ok: false, error: "Failed to upload PDF. Please try again." };
  }

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
  return { ok: true, error: null };
}

export type RemovePdfState = { error: string | null };

export async function removeInvoicePdfAction(
  invoiceId: number,
  _prev: RemovePdfState,
  _formData: FormData,
): Promise<RemovePdfState> {
  const user = await requireUser();
  if (!requireManager(user.role)) {
    return { error: "Not authorized." };
  }

  try {
    await clearInvoicePdf(invoiceId);
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) {
      return { error: "This invoice no longer exists." };
    }
    console.error("removeInvoicePdfAction failed", err);
    return { error: "Failed to remove PDF. Please try again." };
  }

  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
  return { error: null };
}
