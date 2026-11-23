"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/services/api";
import type { User } from "@/types";

interface RegisterResponse {
  user: User;
}

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await apiFetch<RegisterResponse>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      setUser(result.user);
      router.replace("/perfil");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo crear la cuenta. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form register-form" onSubmit={handleSubmit}>
      <div className="auth-field">
        <label htmlFor="register-name">Nombre:</label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Tu nombre..."
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={100}
        />
      </div>
      <div className="auth-field">
        <label htmlFor="register-email">Email:</label>
        <input
          id="register-email"
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
        <label htmlFor="register-password">Password:</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 10 caracteres"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={10}
        />
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      <p className="auth-register-prompt">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
