"use client";

import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types";

interface ProtectedSessionGuardProps extends PropsWithChildren {
  requiredRole?: User["role"];
}

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

export function ProtectedSessionGuard({
  children,
  requiredRole,
}: ProtectedSessionGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useAuth();
  const [isVerified, setIsVerified] = useState(false);

  const verifySession = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/me", {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal,
      });
      if (signal.aborted) return;
      if (response.status === 401) {
        setUser(null);
        router.replace("/login");
        return;
      }
      if (!response.ok) {
        throw new Error(`No se pudo validar la sesión (${response.status}).`);
      }

      const payload: unknown = await response.json();
      if (signal.aborted) return;
      if (!isSessionResponse(payload)) {
        throw new Error("La respuesta de sesión no tiene un formato válido.");
      }

      setUser(payload.user);
      if (requiredRole && payload.user.role !== requiredRole) {
        router.replace("/");
        return;
      }

      setIsVerified(true);
    } catch (error) {
      if (signal.aborted) return;
      console.error("Falló la validación de la sesión protegida.", error);
      setUser(null);
      router.replace("/login");
    }
  }, [requiredRole, router, setUser]);

  useEffect(() => {
    let active = true;
    let activeRequest: AbortController | null = null;
    setIsVerified(false);

    const validateIfActive = () => {
      if (!active) return;
      activeRequest?.abort();
      activeRequest = new AbortController();
      void verifySession(activeRequest.signal);
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsVerified(false);
        validateIfActive();
      }
    };
    const handlePopState = () => {
      setIsVerified(false);
      validateIfActive();
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);
    validateIfActive();

    return () => {
      active = false;
      activeRequest?.abort();
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pathname, verifySession]);

  if (!isVerified) {
    return (
      <div className="session-check" role="status">
        Verificando sesión...
      </div>
    );
  }

  return children;
}
