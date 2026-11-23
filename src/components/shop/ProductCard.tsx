"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function ProductCard({ product }: { product: Product }) {
  const { addItem, setIsOpen, items } = useCart();
  const quantityInCart =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const isOutOfStock = product.stock <= quantityInCart;

  return (
    <article className="product-card">
      <Link
        className="product-art"
        href={`/producto/${product.slug}`}
        style={{ "--product-tone": product.color } as CSSProperties}
        aria-label={`Ver ${product.name}`}
      >
        <span className="product-category">{product.category}</span>
        <span className="product-art-label">ROUSE<br />BEAUTY</span>
      </Link>
      <div className="product-meta">
        <div>
          <Link className="product-name" href={`/producto/${product.slug}`}>
            {product.name}
          </Link>
          {product.originalPrice && (
            <p className="product-original-price">{currency.format(product.originalPrice)}</p>
          )}
          <p className="product-price">{currency.format(product.price)}</p>
        </div>
        <button
          className="add-button"
          type="button"
          aria-label={
            isOutOfStock
              ? `${product.name} agotado`
              : `Agregar ${product.name} a la bolsa`
          }
          disabled={isOutOfStock}
          onClick={() => {
            addItem(product);
            setIsOpen(true);
          }}
        >
          {isOutOfStock ? "−" : "+"}
        </button>
      </div>
    </article>
  );
}
