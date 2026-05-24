/**
 * Invoice PDF storage — local filesystem backed.
 *
 * The storage layer is deliberately a single module so we can swap it out
 * for blob storage (S3, R2, Vercel Blob, etc.) without touching the
 * service or actions. PDFs are written under `private/invoices/` at the
 * project root, which is gitignored and outside `public/` so they aren't
 * directly served by Next.js — the `/api/invoices/[id]/pdf` route gates
 * access.
 *
 * NOTE: filesystem storage doesn't survive serverless deploys
 * (Vercel etc). If you deploy there, swap the implementation for blob.
 */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const STORAGE_DIR = path.join(process.cwd(), "private", "invoices");

export const PDF_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const PDF_MIME = "application/pdf";

export type StoredInvoicePdf = {
  /** Storage-relative file name. Persist this in the DB. */
  path: string;
  originalName: string;
  size: number;
};

export async function saveInvoicePdf(file: File): Promise<StoredInvoicePdf> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  const storedName = `${randomUUID()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(STORAGE_DIR, storedName), buffer);
  return {
    path: storedName,
    originalName: file.name || "invoice.pdf",
    size: file.size,
  };
}

export async function readInvoicePdf(storedPath: string): Promise<Buffer> {
  return fs.readFile(path.join(STORAGE_DIR, storedPath));
}

/** Best-effort delete — missing files are not an error. */
export async function deleteInvoicePdf(storedPath: string): Promise<void> {
  try {
    await fs.unlink(path.join(STORAGE_DIR, storedPath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
