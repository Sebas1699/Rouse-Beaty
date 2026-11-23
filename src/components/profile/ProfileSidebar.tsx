import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

export function ProfileSidebar() {
  return (
    <nav className="side-nav" aria-label="Menú de cuenta">
      <p className="eyebrow">Mi cuenta</p>
      <Link href="/perfil">Mis datos</Link>
      <Link href="/perfil/direcciones">Direcciones</Link>
      <Link href="/perfil/metodos-pago">Métodos de pago</Link>
      <Link href="/perfil/pedidos">Mis pedidos</Link>
      <Link className="profile-buy-button" href="/">Comprar</Link>
      <LogoutButton />
    </nav>
  );
}
