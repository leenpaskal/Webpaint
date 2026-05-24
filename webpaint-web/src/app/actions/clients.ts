"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  createClientLogin,
  EmailAlreadyInUseError,
  ClientNotFoundError as PortalClientNotFoundError,
  revokeClientPortalUser,
} from "@/lib/auth/user-service";
import {
  ClientHasDependenciesError,
  ClientNotFoundError,
  createClient,
  deleteClient,
  updateClient,
  validateClientInput,
  type ClientFieldErrors,
  type ClientInput,
} from "@/lib/clients/client-service";

export type ClientFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: ClientFieldErrors;
  values?: ClientInput;
};

function readClientForm(formData: FormData): ClientInput {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };
  return {
    name: get("name"),
    companyName: get("companyName") || null,
    email: get("email") || null,
    phone: get("phone") || null,
    address: get("address") || null,
    vatNumber: get("vatNumber") || null,
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    return { ok: false, formError: "Not authorized." };
  }

  const input = readClientForm(formData);
  const fieldErrors = validateClientInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  let newId: number;
  try {
    const created = await createClient(input);
    newId = created.id;
  } catch (err) {
    console.error("createClientAction failed", err);
    return {
      ok: false,
      formError: "Failed to create client. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  redirect(`/dashboard/clients/${newId}`);
}

export async function updateClientAction(
  id: number,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    return { ok: false, formError: "Not authorized." };
  }

  const input = readClientForm(formData);
  const fieldErrors = validateClientInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  try {
    await updateClient(id, input);
  } catch (err) {
    if (err instanceof ClientNotFoundError) {
      return {
        ok: false,
        formError: "This client no longer exists.",
        values: input,
      };
    }
    console.error("updateClientAction failed", err);
    return {
      ok: false,
      formError: "Failed to save changes. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  return { ok: true, values: input };
}

export type DeleteClientState = { error: string | null };

export async function deleteClientAction(
  id: number,
  _prev: DeleteClientState,
  _formData: FormData,
): Promise<DeleteClientState> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    return { error: "Not authorized." };
  }

  try {
    await deleteClient(id);
  } catch (err) {
    if (err instanceof ClientHasDependenciesError) {
      return { error: err.message };
    }
    if (err instanceof ClientNotFoundError) {
      return { error: "This client no longer exists." };
    }
    console.error("deleteClientAction failed", err);
    return { error: "Failed to delete client. Please try again." };
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  redirect("/dashboard/clients");
}

/* -------------------------------------------------------------------------- */
/* Create portal login — admin issues credentials for an existing client      */
/* -------------------------------------------------------------------------- */

export type PortalLoginFieldErrors = Partial<
  Record<"name" | "email" | "password", string>
>;

export type PortalLoginFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: PortalLoginFieldErrors;
  /** Echoed back on validation failure. Password is never echoed. */
  values?: { name: string; email: string };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createPortalLoginAction(
  clientId: number,
  _prev: PortalLoginFormState,
  formData: FormData,
): Promise<PortalLoginFormState> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    return { ok: false, formError: "Not authorized." };
  }

  const name = (
    typeof formData.get("name") === "string"
      ? (formData.get("name") as string)
      : ""
  ).trim();
  const email = (
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string)
      : ""
  ).trim();
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";

  const fieldErrors: PortalLoginFieldErrors = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!email) fieldErrors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email))
    fieldErrors.email = "Enter a valid email address.";
  if (!password) fieldErrors.password = "Password is required.";
  else if (password.length < 8)
    fieldErrors.password = "Password must be at least 8 characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: { name, email } };
  }

  try {
    await createClientLogin(clientId, { name, email, password });
  } catch (err) {
    if (err instanceof EmailAlreadyInUseError) {
      return {
        ok: false,
        fieldErrors: { email: err.message },
        values: { name, email },
      };
    }
    if (err instanceof PortalClientNotFoundError) {
      return {
        ok: false,
        formError: "Client no longer exists.",
        values: { name, email },
      };
    }
    console.error("createPortalLoginAction failed", err);
    return {
      ok: false,
      formError: "Failed to create login. Please try again.",
      values: { name, email },
    };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Revoke portal login — admin only                                           */
/* -------------------------------------------------------------------------- */

export type RevokePortalLoginState = { error: string | null };

export async function revokePortalLoginAction(
  clientId: number,
  userId: number,
  _prev: RevokePortalLoginState,
  _formData: FormData,
): Promise<RevokePortalLoginState> {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    return { error: "Not authorized." };
  }

  try {
    await revokeClientPortalUser(clientId, userId);
  } catch (err) {
    console.error("revokePortalLoginAction failed", err);
    return { error: "Failed to revoke access. Please try again." };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { error: null };
}
