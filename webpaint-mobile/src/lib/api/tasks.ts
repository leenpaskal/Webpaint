import { apiRequest } from './client';
import type { Task, TaskListItem, TaskStatusFilter } from './types';

export type ListTasksParams = {
  search?: string;
  statusFilter?: TaskStatusFilter;
  clientId?: number;
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

export function getTask(token: string, id: number) {
  return apiRequest<{ task: Task }>(`/v1/tasks/${id}`, { token });
}
