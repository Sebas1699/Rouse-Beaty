import "server-only";
import { getPostgresPool } from "@/lib/db";
import type { Product } from "@/types";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: string | number;
  category: string;
  color: string;
  image_url: string;
  stock: number;
  original_price: string | number | null;
  is_active: boolean;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    color: row.color,
    image: row.image_url || undefined,
    stock: row.stock,
    originalPrice: row.original_price === null ? undefined : Number(row.original_price),
    isActive: row.is_active,
  };
}

export async function getProducts(includeInactive = false) {
  const result = await getPostgresPool().query<ProductRow>(
    `SELECT ${productSelectColumns}
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${includeInactive ? "" : "WHERE p.is_active = TRUE"}
     ORDER BY p.created_at DESC, p.name ASC`,
  );
  return result.rows.map(toProduct);
}

export async function getProductById(id: string) {
  const result = await getPostgresPool().query<ProductRow>(
    `SELECT ${productSelectColumns}
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.id = $1::uuid
     LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  return row ? toProduct(row) : null;
}

export function mapProductRow(row: ProductRow): Product {
  return toProduct(row);
}

export const productSelectColumns = `p.id::text AS id, p.slug, p.name, p.description,
  p.price, c.name AS category, p.color, p.image_url, p.stock, p.original_price,
  p.is_active`;
