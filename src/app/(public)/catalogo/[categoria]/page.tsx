import { notFound } from "next/navigation";
import { ProductCard } from "@/components/shop/ProductCard";
import { catalogPages } from "@/data/catalog";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function CategoryCatalogPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  const page = catalogPages[categoria];
  if (!page) notFound();
  const products = await getProducts();

  return (
    <section className="section page-section">
      <p className="eyebrow">Rouse Beauty · Catálogo</p>
      <h1 className="page-title">{page.title} <em>.</em></h1>
      <p className="page-intro">{page.description}</p>

      {page.groups.map((group) => {
        const groupProducts = products.filter((product) =>
          group.discountedOnly
            ? product.originalPrice !== undefined && product.originalPrice > product.price
            : product.category === group.category,
        );

        return (
          <section className="catalog-group" key={group.title}>
            <h2 className="catalog-group-title">{group.title}</h2>
            {groupProducts.length > 0 ? (
              <div className="product-grid catalog-grid">
                {groupProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="page-intro">Pronto agregaremos productos a esta sección.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}
