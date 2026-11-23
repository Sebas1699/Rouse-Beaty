import { getCurrentUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/orders";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const statusLabels = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pago confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
} as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  const orders = user ? await getUserOrders(user.id) : [];

  return (
    <>
      <p className="eyebrow">Tu cuenta</p>
      <h1 className="page-title">Mis <em>pedidos.</em></h1>
      {orders.length === 0 ? (
        <div className="placeholder-panel">
          <p>No tienes ningún pedido pendiente.</p>
        </div>
      ) : (
        <div className="user-order-list">
          {orders.map((order) => (
            <article className="user-order-card" key={order.id}>
              <div className="admin-order-header">
                <div>
                  <h2>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
                  <p>{dateFormatter.format(new Date(order.createdAt))}</p>
                </div>
                <strong>{statusLabels[order.status]}</strong>
              </div>
              <ul className="admin-order-items">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name} × {item.quantity}
                    <span>{currency.format(item.unitPrice * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="admin-order-address">
                <strong>Entrega:</strong> {order.deliveryAddress}
              </p>
              <div className="admin-order-total">
                <span>{order.paymentNote}</span>
                <strong>{currency.format(order.total)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}