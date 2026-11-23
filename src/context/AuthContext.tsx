"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isSessionResponse(value: unknown): value is { user: User } {
  if (typeof value !== "object" || value === null || !("user" in value)) {
    return false;
  }

  const user = value.user;
  if (typeof user !== "object" || user === null) return false;

  return (
    "id" in user &&
    typeof user.id === "string" &&
    "name" in user &&
    typeof user.name === "string" &&
    "email" in user &&
    typeof user.email === "string" &&
    "role" in user &&
    (user.role === "user" || user.role === "admin")
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const hasLocalSessionUpdate = useRef(false);
  const updateUser = useCallback((nextUser: User | null) => {
    hasLocalSessionUpdate.current = true;
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (response.status === 401) return;
        if (!response.ok) {
          throw new Error(`No se pudo restaurar la sesión (${response.status}).`);
        }

        const payload: unknown = await response.json();
        if (!isSessionResponse(payload)) {
          throw new Error("La respuesta de sesión no tiene un formato válido.");
        }

        if (isMounted && !hasLocalSessionUpdate.current) {
          setUser(payload.user);
        }
      } catch (error) {
        if (isMounted) console.error("No se pudo restaurar la sesión.", error);
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(() => ({ user, setUser: updateUser }), [user, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}
