"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export function AuthHeader() {
  const { itemCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const accountHref = user?.role === "admin" ? "/admin/productos" : user ? "/perfil" : "/login";

  return (
    <header className="site-header auth-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="Rouse Beauty Studio, inicio">
          <span>Rouse Beauty</span>
          <small>Studio</small>
        </Link>
        <div className="header-actions">
          <Link
            className="account-link"
            href={accountHref}
            aria-label={user ? `Mi cuenta: ${user.name}` : "Iniciar sesión"}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5.5 20c.5-3.7 2.8-5.7 6.5-5.7s6 2 6.5 5.7" />
            </svg>
          </Link>
          <button
            className="cart-button"
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label={`Abrir carrito, ${itemCount} productos`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l-1 13H6L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <span className="cart-count">{itemCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
