import { AdminProductsManager } from "@/components/admin/AdminProductsManager";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts(true);

  return (
    <>
      <p className="eyebrow">Panel de administración</p>
      <h1 className="page-title">Productos</h1>
      <AdminProductsManager initialProducts={products} />
    </>
  );
}