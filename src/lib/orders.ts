import "server-only";
import { getPostgresPool } from "@/lib/db";
import type { AdminOrder, Order, OrderItem, OrderStatus } from "@/types";

interface OrderRow {
  id: string;
  total: number;
  status: OrderStatus;
  delivery_address: string;
  payment_note: string;
  created_at: Date | string;
  customer_name: string;
  customer_email: string;
}

interface OrderItemRow {
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

async function listOrders(whereClause: string, values: string[]) {
  const pool = getPostgresPool();
  const ordersResult = await pool.query<OrderRow>(
    `SELECT o.id::text AS id, o.total_amount::float8 AS total,
            LOWER(o.status) AS status, o.shipping_address AS delivery_address,
            COALESCE(o.payment_method_summary, 'Pago por coordinar') AS payment_note,
            o.created_at,
            u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${whereClause}
     ORDER BY o.created_at DESC`,
    values,
  );
  const orderIds = ordersResult.rows.map((order) => order.id);
  if (orderIds.length === 0) return [];

  const itemsResult = await pool.query<OrderItemRow>(
    `SELECT order_id::text AS order_id, product_id::text AS product_id,
            product_name, quantity,
            unit_price::float8 AS unit_price
     FROM order_items
     WHERE order_id = ANY($1::uuid[])
     ORDER BY id`,
    [orderIds],
  );
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const item of itemsResult.rows) {
    const items = itemsByOrder.get(item.order_id) ?? [];
    items.push({
      productId: item.product_id,
      name: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    });
    itemsByOrder.set(item.order_id, items);
  }

  return ordersResult.rows.map((row) => ({
    id: row.id,
    items: itemsByOrder.get(row.id) ?? [],
    total: row.total,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    deliveryAddress: row.delivery_address,
    paymentNote: row.payment_note,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
  }));
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const orders = await listOrders("WHERE o.user_id = $1::uuid", [userId]);
  return orders.map(
    ({ customerName: _customerName, customerEmail: _customerEmail, ...order }) =>
      order,
  );
}

export function getAdminOrders(): Promise<AdminOrder[]> {
  return listOrders("", []);
}
