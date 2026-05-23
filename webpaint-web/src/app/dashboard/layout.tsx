import Sidebar from "@/components/dashboard/Sidebar";
import { requireUser } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10 md:flex-row md:gap-8 lg:px-8">
      <Sidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
