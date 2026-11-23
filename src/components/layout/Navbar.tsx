"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount, setIsOpen } = useCart();
  const { user } = useAuth();
  const accountHref = user?.role === "admin" ? "/admin/productos" : user ? "/perfil" : "/login";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="Rouse Beauty, inicio">
          <span>Rouse Beauty</span>
          <small>Studio</small>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-navigation"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={`main-nav${mobileMenuOpen ? " is-open" : ""}`}
          id="main-navigation"
          aria-label="Navegación principal"
        >
          <Link className="nav-link" href="/" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <details className="nav-dropdown">
            <summary>Cuidado facial <span aria-hidden="true">⌄</span></summary>
            <div className="dropdown-menu">
              <Link href="/catalogo/cuidado-facial" onClick={() => setMobileMenuOpen(false)}>Todo cuidado facial</Link>
              <Link href="/catalogo/rutinas-faciales" onClick={() => setMobileMenuOpen(false)}>Rutinas faciales</Link>
              <Link href="/catalogo/hidratacion" onClick={() => setMobileMenuOpen(false)}>Hidratación</Link>
            </div>
          </details>
          <details className="nav-dropdown">
            <summary>Maquillaje <span aria-hidden="true">⌄</span></summary>
            <div className="dropdown-menu">
              <Link href="/catalogo/maquillaje" onClick={() => setMobileMenuOpen(false)}>Todo maquillaje</Link>
              <Link href="/catalogo/rostro" onClick={() => setMobileMenuOpen(false)}>Rostro</Link>
              <Link href="/catalogo/ojos" onClick={() => setMobileMenuOpen(false)}>Ojos</Link>
              <Link href="/catalogo/labios" onClick={() => setMobileMenuOpen(false)}>Labios</Link>
            </div>
          </details>
          <details className="nav-dropdown">
            <summary>Corporal <span aria-hidden="true">⌄</span></summary>
            <div className="dropdown-menu">
              <Link href="/catalogo/cuidado-corporal" onClick={() => setMobileMenuOpen(false)}>Cuidado corporal</Link>
            </div>
          </details>
          <Link className="nav-link" href="/catalogo/descuentos" onClick={() => setMobileMenuOpen(false)}>
            Descuentos
          </Link>
        </nav>
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
