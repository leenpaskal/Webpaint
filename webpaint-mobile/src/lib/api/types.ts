export type UserRole = 'admin' | 'manager' | 'client' | string;

export type AuthUser = {
  id: number | string;
  email: string;
  name: string;
  role: UserRole;
  clientId: number | string | null;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
};

/* -------------------------------------------------------------------------- */
/* Clients                                                                    */
/* -------------------------------------------------------------------------- */

export type Client = {
  id: number;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
  createdAt: string;
  updatedAt: string;
};

/* -------------------------------------------------------------------------- */
/* Invoices                                                                   */
/* -------------------------------------------------------------------------- */

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type Currency = 'BGN' | 'EUR' | 'USD';

export type InvoiceStatusFilter = 'all' | 'unpaid' | 'paid';

export type Invoice = {
  id: number;
  clientId: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  subtotal: string;
  taxTotal: string;
  total: string;
  issuedAt: string | null;
  dueAt: string | null;
  pdfPath: string | null;
  pdfOriginalName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceListItem = Invoice & {
  clientName: string | null;
  clientCompany: string | null;
};

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatusFilter = 'all' | 'open' | 'completed';

export type Task = {
  id: number;
  projectId: number | null;
  clientId: number | null;
  websiteId: number | null;
  assignedToUserId: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskListItem = Task & {
  clientName: string | null;
  clientCompany: string | null;
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export type DashboardSummary = {
  clients: number;
  unpaidInvoices: number;
  openTasks: number;
};
