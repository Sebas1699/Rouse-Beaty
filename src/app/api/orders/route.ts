import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";

const orderRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.productId)).size === items.length,
      { message: "No repitas productos en el pedido." },
    ),
  deliveryAddress: z.string().trim().min(5).max(500),
});

interface CheckoutProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "user") {
      return NextResponse.json(
        { message: "Inicia sesión con una cuenta de cliente para confirmar tu pedido." },
        { status: 401 },
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

    const parsed = orderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Revisa los productos y la dirección de entrega." },
        { status: 400 },
      );
    }

    const client = await getPostgresPool().connect();
    let transactionOpen = false;
    try {
      await client.query("BEGIN");
      transactionOpen = true;

      const productResult = await client.query<CheckoutProduct>(
        `SELECT id::text AS id, name, price::float8 AS price, stock
         FROM products
         WHERE id = ANY($1::uuid[]) AND is_active = TRUE
         FOR UPDATE`,
        [parsed.data.items.map((item) => item.productId)],
      );
      if (productResult.rows.length !== parsed.data.items.length) {
        await client.query("ROLLBACK");
        transactionOpen = false;
        return NextResponse.json(
          { message: "Uno o más productos ya no están disponibles." },
          { status: 409 },
        );
      }

      const productById = new Map(
        productResult.rows.map((product) => [product.id, product]),
      );
      for (const item of parsed.data.items) {
        const product = productById.get(item.productId);
        if (!product || product.stock < item.quantity) {
          await client.query("ROLLBACK");
          transactionOpen = false;
          return NextResponse.json(
            {
              message: `No hay existencias suficientes de ${product?.name ?? "un producto"}.`,
            },
            { status: 409 },
          );
        }
      }

      const orderItems = parsed.data.items.map((item) => {
        const product = productById.get(item.productId);
        if (!product) throw new Error("No se encontró un producto validado.");
        return {
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });
      const totalInCents = orderItems.reduce(
        (sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity,
        0,
      );
      const total = totalInCents / 100;

      const orderResult = await client.query<{
        id: string;
        created_at: Date;
      }>(
        `INSERT INTO orders (user_id, total_amount, shipping_address)
         VALUES ($1::uuid, $2, $3)
         RETURNING id::text AS id, created_at`,
        [user.id, total, parsed.data.deliveryAddress],
      );
      const createdOrder = orderResult.rows[0];
      if (!createdOrder) throw new Error("PostgreSQL no devolvió el pedido creado.");

      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, product_name, quantity, unit_price)
           VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
          [
            createdOrder.id,
            item.productId,
            item.name,
            item.quantity,
            item.unitPrice,
          ],
        );
        await client.query(
          `UPDATE products
           SET stock = stock - $2, updated_at = NOW()
           WHERE id = $1`,
          [item.productId, item.quantity],
        );
      }

      await client.query("COMMIT");
      transactionOpen = false;
      return NextResponse.json(
        {
          order: {
            id: createdOrder.id,
            items: orderItems,
            total,
            status: "pending",
            createdAt: createdOrder.created_at.toISOString(),
            deliveryAddress: parsed.data.deliveryAddress,
            paymentNote: "Pago por coordinar",
          },
        },
        { status: 201 },
      );
    } catch (error) {
      if (transactionOpen) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("No se pudo revertir la creación del pedido.", rollbackError);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("No se pudo confirmar el pedido.", error);
    return NextResponse.json(
      { message: "No se pudo confirmar el pedido. Inténtalo más tarde." },
      { status: 503 },
    );
  }
}
