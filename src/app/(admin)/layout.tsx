import AdminShell from "@/components/shell/AdminShell";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  return <AdminShell currentUser={currentUser}>{children}</AdminShell>;
}
