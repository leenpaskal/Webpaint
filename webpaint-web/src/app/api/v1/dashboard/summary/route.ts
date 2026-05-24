/**
 * GET /api/v1/dashboard/summary
 *
 * Bearer-protected. Returns the three headline counts the mobile
 * dashboard cards show. Scoped to the caller's clientId when role='client'.
 *
 * 200: {
 *   summary: {
 *     clients: number,         // 0 when role='client'
 *     unpaidInvoices: number,
 *     openTasks: number,
 *   }
 * }
 */

import { getApiUser, isManagerRole } from "@/lib/api/auth";
import { apiInternal, apiUnauthenticated, jsonOk } from "@/lib/api/responses";
import { countClients } from "@/lib/clients/client-service";
import { countUnpaidInvoices } from "@/lib/invoices/invoice-service";
import { countOpenTasks } from "@/lib/tasks/task-service";

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  const scopedClientId = isManagerRole(user.role) ? null : user.clientId ?? -1;

  try {
    const [clients, unpaidInvoices, openTasks] = await Promise.all([
      isManagerRole(user.role) ? countClients() : Promise.resolve(0),
      countUnpaidInvoices({ clientId: scopedClientId }),
      countOpenTasks({ clientId: scopedClientId }),
    ]);

    return jsonOk({
      summary: { clients, unpaidInvoices, openTasks },
    });
  } catch (err) {
    console.error("api dashboard summary failed", err);
    return apiInternal();
  }
}
