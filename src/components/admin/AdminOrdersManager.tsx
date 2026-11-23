"use client";

import { useEffect, useState } from "react";
import { getAdminOrders, updateOrderStatus } from "@/services/api";
import type { AdminOrder, OrderStatus } from "@/types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  paid: "Pago confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function AdminOrdersManager() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminOrders()
      .then(({ orders: result }) => {
        if (active) setOrders(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setError("");
    setBusyOrderId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((current) =>
        current.map((item) => item.id === orderId ? { ...item, status } : item),
      );
    } catch (updateError) {
      setError(messageFrom(updateError));
    } finally {
      setBusyOrderId(null);
    }
  }

  if (isLoading) {
    return <p className="muted-copy" role="status">Cargando pedidos...</p>;
  }

  return (
    <section className="admin-management">
      {error && <p className="admin-error" role="alert">{error}</p>}
      {orders.length === 0 ? (
        <div className="placeholder-panel">
          <p>Aún no hay ventas. Los pedidos confirmados desde el carrito aparecerán aquí.</p>
        </div>
      ) : (
        <div className="admin-order-list">
          {orders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <div className="admin-order-header">
                <div>
                  <h2>Pedido #{order.id.slice(0, 8).toUpperCase()}</h2>
                  <p>{dateFormatter.format(new Date(order.createdAt))}</p>
                </div>
                <label className="admin-field admin-order-status">
                  Estado
                  <select
                    value={order.status}
                    disabled={busyOrderId === order.id}
                    onChange={(event) => {
                      const status = nextStatuses[order.status].find(
                        (nextStatus) => nextStatus === event.target.value,
                      );
                      if (status) void changeStatus(order.id, status);
                    }}
                  >
                    <option value={order.status}>{statusLabels[order.status]}</option>
                    {nextStatuses[order.status].map((status) => (
                      <option key={status} value={status}>{statusLabels[status]}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                <strong>{order.customerName}</strong> · {order.customerEmail}
              </p>
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
    </section>
  );
}
