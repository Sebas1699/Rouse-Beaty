import { AdminCustomersManager } from "@/components/admin/AdminCustomersManager";

export default function AdminCustomersPage() {
  return (
    <>
      <p className="eyebrow">Panel de administración</p>
      <h1 className="page-title">Clientes</h1>
      <p className="muted-copy">
        Consulta las cuentas y controla su acceso a la tienda.
      </p>
      <AdminCustomersManager />
    </>
  );
}
