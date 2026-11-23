import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <section className="auth-page-shell">
      <div className="auth-titlebar">
        <Link className="auth-back-link" href="/" aria-label="Volver al inicio">←</Link>
        <span>Registro usuario</span>
      </div>
      <div className="auth-card">
        <RegisterForm />
      </div>
    </section>
  );
}