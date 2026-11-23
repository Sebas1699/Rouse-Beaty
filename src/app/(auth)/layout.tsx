import type { PropsWithChildren } from "react";
import { Footer } from "@/components/layout/Footer";
import { AuthHeader } from "@/components/layout/AuthHeader";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <>
      <AuthHeader />
      <main className="auth-layout-main">{children}</main>
      <Footer />
    </>
  );
}
