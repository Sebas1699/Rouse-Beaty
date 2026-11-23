import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import type { CustomerAccount } from "@/types";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { message: "Se requiere una cuenta administradora." },
        { status: 403 },
      );
    }

    const result = await getPostgresPool().query<CustomerRow>(
      `SELECT id::text AS id, name, email, is_active, created_at
       FROM users
       WHERE role = 'user'
       ORDER BY created_at DESC`,
    );
    const customers: CustomerAccount[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
    }));
    return NextResponse.json(
      { customers },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudieron consultar las cuentas de clientes.", error);
    return NextResponse.json(
      { message: "No se pudieron cargar las cuentas de clientes." },
      { status: 503 },
    );
  }
}
