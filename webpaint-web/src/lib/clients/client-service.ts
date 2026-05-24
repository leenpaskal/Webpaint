/**
 * Clients service — single place where clients business logic lives.
 * Server actions and (future) REST handlers should call into this module
 * rather than touching Drizzle directly.
 */

import "server-only";
import { asc, count, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices, payments, type Client } from "@/db/schema";

export class ClientNotFoundError extends Error {
  constructor(id: number) {
    super(`Client ${id} not found.`);
    this.name = "ClientNotFoundError";
  }
}

/**
 * Thrown when a client cannot be deleted because they still own financial
 * records (invoices, payments). Those records must be archived or
 * reassigned through a dedicated flow — silent cascade-delete is unsafe.
 */
export class ClientHasDependenciesError extends Error {
  constructor(public readonly dependencies: readonly string[]) {
    super(
      `Cannot delete client — they still have ${dependencies.join(" and ")}. ` +
        `Remove or reassign those records first.`,
    );
    this.name = "ClientHasDependenciesError";
  }
}

export type ClientInput = {
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
};

export type ClientFieldErrors = Partial<Record<keyof ClientInput, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateClientInput(input: ClientInput): ClientFieldErrors {
  const errors: ClientFieldErrors = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  } else if (input.name.length > 255) {
    errors.name = "Name must be at most 255 characters.";
  }

  if (input.email && !EMAIL_REGEX.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (input.email && input.email.length > 255) {
    errors.email = "Email must be at most 255 characters.";
  }
  if (input.companyName && input.companyName.length > 255) {
    errors.companyName = "Company name must be at most 255 characters.";
  }
  if (input.phone && input.phone.length > 50) {
    errors.phone = "Phone must be at most 50 characters.";
  }
  if (input.vatNumber && input.vatNumber.length > 50) {
    errors.vatNumber = "VAT number must be at most 50 characters.";
  }

  return errors;
}

/** Trim every field and normalise empty strings to null so the DB stays clean. */
function normalise(input: ClientInput): ClientInput {
  const blank = (v: string | null) => {
    const t = v?.trim();
    return t ? t : null;
  };
  return {
    name: input.name.trim(),
    companyName: blank(input.companyName),
    email: blank(input.email)?.toLowerCase() ?? null,
    phone: blank(input.phone),
    address: blank(input.address),
    vatNumber: blank(input.vatNumber),
  };
}

export type ListClientsOptions = {
  search?: string | null;
};

export async function listClients(
  { search }: ListClientsOptions = {},
): Promise<Client[]> {
  const term = search?.trim();
  if (term) {
    const pattern = `%${term}%`;
    return db
      .select()
      .from(clients)
      .where(
        or(
          ilike(clients.name, pattern),
          ilike(clients.companyName, pattern),
          ilike(clients.email, pattern),
        ),
      )
      .orderBy(asc(clients.name));
  }
  return db.select().from(clients).orderBy(asc(clients.name));
}

export async function countClients(): Promise<number> {
  const rows = await db.select({ id: clients.id }).from(clients);
  return rows.length;
}

export async function getClientById(id: number): Promise<Client> {
  const [row] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1);
  if (!row) throw new ClientNotFoundError(id);
  return row;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const data = normalise(input);
  const [row] = await db.insert(clients).values(data).returning();
  return row;
}

export async function updateClient(
  id: number,
  input: ClientInput,
): Promise<Client> {
  const data = normalise(input);
  const [row] = await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  if (!row) throw new ClientNotFoundError(id);
  return row;
}

export async function deleteClient(id: number): Promise<void> {
  // The DB schema marks invoices.clientId and payments.clientId with
  // ON DELETE RESTRICT, so deletion would fail at the constraint layer
  // with a generic Postgres error. Check up-front so we can surface a
  // domain-specific error the UI can display.
  const [invoiceRow] = await db
    .select({ value: count() })
    .from(invoices)
    .where(eq(invoices.clientId, id));
  const [paymentRow] = await db
    .select({ value: count() })
    .from(payments)
    .where(eq(payments.clientId, id));

  const deps: string[] = [];
  if (Number(invoiceRow?.value ?? 0) > 0) deps.push("invoices");
  if (Number(paymentRow?.value ?? 0) > 0) deps.push("payments");
  if (deps.length > 0) throw new ClientHasDependenciesError(deps);

  const deleted = await db
    .delete(clients)
    .where(eq(clients.id, id))
    .returning({ id: clients.id });
  if (deleted.length === 0) throw new ClientNotFoundError(id);
}
