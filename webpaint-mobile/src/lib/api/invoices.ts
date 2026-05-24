import { apiRequest } from './client';
import type {
  Invoice,
  InvoiceListItem,
  InvoiceStatusFilter,
} from './types';

export type ListInvoicesParams = {
  search?: string;
  statusFilter?: InvoiceStatusFilter;
  clientId?: number;
};

export function listInvoices(token: string, params: ListInvoicesParams = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('q', params.search);
  if (params.statusFilter && params.statusFilter !== 'all') {
    qs.set('status', params.statusFilter);
  }
  if (params.clientId != null) qs.set('clientId', String(params.clientId));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest<{ invoices: InvoiceListItem[] }>(
    `/v1/invoices${suffix}`,
    { token },
  );
}

export function getInvoice(token: string, id: number) {
  return apiRequest<{ invoice: Invoice }>(`/v1/invoices/${id}`, { token });
}
