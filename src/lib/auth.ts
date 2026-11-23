import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getPostgresPool } from "@/lib/db";
import type { User } from "@/types";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getJwtSigningKey() {
  const secret = process.env.AUTH_JWT_SECRET;
  const key = secret ? new TextEncoder().encode(secret) : null;

  if (!key || key.byteLength < 32) {
    throw new Error("AUTH_JWT_SECRET debe tener al menos 32 bytes.");
  }

  return key;
}

export function assertAuthConfiguration() {
  getJwtSigningKey();
}

export async function createSessionToken(user: Pick<User, "id" | "role">) {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSigningKey());
}

export async function validateSessionToken(
  token: string | undefined,
): Promise<User | null> {
  if (!token) return null;

  const key = getJwtSigningKey();
  let subject: string;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    subject = payload.sub;
  } catch {
    return null;
  }

  const result = await getPostgresPool().query<User>(
    `SELECT id::text AS id, name, email, role
     FROM users
     WHERE id = $1::uuid AND is_active = TRUE
     LIMIT 1`,
    [subject],
  );
  const user = result.rows[0];

  if (!user || (user.role !== "user" && user.role !== "admin")) {
    return null;
  }

  return user;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return validateSessionToken(token);
}
