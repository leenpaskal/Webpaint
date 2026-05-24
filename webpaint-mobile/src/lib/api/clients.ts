import { apiRequest } from './client';
import type { Client } from './types';

export function listClients(token: string, search?: string) {
  const qs = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiRequest<{ clients: Client[] }>(`/v1/clients${qs}`, { token });
}

export function getClient(token: string, id: number) {
  return apiRequest<{ client: Client }>(`/v1/clients/${id}`, { token });
}
