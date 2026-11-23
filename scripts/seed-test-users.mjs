import { readFile } from "node:fs/promises";
import { hash } from "bcryptjs";
import pg from "pg";

const { Pool } = pg;

const testUsers = [
  {
    name: "Usuario de prueba",
    email: "usuario@gmail.com",
    password: "123456",
    role: "user",
  },
  {
    name: "Administrador de prueba",
    email: "admin@gmail.com",
    password: "123456",
    role: "admin",
  },
];

async function seedTestUsers() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("No se pueden sembrar usuarios de prueba en producción.");
  }
  if (process.env.ALLOW_TEST_USER_SEED !== "1") {
    throw new Error(
      "Para confirmar la operación, define ALLOW_TEST_USER_SEED=1.",
    );
  }
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      "Configura TEST_DATABASE_URL con la URL de tu base de datos de pruebas.",
    );
  }
  if (process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL debe coincidir con DATABASE_URL para que la aplicación pueda usar los usuarios.",
    );
  }

  const pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const schema = await readFile(
        new URL("../database/schema.sql", import.meta.url),
        "utf8",
      );
      await client.query(schema);

      for (const user of testUsers) {
        const passwordHash = await hash(user.password, 12);
        await client.query(
          `INSERT INTO users (name, email, password_hash, role, is_active)
           VALUES ($1, LOWER($2), $3, $4, TRUE)
           ON CONFLICT ((LOWER(email))) DO UPDATE
           SET name = EXCLUDED.name,
               password_hash = EXCLUDED.password_hash,
               role = EXCLUDED.role,
               is_active = TRUE`,
          [user.name, user.email, passwordHash, user.role],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    console.log("Usuarios de prueba creados/actualizados:");
    console.log("usuario@gmail.com (rol user)");
    console.log("admin@gmail.com (rol admin)");
    console.log("Contraseña para ambos: 123456");
  } finally {
    await pool.end();
  }
}

seedTestUsers().catch((error) => {
  console.error("No se pudieron crear los usuarios de prueba.", error);
  process.exitCode = 1;
});
