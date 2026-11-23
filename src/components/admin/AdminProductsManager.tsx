"use client";

import { useState, type FormEvent } from "react";
import {
  deleteProduct,
  saveProduct,
  setProductActive,
  type ProductInput,
} from "@/services/api";
import type { Product } from "@/types";

const categories = [
  "Rutinas faciales",
  "Hidratación",
  "Rostro",
  "Ojos",
  "Labios",
  "Cuidado corporal",
] as const;

interface ProductDraft {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  category: string;
  color: string;
  stock: string;
}

const emptyDraft: ProductDraft = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "Rostro",
  color: "#e8a27f",
  stock: "0",
};

const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function toDraft(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    category: product.category,
    color: product.color,
    stock: String(product.stock),
  };
}

export function AdminProductsManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function resetForm() {
    setDraft(emptyDraft);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  function updateDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
    setNotice("");
  }

  function toInput(): ProductInput {
    return {
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Number(draft.price),
      originalPrice: draft.originalPrice ? Number(draft.originalPrice) : null,
      category: draft.category,
      color: draft.color,
      stock: Number(draft.stock),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      const { product } = await saveProduct(toInput(), editingId ?? undefined);
      setProducts((current) => {
        const existingIndex = current.findIndex((item) => item.id === product.id);
        if (existingIndex < 0) return [product, ...current];
        return current.map((item) => item.id === product.id ? product : item);
      });
      setNotice(editingId ? "Producto actualizado." : "Producto creado.");
      setDraft(emptyDraft);
      setEditingId(null);
    } catch (saveError) {
      setError(messageFrom(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    setError("");
    setNotice("");
    setBusyProductId(product.id);
    try {
      if (product.isActive === false) {
        const { product: updated } = await setProductActive(
          product.id,
          true,
          {
            name: product.name,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice ?? null,
            category: product.category,
            color: product.color,
            stock: product.stock,
          },
        );
        setProducts((current) =>
          current.map((item) => item.id === updated.id ? updated : item),
        );
        setNotice("Producto activado.");
      } else {
        await deleteProduct(product.id);
        setProducts((current) =>
          current.map((item) =>
            item.id === product.id ? { ...item, isActive: false } : item,
          ),
        );
        setNotice("Producto desactivado; ya no aparece en la tienda.");
      }
    } catch (actionError) {
      setError(messageFrom(actionError));
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <div className="admin-management">
      <form className="admin-product-form" onSubmit={handleSubmit}>
        <h2>{editingId ? "Editar producto" : "Agregar producto"}</h2>
        <div className="admin-form-grid">
          <label className="admin-field">
            Nombre
            <input
              required
              minLength={2}
              maxLength={120}
              value={draft.name}
              onChange={(event) => updateDraft("name", event.target.value)}
            />
          </label>
          <label className="admin-field">
            Categoría
            <select
              value={draft.category}
              onChange={(event) => updateDraft("category", event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="admin-field admin-field-wide">
            Descripción
            <textarea
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              value={draft.description}
              onChange={(event) => updateDraft("description", event.target.value)}
            />
          </label>
          <label className="admin-field">
            Precio actual (MXN)
            <input
              required
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={draft.price}
              onChange={(event) => updateDraft("price", event.target.value)}
            />
          </label>
          <label className="admin-field">
            Precio anterior (opcional)
            <input
              type="number"
              min="0.01"
              max="1000000"
              step="0.01"
              value={draft.originalPrice}
              onChange={(event) => updateDraft("originalPrice", event.target.value)}
            />
          </label>
          <label className="admin-field">
            Existencias
            <input
              required
              type="number"
              min="0"
              max="1000000"
              step="1"
              value={draft.stock}
              onChange={(event) => updateDraft("stock", event.target.value)}
            />
          </label>
          <label className="admin-field">
            Color de la ficha
            <input
              required
              type="color"
              value={draft.color}
              onChange={(event) => updateDraft("color", event.target.value)}
            />
          </label>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        {notice && <p className="admin-notice" role="status">{notice}</p>}
        <div className="admin-form-actions">
          <button className="profile-submit" type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear producto"}
          </button>
          {editingId && (
            <button className="admin-secondary-button" type="button" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <section className="admin-product-list" aria-labelledby="product-list-heading">
        <h2 id="product-list-heading">Catálogo ({products.length})</h2>
        {products.length === 0 ? (
          <p className="muted-copy">Todavía no hay productos registrados.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      <small>{product.description}</small>
                    </td>
                    <td>{product.category}</td>
                    <td>{currency.format(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>{product.isActive === false ? "Inactivo" : "Activo"}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="text-button"
                          type="button"
                          onClick={() => {
                            setDraft(toDraft(product));
                            setEditingId(product.id);
                            setError("");
                            setNotice("");
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-button"
                          type="button"
                          disabled={busyProductId === product.id}
                          onClick={() => void toggleActive(product)}
                        >
                          {busyProductId === product.id
                            ? "Guardando..."
                            : product.isActive === false ? "Activar" : "Desactivar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
