import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getProducts } from "@/lib/products";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <section className="section product-detail">
      <div
        className="product-detail-art"
        style={{ "--product-tone": product.color } as CSSProperties}
        aria-label={product.name}
      >
        <span>ROUSE<br />BEAUTY</span>
      </div>
      <div className="product-detail-copy">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.name}</h1>
        {product.originalPrice && (
          <p className="product-original-price">
            Precio anterior: {currency.format(product.originalPrice)}
          </p>
        )}
        <p className="product-detail-price">{currency.format(product.price)}</p>
        <p>{product.description}</p>
        <p className="stock-note">
          {product.stock > 0 ? "Disponible para ti" : "Agotado"}
        </p>
        <Link className="button button-dark" href="/catalogo">
          Volver al catálogo
        </Link>
      </div>
    </section>
  );
}