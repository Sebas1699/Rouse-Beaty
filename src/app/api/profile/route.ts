import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import type { UserProfile } from "@/types";

const profileUpdateSchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("personal"),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
  }),
  z.object({
    section: z.literal("address"),
    address: z.string().trim().min(5).max(500),
    addressDetails: z.string().trim().max(500),
  }),
  z.object({
    section: z.literal("payment"),
    paymentHolder: z.string().trim().min(2).max(100),
    paymentBrand: z.enum(["Visa", "Mastercard", "American Express", "Otra"]),
    paymentLast4: z.string().regex(/^\d{4}$/),
    paymentExpirationMonth: z.number().int().min(1).max(12),
    paymentExpirationYear: z.number().int().min(2026).max(2100),
  }),
]);

interface ProfileRow {
  name: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  address_details: string | null;
  payment_holder: string | null;
  payment_brand: string | null;
  payment_last4: string | null;
  payment_expiration_month: number | null;
  payment_expiration_year: number | null;
}

function toProfile(row: ProfileRow): UserProfile {
  return {
    firstName: row.first_name ?? row.name,
    lastName: row.last_name ?? "",
    email: row.email,
    address: row.address ?? "",
    addressDetails: row.address_details ?? "",
    paymentHolder: row.payment_holder ?? "",
    paymentBrand: row.payment_brand ?? "",
    paymentLast4: row.payment_last4 ?? "",
    paymentExpirationMonth: row.payment_expiration_month,
    paymentExpirationYear: row.payment_expiration_year,
  };
}

async function findProfile(userId: string) {
  const result = await getPostgresPool().query<ProfileRow>(
    `SELECT name, email, first_name, last_name, address, address_details,
            payment_holder, payment_brand, payment_last4,
            payment_expiration_month, payment_expiration_year
     FROM users
     WHERE id = $1::uuid AND is_active = TRUE
     LIMIT 1`,
    [userId],
  );
  return result.rows[0];
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "No hay una sesión válida." },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const row = await findProfile(user.id);
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró el perfil de esta cuenta." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { profile: toProfile(row) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudo consultar el perfil.", error);
    return NextResponse.json(
      { message: "No se pudo cargar el perfil. Inténtalo más tarde." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { message: "No hay una sesión válida." },
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

    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Revisa los datos ingresados e inténtalo de nuevo." },
        { status: 400 },
      );
    }

    const pool = getPostgresPool();
    if (parsed.data.section === "personal") {
      await pool.query(
        `UPDATE users
         SET first_name = $2, last_name = $3, name = $4
         WHERE id = $1::uuid AND is_active = TRUE`,
        [
          user.id,
          parsed.data.firstName,
          parsed.data.lastName,
          `${parsed.data.firstName} ${parsed.data.lastName}`,
        ],
      );
    } else if (parsed.data.section === "address") {
      await pool.query(
        `UPDATE users
         SET address = $2, address_details = $3
         WHERE id = $1::uuid AND is_active = TRUE`,
        [user.id, parsed.data.address, parsed.data.addressDetails],
      );
    } else {
      const currentDate = new Date();
      const expiration = new Date(
        parsed.data.paymentExpirationYear,
        parsed.data.paymentExpirationMonth - 1,
      );
      if (expiration < new Date(currentDate.getFullYear(), currentDate.getMonth())) {
        return NextResponse.json(
          { message: "La fecha de vencimiento de la tarjeta ya pasó." },
          { status: 400 },
        );
      }

      await pool.query(
        `UPDATE users
         SET payment_holder = $2, payment_brand = $3, payment_last4 = $4,
             payment_expiration_month = $5, payment_expiration_year = $6
         WHERE id = $1::uuid AND is_active = TRUE`,
        [
          user.id,
          parsed.data.paymentHolder,
          parsed.data.paymentBrand,
          parsed.data.paymentLast4,
          parsed.data.paymentExpirationMonth,
          parsed.data.paymentExpirationYear,
        ],
      );
    }

    const row = await findProfile(user.id);
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró el perfil de esta cuenta." },
        { status: 404 },
      );
    }

    const updatedUser = { ...user, name: row.name };
    return NextResponse.json({ profile: toProfile(row), user: updatedUser });
  } catch (error) {
    console.error("No se pudo actualizar el perfil.", error);
    return NextResponse.json(
      { message: "No se pudo guardar el perfil. Inténtalo más tarde." },
      { status: 503 },
    );
  }
}
