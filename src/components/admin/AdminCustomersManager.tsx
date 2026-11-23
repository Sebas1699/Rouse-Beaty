"use client";

import { useEffect, useState } from "react";
import { getAdminCustomers, setCustomerActive } from "@/services/api";
import type { CustomerAccount } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function AdminCustomersManager() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyCustomerId, setBusyCustomerId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getAdminCustomers()
      .then(({ customers: result }) => {
        if (active) setCustomers(result);
      })
      .catch((loadError: unknown) => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function toggleActive(customer: CustomerAccount) {
    setError("");
    setBusyCustomerId(customer.id);
    try {
      const { customer: updated } = await setCustomerActive(
        customer.id,
        !customer.isActive,
      );
      setCustomers((current) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );
    } catch (updateError) {
      setError(messageFrom(updateError));
    } finally {
      setBusyCustomerId(null);
    }
  }

  if (isLoading) {
    return <p className="muted-copy" role="status">Cargando clientes...</p>;
  }

  return (
    <section className="admin-management">
      {error && <p className="admin-error" role="alert">{error}</p>}
      {customers.length === 0 ? (
        <div className="placeholder-panel">
          <p>No hay cuentas de cliente registradas.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Correo electrónico</th>
                <th>Registro</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{dateFormatter.format(new Date(customer.createdAt))}</td>
                  <td>{customer.isActive ? "Activo" : "Desactivado"}</td>
                  <td>
                    <button
                      className="text-button"
                      type="button"
                      disabled={busyCustomerId === customer.id}
                      onClick={() => void toggleActive(customer)}
                    >
                      {busyCustomerId === customer.id
                        ? "Guardando..."
                        : customer.isActive ? "Desactivar" : "Reactivar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
