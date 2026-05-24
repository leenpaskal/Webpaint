import { apiRequest } from './client';
import type {
  Currency,
  Invoice,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceStatusFilter,
} from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type ListInvoicesParams = {
  search?: string;
  statusFilter?: InvoiceStatusFilter;
  clientId?: number;
};

export type InvoiceInput = {
  clientId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  total: string;
  issuedAt: string | null;
  dueAt: string | null;
};

export type InvoiceClientLabel = {
  id: number;
  name: string;
  companyName: string | null;
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

export function createInvoice(token: string, input: InvoiceInput) {
  return apiRequest<{ invoice: Invoice }>('/v1/invoices', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateInvoice(token: string, id: number, input: InvoiceInput) {
  return apiRequest<{ invoice: Invoice }>(`/v1/invoices/${id}`, {
    method: 'PATCH',
    body: input,
    token,
  });
}

export function deleteInvoice(token: string, id: number) {
  return apiRequest<void>(`/v1/invoices/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function deleteInvoicePdf(token: string, id: number) {
  return apiRequest<{ invoice: Invoice }>(`/api/invoices/${id}/pdf`, {
    method: 'DELETE',
    token,
    rawPath: true,
  });
}

/**
 * Returns the URL to open this invoice's PDF, with the bearer token
 * tacked on as a query param because Linking.openURL / browser open
 * can't attach Authorization headers. The web endpoint at
 * /api/invoices/:id/pdf accepts `?token=` thanks to the getApiUser shim.
 */
export function buildInvoicePdfUrl(id: number, token: string): string | null {
  if (!BASE_URL) return null;
  // BASE_URL is `http://host/api`; the PDF lives at `/api/invoices/:id/pdf`,
  // so strip the `/api` suffix and append the legacy path.
  const root = BASE_URL.replace(/\/api\/?$/, '');
  return `${root}/api/invoices/${id}/pdf?token=${encodeURIComponent(token)}`;
}
