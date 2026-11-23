import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import {
  mapProductRow,
  productSelectColumns,
  type ProductRow,
} from "@/lib/products";

const productSchema = z.object({
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
}).refine(
  (product) =>
    product.originalPrice === null || product.originalPrice > product.price,
  { message: "El precio anterior debe ser mayor al precio actual." },
);

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const includeInactive =
      new URL(request.url).searchParams.get("includeInactive") === "true";
    if (includeInactive && !(await requireAdmin())) {
      return NextResponse.json(
        { message: "No tienes permiso para consultar productos inactivos." },
        { status: 403 },
      );
    }

    const result = await getPostgresPool().query<ProductRow>(
      `SELECT ${productSelectColumns}
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${includeInactive ? "" : "WHERE p.is_active = TRUE"}
       ORDER BY p.created_at DESC, p.name ASC`,
    );
    const products = result.rows.map(mapProductRow);
    return NextResponse.json(
      { products },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudo consultar el catálogo.", error);
    return NextResponse.json(
      { message: "No se pudo cargar el catálogo." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
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

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Revisa los datos del producto e inténtalo de nuevo." },
        { status: 400 },
      );
    }

    const pool = getPostgresPool();
    const slugBase = slugify(parsed.data.name) || "producto";
    let slug = slugBase;
    let suffix = 2;
    while (
      (
        await pool.query("SELECT 1 FROM products WHERE slug = $1 LIMIT 1", [
          slug,
        ])
      ).rowCount
    ) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    const result = await pool.query<ProductRow>(
      `INSERT INTO products
         (slug, name, description, price, category_id, image_url, color, stock, original_price)
       VALUES ($1, $2, $3, $4, (SELECT id FROM categories WHERE name = $5),
               '', $6, $7, $8)
       RETURNING id::text AS id`,
      [
        slug,
        parsed.data.name,
        parsed.data.description,
        parsed.data.price,
        parsed.data.category,
        parsed.data.color,
        parsed.data.stock,
        parsed.data.originalPrice,
      ],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error("No se encontró la categoría seleccionada.");
    const productResult = await pool.query<ProductRow>(
      `SELECT ${productSelectColumns}
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1::uuid`,
      [id],
    );
    const row = productResult.rows[0];
    if (!row) throw new Error("PostgreSQL no devolvió el producto creado.");

    return NextResponse.json(
      { product: mapProductRow(row) },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "Ya existe un producto con ese nombre. Intenta de nuevo." },
        { status: 409 },
      );
    }
    console.error("No se pudo crear el producto.", error);
    return NextResponse.json(
      { message: "No se pudo crear el producto." },
      { status: 503 },
    );
  }
}
