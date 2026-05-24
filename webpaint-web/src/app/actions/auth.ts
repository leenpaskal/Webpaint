"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/config";
import { createSession, destroySession } from "@/lib/auth/session";
import {
  authenticateUser,
  InvalidCredentialsError,
} from "@/lib/auth/user-service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuthFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

type LoginFields = {
  email: string;
  password: string;
};

function getString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function validateLogin(fields: LoginFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.email) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(fields.email))
    errors.email = "Enter a valid email address.";
  if (!fields.password) errors.password = "Password is required.";
  return errors;
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const fields: LoginFields = {
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  };

  const fieldErrors = validateLogin(fields);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      fieldErrors,
      values: { email: fields.email },
    };
  }

  try {
    const user = await authenticateUser({
      email: fields.email,
      password: fields.password,
    });
    await createSession(user);
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return {
        ok: false,
        formError: err.message,
        values: { email: fields.email },
      };
    }
    console.error("loginAction failed", err);
    return {
      ok: false,
      formError: "Something went wrong. Please try again.",
      values: { email: fields.email },
    };
  }

  revalidatePath("/", "layout");
  redirect(DEFAULT_LOGIN_REDIRECT);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
