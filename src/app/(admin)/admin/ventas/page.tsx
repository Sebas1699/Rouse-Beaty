import { AdminOrdersManager } from "@/components/admin/AdminOrdersManager";

export default function AdminSalesPage() {
  return (
    <>
      <p className="eyebrow">Panel de administración</p>
      <h1 className="page-title">Ventas</h1>
      <p className="muted-copy">Consulta pedidos y actualiza su estado de entrega.</p>
      <AdminOrdersManager />
    </>
  );
}