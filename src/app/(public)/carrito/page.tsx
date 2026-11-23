"use client";

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/services/api";

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export default function CartPage() {
  const { items, subtotal, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState("");

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");
    setIsSubmitting(true);
    try {
      const { order } = await createOrder({
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
        deliveryAddress,
      });
      clearCart();
      setConfirmedOrderId(order.id);
      setDeliveryAddress("");
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "No se pudo confirmar el pedido.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section page-section">
      <p className="eyebrow">Tu selección</p>
      <h1 className="page-title">Tu <em>bolsa.</em></h1>
      {confirmedOrderId ? (
        <div className="placeholder-panel">
          <h2>¡Recibimos tu pedido!</h2>
          <p>Tu número de pedido es {confirmedOrderId}.</p>
          <p>No se realizó ningún cobro; nos pondremos en contacto para coordinar el pago.</p>
          <Link className="button button-dark" href="/perfil/pedidos">Ver mis pedidos</Link>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>Tu bolsa está esperando algo especial.</p>
          <Link className="button button-dark" href="/catalogo">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="cart-page">
          <ul className="cart-list">
            {items.map(({ product, quantity }) => (
              <li className="cart-page-item" key={product.id}>
                <span>{product.name} <small>× {quantity}</small></span>
                <span>{currency.format(product.price * quantity)}</span>
                <button className="text-button" type="button" onClick={() => removeItem(product.id)}>
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <p className="cart-page-total">Subtotal <strong>{currency.format(subtotal)}</strong></p>
          <p className="muted-copy">
            El total se confirma con los precios vigentes y existencias al enviar el pedido.
          </p>
          {user?.role === "user" ? (
            <form className="checkout-form" onSubmit={handleCheckout}>
              <h2>Entrega</h2>
              <label className="admin-field" htmlFor="deliveryAddress">
                Dirección de entrega
                <textarea
                  id="deliveryAddress"
                  name="deliveryAddress"
                  autoComplete="street-address"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Calle, número, colonia, ciudad y referencias"
                />
              </label>
              <p className="muted-copy">
                No se hará ningún cobro con tarjeta. El pago se coordinará después de confirmar el pedido.
              </p>
              {checkoutError && (
                <p className="admin-error" role="alert">{checkoutError}</p>
              )}
              <button
                className="profile-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </form>
          ) : (
            <div className="checkout-signin">
              <p>Inicia sesión con una cuenta de cliente para confirmar tu pedido.</p>
              <Link className="button button-dark" href="/login">Iniciar sesión</Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}