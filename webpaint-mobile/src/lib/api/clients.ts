import { apiRequest } from './client';
import type { Client } from './types';

export type ClientInput = {
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
};

export function listClients(token: string, search?: string) {
  const qs = search ? `?q=${encodeURIComponent(search)}` : '';
  return apiRequest<{ clients: Client[] }>(`/v1/clients${qs}`, { token });
}

export function getClient(token: string, id: number) {
  return apiRequest<{ client: Client }>(`/v1/clients/${id}`, { token });
}

export function createClient(token: string, input: ClientInput) {
  return apiRequest<{ client: Client }>('/v1/clients', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateClient(token: string, id: number, input: ClientInput) {
  return apiRequest<{ client: Client }>(`/v1/clients/${id}`, {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function deleteClient(token: string, id: number) {
  return apiRequest<void>(`/v1/clients/${id}`, {
    method: 'DELETE',
    token,
  });
}
