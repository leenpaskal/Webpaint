import { apiRequest } from './client';
import type { LoginResponse, MeResponse } from './types';

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function fetchMe(token: string) {
  return apiRequest<MeResponse>('/v1/auth/me', { token });
}
