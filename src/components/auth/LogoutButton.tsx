"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function LogoutButton() {
  const { setUser } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("No se pudo cerrar la sesión.");
      }

      setUser(null);
      window.location.replace("/login");
    } catch {
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="logout-control">
      <button
        className="logout-button"
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
      </button>
      {error && <p className="logout-error" role="alert">{error}</p>}
    </div>
  );
}
