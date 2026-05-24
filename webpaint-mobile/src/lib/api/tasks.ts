import { apiRequest } from './client';
import type {
  Task,
  TaskListItem,
  TaskPriority,
  TaskStatus,
  TaskStatusFilter,
} from './types';

export type ListTasksParams = {
  search?: string;
  statusFilter?: TaskStatusFilter;
  clientId?: number;
};

export type CreateTaskInput = {
  title: string;
  description: string | null;
  dueDate: string | null;
  /** Required when the caller is admin/manager — ignored for role='client'. */
  clientId?: number;
};

export type UpdateTaskWorkflowInput = {
  status: TaskStatus;
  priority: TaskPriority;
};

export function listTasks(token: string, params: ListTasksParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('q', params.search);
  if (params.statusFilter && params.statusFilter !== 'all') {
    qs.set('status', params.statusFilter);
  }
  if (params.clientId != null) qs.set('clientId', String(params.clientId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<{ tasks: TaskListItem[] }>(`/v1/tasks${suffix}`, { token });
}

export type TaskClientLabel = {
  id: number;
  name: string;
  companyName: string | null;
};

export function getTask(token: string, id: number) {
  return apiRequest<{ task: Task; client: TaskClientLabel | null }>(
    `/v1/tasks/${id}`,
    { token },
  );
}

export function createTask(token: string, input: CreateTaskInput) {
  return apiRequest<{ task: Task }>('/v1/tasks', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateTaskWorkflow(
  token: string,
  id: number,
  input: UpdateTaskWorkflowInput,
) {
  return apiRequest<{ task: Task }>(`/v1/tasks/${id}`, {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function deleteTask(token: string, id: number) {
  return apiRequest<void>(`/v1/tasks/${id}`, {
    method: 'DELETE',
    token,
  });
}
