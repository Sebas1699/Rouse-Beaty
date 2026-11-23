import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    return NextResponse.json(
      { error: "AUTH_JWT_SECRET debe tener al menos 32 bytes." },
      { status: 500 },
    );
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] },
    );

    if (
      !payload.sub ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (request.nextUrl.pathname.startsWith("/admin") && payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/perfil/:path*", "/admin/:path*"],
};