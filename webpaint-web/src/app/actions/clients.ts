"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
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
  await requireUser();

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
  await requireUser();

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

export async function deleteClientAction(id: number): Promise<void> {
  await requireUser();

  try {
    await deleteClient(id);
  } catch (err) {
    if (!(err instanceof ClientNotFoundError)) {
      console.error("deleteClientAction failed", err);
      throw err;
    }
  }

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  redirect("/dashboard/clients");
}
