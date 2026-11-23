import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { catalogLinks } from "@/data/catalog";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <section className="section page-section">
      <p className="eyebrow">Rouse Beauty</p>
      <h1 className="page-title">El catálogo <em>completo.</em></h1>
      <p className="page-intro">Favoritos para jugar, crear y sentirte bien.</p>
      <nav className="catalog-links" aria-label="Categorías del catálogo">
        {catalogLinks.map((category) => (
          <Link className="catalog-link" href={category.href} key={category.href}>
            {category.label}
          </Link>
        ))}
      </nav>
      <div className="product-grid catalog-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}