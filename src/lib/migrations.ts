import "server-only";
import type { PoolClient } from "pg";
import { getPostgresPool } from "@/lib/db";
import { products } from "@/data/products";

interface Migration {
  id: string;
  up: (client: PoolClient) => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: "001-initial-schema-and-profile",
    up: (client) => client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user'
          CHECK (role IN ('user', 'admin')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
        ON users (LOWER(email));

      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS last_name TEXT,
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS address_details TEXT,
        ADD COLUMN IF NOT EXISTS payment_holder TEXT,
        ADD COLUMN IF NOT EXISTS payment_brand TEXT,
        ADD COLUMN IF NOT EXISTS payment_last4 TEXT,
        ADD COLUMN IF NOT EXISTS payment_expiration_month SMALLINT,
        ADD COLUMN IF NOT EXISTS payment_expiration_year SMALLINT;
    `).then(() => undefined),
  },
  {
    id: "002-product-catalog",
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL UNIQUE,
          slug VARCHAR(140) NOT NULL UNIQUE
        );

        INSERT INTO categories (name, slug)
        VALUES
          ('Rutinas faciales', 'rutinas-faciales'),
          ('Hidratación', 'hidratacion'),
          ('Rostro', 'rostro'),
          ('Ojos', 'ojos'),
          ('Labios', 'labios'),
          ('Cuidado corporal', 'cuidado-corporal')
        ON CONFLICT (slug) DO NOTHING;

        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category_id INTEGER REFERENCES categories(id),
          slug TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
          image_url TEXT NOT NULL DEFAULT '',
          stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        ALTER TABLE products
          ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#e8a27f',
          ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2)
            CHECK (original_price IS NULL OR original_price > price);

        CREATE INDEX IF NOT EXISTS products_category_active_idx
          ON products (category_id, is_active);
      `);

      for (const product of products) {
        const categorySlug = product.category
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        await client.query(
          `INSERT INTO products
             (slug, name, description, price, category_id, image_url, color, stock, original_price)
           SELECT $1, $2, $3, $4, id, '', $5, $6, $7
           FROM categories
           WHERE slug = $8
           ON CONFLICT (slug) DO NOTHING`,
          [
            product.slug,
            product.name,
            product.description,
            product.price,
            product.color,
            product.stock,
            product.originalPrice ?? null,
            categorySlug,
          ],
        );
      }
    },
  },
  {
    id: "003-checkout-orders",
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          shipping_address TEXT NOT NULL,
          payment_method_summary VARCHAR(255) NOT NULL DEFAULT 'Pago por coordinar',
          total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        ALTER TABLE orders
          ADD COLUMN IF NOT EXISTS payment_method_summary VARCHAR(255) NOT NULL DEFAULT 'Pago por coordinar',
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
        ALTER TABLE orders
          ADD CONSTRAINT orders_status_check
          CHECK (status IN ('PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

        CREATE INDEX IF NOT EXISTS orders_user_created_idx
          ON orders (user_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS orders_created_idx
          ON orders (created_at DESC);
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id UUID NOT NULL REFERENCES products(id),
          product_name TEXT NOT NULL,
          quantity INTEGER NOT NULL CHECK (quantity > 0),
          unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
          subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED
        )
      `);
      await client.query(`
        ALTER TABLE order_items
          ADD COLUMN IF NOT EXISTS product_name TEXT;

        UPDATE order_items items
        SET product_name = products.name
        FROM products
        WHERE products.id = items.product_id
          AND items.product_name IS NULL;

        ALTER TABLE order_items ALTER COLUMN product_name SET NOT NULL;
      `);
    },
  },
  {
    id: "004-product-sale-price-check",
    up: (client) => client.query(`
      ALTER TABLE products
        DROP CONSTRAINT IF EXISTS products_original_price_check;
      ALTER TABLE products
        ADD CONSTRAINT products_original_price_check
        CHECK (original_price IS NULL OR original_price > price);
    `).then(() => undefined),
  },
];

async function rollback(client: PoolClient) {
  try {
    await client.query("ROLLBACK");
  } catch (error) {
    console.error("No se pudo revertir la transacción de migraciones.", error);
  }
}

export async function runDatabaseMigrations() {
  const client = await getPostgresPool().connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(147258369, 258369147)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const appliedResult = await client.query<{ id: string }>(
      "SELECT id FROM schema_migrations",
    );
    const applied = new Set(appliedResult.rows.map((row) => row.id));

    for (const migration of migrations) {
      if (applied.has(migration.id)) continue;

      await migration.up(client);
      await client.query(
        "INSERT INTO schema_migrations (id) VALUES ($1)",
        [migration.id],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    client.release();
  }
}
