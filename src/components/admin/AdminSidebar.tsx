import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function AdminSidebar() {
  return (
    <nav className="side-nav admin-nav" aria-label="Menú de administración">
      <p className="eyebrow">Administración</p>
      <Link href="/admin/productos">Productos</Link>
      <Link href="/admin/ventas">Ventas</Link>
      <Link href="/admin/clientes">Clientes</Link>
      <Link href="/perfil">Mi perfil</Link>
      <LogoutButton />
    </nav>
  );
}
