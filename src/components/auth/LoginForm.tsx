"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/services/api";
import type { User } from "@/types";

interface LoginResponse {
  user: User;
}

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      setUser(result.user);
      router.replace(result.user.role === "admin" ? "/admin/productos" : "/perfil");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo iniciar sesión. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="login-email">Email:</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ingresa tu email..."
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          maxLength={254}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="login-password">Password:</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ingresa tu contraseña..."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <Link
        className="forgot-password"
        href="mailto:hola@rousebeauty.example?subject=Recuperar%20contrase%C3%B1a"
      >
        ¿Olvidaste tu contraseña?
      </Link>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="auth-register-prompt">¿Aún no te has registrado?</p>
      <Link className="auth-register-link" href="/registro">
        Regístrate
      </Link>
    </form>
  );
}
