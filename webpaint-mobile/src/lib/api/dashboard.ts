import { apiRequest } from './client';
import type { DashboardSummary } from './types';

export function fetchDashboardSummary(token: string) {
  return apiRequest<{ summary: DashboardSummary }>(
    '/v1/dashboard/summary',
    { token },
  );
}
