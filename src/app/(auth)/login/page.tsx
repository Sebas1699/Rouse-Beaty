import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <section className="auth-page-shell">
      <div className="auth-titlebar">
        <Link className="auth-back-link" href="/" aria-label="Volver al inicio">←</Link>
        <span>Ingreso usuario</span>
      </div>
      <div className="auth-card">
        <LoginForm />
      </div>
    </section>
  );
}