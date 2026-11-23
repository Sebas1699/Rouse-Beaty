import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import type { OrderStatus } from "@/types";

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Se requiere una cuenta administradora." },
        { status: 403 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "El cuerpo de la solicitud no es JSON válido." },
        { status: 400 },
      );
    }
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "El estado del pedido no es válido." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "El identificador del pedido no es válido." },
        { status: 400 },
      );
    }
    const client = await getPostgresPool().connect();
    let transactionOpen = false;
    try {
      await client.query(
        "BEGIN",
      );
      transactionOpen = true;
      const currentResult = await client.query<{ status: OrderStatus }>(
        "SELECT LOWER(status) AS status FROM orders WHERE id = $1::uuid FOR UPDATE",
        [id],
      );
      const current = currentResult.rows[0];
      if (!current) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { message: "No se encontró el pedido." },
          { status: 404 },
        );
      }
      if (!allowedTransitions[current.status].includes(parsed.data.status)) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { message: `No se puede cambiar de ${current.status} a ${parsed.data.status}.` },
          { status: 409 },
        );
      }

      if (parsed.data.status === "cancelled") {
        await client.query(
          `UPDATE products p
           SET stock = p.stock + items.quantity, updated_at = NOW()
           FROM order_items items
           WHERE items.order_id = $1::uuid AND p.id = items.product_id`,
          [id],
        );
      }
      await client.query(
        "UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1::uuid",
        [id, parsed.data.status.toUpperCase()],
      );
      await client.query("COMMIT");
      transactionOpen = false;

      return NextResponse.json({ status: parsed.data.status });
    } catch (error) {
      if (transactionOpen) {
        await client.query("ROLLBACK").catch((rollbackError: unknown) => {
          console.error("No se pudo revertir la actualización del pedido.", rollbackError);
        });
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("No se pudo actualizar el estado del pedido.", error);
    return NextResponse.json(
      { message: "No se pudo actualizar el pedido." },
      { status: 503 },
    );
  }
}
