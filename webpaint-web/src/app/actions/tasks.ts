"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  createClientTask,
  deleteTask,
  getTaskById,
  TaskNotFoundError,
  updateTaskWorkflow,
  validateClientTaskInput,
  validateTaskWorkflowInput,
} from "@/lib/tasks/task-service";
import type {
  ClientTaskFieldErrors,
  ClientTaskInput,
  TaskPriority,
  TaskStatus,
  TaskWorkflowFieldErrors,
  TaskWorkflowInput,
} from "@/lib/tasks/task-constants";

/* -------------------------------------------------------------------------- */
/* Create — restricted to role='client' (and only for their own clientId)     */
/* -------------------------------------------------------------------------- */

export type ClientTaskFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: ClientTaskFieldErrors;
  values?: ClientTaskInput;
};

function readClientTaskForm(formData: FormData): ClientTaskInput {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };
  return {
    title: get("title"),
    description: get("description") || null,
    dueDate: get("dueDate") || null,
  };
}

export async function createClientTaskAction(
  _prev: ClientTaskFormState,
  formData: FormData,
): Promise<ClientTaskFormState> {
  const user = await requireUser();

  if (user.role !== "client" || user.clientId == null) {
    return {
      ok: false,
      formError: "Only client accounts can submit tasks.",
    };
  }

  const input = readClientTaskForm(formData);
  const fieldErrors = validateClientTaskInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  let newId: number;
  try {
    const created = await createClientTask(input, user.clientId);
    newId = created.id;
  } catch (err) {
    console.error("createClientTaskAction failed", err);
    return {
      ok: false,
      formError: "Failed to submit task. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect(`/dashboard/tasks/${newId}`);
}

/* -------------------------------------------------------------------------- */
/* Workflow update — restricted to admin / manager                            */
/* -------------------------------------------------------------------------- */

export type TaskWorkflowFormState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: TaskWorkflowFieldErrors;
  values?: TaskWorkflowInput;
};

function readTaskWorkflowForm(formData: FormData): TaskWorkflowInput {
  const get = (key: string) => {
    const v = formData.get(key);
    return typeof v === "string" ? v : "";
  };
  return {
    status: (get("status") || "todo") as TaskStatus,
    priority: (get("priority") || "medium") as TaskPriority,
  };
}

export async function updateTaskWorkflowAction(
  id: number,
  _prev: TaskWorkflowFormState,
  formData: FormData,
): Promise<TaskWorkflowFormState> {
  const user = await requireUser();

  if (user.role !== "admin" && user.role !== "manager") {
    return {
      ok: false,
      formError: "Only admins and managers can update tasks.",
    };
  }

  const input = readTaskWorkflowForm(formData);
  const fieldErrors = validateTaskWorkflowInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors, values: input };
  }

  try {
    await updateTaskWorkflow(id, input);
  } catch (err) {
    if (err instanceof TaskNotFoundError) {
      return {
        ok: false,
        formError: "This task no longer exists.",
        values: input,
      };
    }
    console.error("updateTaskWorkflowAction failed", err);
    return {
      ok: false,
      formError: "Failed to save changes. Please try again.",
      values: input,
    };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, values: input };
}

/* -------------------------------------------------------------------------- */
/* Delete — admin / manager only                                              */
/* -------------------------------------------------------------------------- */

export type DeleteTaskState = { error: string | null };

export async function deleteTaskAction(
  id: number,
  _prev: DeleteTaskState,
  _formData: FormData,
): Promise<DeleteTaskState> {
  const user = await requireUser();

  if (user.role !== "admin" && user.role !== "manager") {
    return { error: "Only admins and managers can delete tasks." };
  }

  try {
    // Use getTaskById so the not-found error is consistent if the row
    // is already gone — the delete itself would throw the same error.
    await getTaskById(id);
    await deleteTask(id);
  } catch (err) {
    if (err instanceof TaskNotFoundError) {
      return { error: "This task no longer exists." };
    }
    console.error("deleteTaskAction failed", err);
    return { error: "Failed to delete task. Please try again." };
  }

  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  redirect("/dashboard/tasks");
}
