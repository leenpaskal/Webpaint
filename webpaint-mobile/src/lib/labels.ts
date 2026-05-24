import type {
  Currency,
  InvoiceStatus,
  TaskPriority,
  TaskStatus,
} from '@/lib/api/types';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'Review',
  completed: 'Completed',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  BGN: 'лв (BGN)',
  EUR: '€ (EUR)',
  USD: '$ (USD)',
};

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

// Mirrors webpaint-web/src/components/invoices/InvoiceStatusBadge.tsx
export const INVOICE_STATUS_TONE: Record<InvoiceStatus, Tone> = {
  draft: 'neutral',
  sent: 'info',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'muted',
};

// Mirrors webpaint-web/src/components/tasks/badges.tsx
export const TASK_STATUS_TONE: Record<TaskStatus, Tone> = {
  todo: 'neutral',
  in_progress: 'info',
  review: 'warning',
  completed: 'success',
};

export const TASK_PRIORITY_TONE: Record<TaskPriority, Tone> = {
  low: 'neutral',
  medium: 'neutral',
  high: 'warning',
  urgent: 'danger',
};
