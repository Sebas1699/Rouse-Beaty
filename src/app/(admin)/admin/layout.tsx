import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ProtectedSessionGuard } from "@/components/auth/ProtectedSessionGuard";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  return (
    <ProtectedSessionGuard requiredRole="admin">
      <section className="section account-shell">
        <AdminSidebar />
        <div className="account-content">{children}</div>
      </section>
    </ProtectedSessionGuard>
  );
}