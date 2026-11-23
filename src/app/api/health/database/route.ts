import { NextResponse } from "next/server";
import { getPostgresPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { status: "not_configured", message: "Falta configurar DATABASE_URL." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await getPostgresPool().query("SELECT 1");
    return NextResponse.json(
      { status: "ok", database: "connected" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudo comprobar la conexión con PostgreSQL.", error);
    return NextResponse.json(
      { status: "unavailable", message: "No se pudo conectar a la base de datos." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
