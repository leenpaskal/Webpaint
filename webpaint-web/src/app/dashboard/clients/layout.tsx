import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

/**
 * The clients tab is agency-internal — only admin / manager accounts may
 * see or manage the customer list. Portal users with role='client' get
 * bounced to the dashboard overview.
 */
export default async function ClientsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
