"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  revokePortalLoginAction,
  type RevokePortalLoginState,
} from "@/app/actions/clients";

const initialState: RevokePortalLoginState = { error: null };

export default function RevokePortalLoginButton({
  clientId,
  userId,
  email,
}: {
  clientId: number;
  userId: number;
  email: string;
}) {
  const boundAction = revokePortalLoginAction.bind(null, clientId, userId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Revoke portal access for ${email}? They will no longer be able to log in. You can re-issue credentials afterwards.`,
        );
        if (!ok) event.preventDefault();
      }}
      className="flex flex-col gap-2"
    >
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {pending ? "Revoking..." : "Revoke access"}
    </button>
  );
}
