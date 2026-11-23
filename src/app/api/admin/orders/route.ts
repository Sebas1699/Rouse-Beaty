import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminOrders } from "@/lib/orders";

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

    const orders = await getAdminOrders();
    return NextResponse.json(
      { orders },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("No se pudieron consultar las ventas.", error);
    return NextResponse.json(
      { message: "No se pudieron cargar las ventas." },
      { status: 503 },
    );
  }
}
