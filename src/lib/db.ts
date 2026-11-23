import "server-only";
import { Pool } from "pg";

type GlobalWithPostgresPool = typeof globalThis & {
  postgresPool?: Pool;
};

const globalForPostgres = globalThis as GlobalWithPostgresPool;

export function getPostgresPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  if (!globalForPostgres.postgresPool) {
    const pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });

    pool.on("error", (error) => {
      console.error("Error inesperado en el pool de PostgreSQL.", error);
    });

    globalForPostgres.postgresPool = pool;
  }

  return globalForPostgres.postgresPool;
}
