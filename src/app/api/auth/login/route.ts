import { compare } from "bcryptjs";
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

const passwordSchema = z
  .string()
  .min(1)
  .refine((value) => new TextEncoder().encode(value).byteLength <= 72);

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: passwordSchema,
});

interface LoginRow extends User {
  password_hash: string;
  is_active: boolean;
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Ingresa un correo y una contraseña válidos." },
      { status: 400 },
    );
  }

  try {
    assertAuthConfiguration();
    const result = await getPostgresPool().query<LoginRow>(
      `SELECT id::text AS id, name, email, password_hash, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [parsed.data.email],
    );
    const user = result.rows[0];

    if (
      !user ||
      !user.is_active ||
      (user.role !== "user" && user.role !== "admin") ||
      !(await compare(parsed.data.password, user.password_hash))
    ) {
      return NextResponse.json(
        { message: "El correo o la contraseña no son correctos." },
        { status: 401 },
      );
    }

    const token = await createSessionToken({ id: user.id, role: user.role });
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      } satisfies User,
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("No se pudo iniciar sesión.", error);
    return NextResponse.json(
      { message: "El servicio de autenticación no está disponible." },
      { status: 503 },
    );
  }
}
