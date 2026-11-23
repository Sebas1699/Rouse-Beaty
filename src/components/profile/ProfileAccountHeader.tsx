"use client";

import { useAuth } from "@/context/AuthContext";

export function ProfileAccountHeader() {
  const { user } = useAuth();

  return (
    <div className="account-user-header">
      {user && (
        <p className="account-user-name">
          <span>Sesión iniciada</span>
          <strong>{user.name}</strong>
        </p>
      )}
    </div>
  );
}
