import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertAuthConfiguration,
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";
import { getPostgresPool } from "@/lib/db";
import type { User } from "@/types";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(10)
    .refine((value) => new TextEncoder().encode(value).byteLength <= 72),
});

type NewUserRow = User;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "El cuerpo de la solicitud no es JSON válido." },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Revisa tu nombre, correo y contraseña (mínimo 10 caracteres)." },
      { status: 400 },
    );
  }

  try {
    assertAuthConfiguration();
    const passwordHash = await hash(parsed.data.password, 12);
    const result = await getPostgresPool().query<NewUserRow>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, LOWER($2), $3)
       RETURNING id::text AS id, name, email, role`,
      [parsed.data.name, parsed.data.email, passwordHash],
    );
    const user = result.rows[0];
    if (!user) {
      throw new Error("PostgreSQL no devolvió el usuario recién creado.");
    }

    const token = await createSessionToken({ id: user.id, role: user.role });
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "Ya existe una cuenta con ese correo." },
        { status: 409 },
      );
    }

    console.error("No se pudo registrar la cuenta.", error);
    return NextResponse.json(
      { message: "El servicio de autenticación no está disponible." },
      { status: 503 },
    );
  }
}
