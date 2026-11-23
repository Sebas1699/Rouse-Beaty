import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import { getProductById } from "@/lib/products";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1000),
  price: z.number().positive().max(1_000_000),
  category: z.enum([
    "Rutinas faciales",
    "Hidratación",
    "Rostro",
    "Ojos",
    "Labios",
    "Cuidado corporal",
  ]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  stock: z.number().int().min(0).max(1_000_000),
  originalPrice: z.number().positive().max(1_000_000).nullable(),
  isActive: z.boolean().optional(),
}).refine(
  (product) =>
    product.originalPrice === null || product.originalPrice > product.price,
  { message: "El precio anterior debe ser mayor al precio actual." },
);

async function isAdmin() {
  return (await getCurrentUser())?.role === "admin";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) {
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

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Revisa los datos del producto e inténtalo de nuevo." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "El identificador del producto no es válido." },
        { status: 400 },
      );
    }
    const pool = getPostgresPool();
    const result = await pool.query<{ id: string }>(
      `UPDATE products
       SET name = $2, description = $3, price = $4,
           category_id = (SELECT id FROM categories WHERE name = $5),
           color = $6, stock = $7, original_price = $8,
           is_active = COALESCE($9, is_active), updated_at = NOW()
       WHERE id = $1::uuid
       RETURNING id::text AS id`,
      [
        id,
        parsed.data.name,
        parsed.data.description,
        parsed.data.price,
        parsed.data.category,
        parsed.data.color,
        parsed.data.stock,
        parsed.data.originalPrice,
        parsed.data.isActive ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró el producto." },
        { status: 404 },
      );
    }

    const product = await getProductById(row.id);
    if (!product) {
      return NextResponse.json(
        { message: "No se encontró el producto actualizado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("No se pudo actualizar el producto.", error);
    return NextResponse.json(
      { message: "No se pudo guardar el producto." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { message: "Se requiere una cuenta administradora." },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "El identificador del producto no es válido." },
        { status: 400 },
      );
    }
    const result = await getPostgresPool().query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1::uuid AND is_active = TRUE`,
      [id],
    );
    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "No se encontró el producto activo." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("No se pudo desactivar el producto.", error);
    return NextResponse.json(
      { message: "No se pudo desactivar el producto." },
      { status: 503 },
    );
  }
}
