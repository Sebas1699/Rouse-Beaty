"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function CartDrawer() {
  const { items, isOpen, subtotal, removeItem, setIsOpen } = useCart();

  if (!isOpen) return null;

  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setIsOpen(false);
      }}
    >
      <aside className="cart-drawer" aria-label="Tu bolsa de compras">
        <div className="drawer-heading">
          <h2>Tu bolsa</h2>
          <button
            className="icon-button"
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <p className="empty-cart">Tu bolsa está esperando algo especial.</p>
        ) : (
          <>
            <ul className="drawer-items">
              {items.map(({ product, quantity }) => (
                <li className="drawer-item" key={product.id}>
                  <span>{product.name} × {quantity}</span>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => removeItem(product.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
            <p className="drawer-total">
              Subtotal <strong>{currency.format(subtotal)}</strong>
            </p>
            <Link
              className="button button-dark button-full"
              href="/carrito"
              onClick={() => setIsOpen(false)}
            >
              Ver bolsa
            </Link>
          </>
        )}
      </aside>
    </div>
  );
}
