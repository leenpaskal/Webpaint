import type { ApiErrorBody } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!BASE_URL) {
  // Surface this loudly during dev so a forgotten .env doesn't fail silently.
  console.warn(
    '[api] EXPO_PUBLIC_API_BASE_URL is not set. Configure it in webpaint-mobile/.env',
  );
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  /**
   * When true, `path` is rooted at the server origin (e.g. `/api/invoices/:id/pdf`)
   * rather than relative to EXPO_PUBLIC_API_BASE_URL (which is `<origin>/api`).
   * Used for legacy endpoints that live outside the `/v1` prefix.
   */
  rawPath?: boolean;
};

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, signal, rawPath } = opts;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const origin = (BASE_URL ?? '').replace(/\/api\/?$/, '');
  const url = rawPath ? `${origin}${path}` : `${BASE_URL ?? ''}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    throw new ApiError(
      0,
      'network_error',
      err instanceof Error ? err.message : 'Network request failed.',
    );
  }

  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    const errBody = (data as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      errBody?.code ?? 'http_error',
      errBody?.message ?? `Request failed with status ${res.status}`,
      errBody?.fieldErrors,
    );
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
