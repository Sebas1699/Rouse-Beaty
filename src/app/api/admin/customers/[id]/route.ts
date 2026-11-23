import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import type { CustomerAccount } from "@/types";

const activeSchema = z.object({ isActive: z.boolean() });

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
}

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
    const parsed = activeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "El estado de la cuenta no es válido." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json(
        { message: "El identificador del cliente no es válido." },
        { status: 400 },
      );
    }
    const result = await getPostgresPool().query<CustomerRow>(
      `UPDATE users
       SET is_active = $2
       WHERE id = $1::uuid AND role = 'user'
       RETURNING id::text AS id, name, email, is_active, created_at`,
      [id, parsed.data.isActive],
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró la cuenta de cliente." },
        { status: 404 },
      );
    }
    const customer: CustomerAccount = {
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
    };
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("No se pudo actualizar la cuenta de cliente.", error);
    return NextResponse.json(
      { message: "No se pudo guardar el estado de la cuenta." },
      { status: 503 },
    );
  }
}
