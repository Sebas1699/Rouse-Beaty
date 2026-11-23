import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { ProfileAccountHeader } from "@/components/profile/ProfileAccountHeader";
import { ProtectedSessionGuard } from "@/components/auth/ProtectedSessionGuard";
import { getCurrentUser } from "@/lib/auth";

export default async function ProfileLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ProtectedSessionGuard>
      <section className="section account-shell">
        <ProfileSidebar />
        <div className="account-content">
          <ProfileAccountHeader />
          {children}
        </div>
      </section>
    </ProtectedSessionGuard>
  );
}