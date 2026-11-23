"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { getProfile, saveProfile } from "@/services/api";
import type { UserProfile } from "@/types";

type ProfileSection = "personal" | "address" | "payment";

const emptyProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  addressDetails: "",
  paymentHolder: "",
  paymentBrand: "",
  paymentLast4: "",
  paymentExpirationMonth: null,
  paymentExpirationYear: null,
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function ProfileSectionForm({ section }: { section: ProfileSection }) {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await getProfile();
      setProfile(result.profile);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      let result;
      if (section === "personal") {
        result = await saveProfile({
          section,
          firstName: profile.firstName,
          lastName: profile.lastName,
        });
      } else if (section === "address") {
        result = await saveProfile({
          section,
          address: profile.address,
          addressDetails: profile.addressDetails,
        });
      } else {
        if (profile.paymentExpirationMonth === null || profile.paymentExpirationYear === null) {
          throw new Error("Indica el mes y año de vencimiento.");
        }
        result = await saveProfile({
          section,
          paymentHolder: profile.paymentHolder,
          paymentBrand: profile.paymentBrand,
          paymentLast4: profile.paymentLast4,
          paymentExpirationMonth: profile.paymentExpirationMonth,
          paymentExpirationYear: profile.paymentExpirationYear,
        });
      }

      setProfile(result.profile);
      if (user) setUser({ ...user, name: result.user.name });
      setSuccess("Tus datos se guardaron correctamente.");
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="muted-copy" role="status">Cargando tus datos...</p>;
  }

  if (error && !profile.email) {
    return (
      <div className="profile-message" role="alert">
        <p>{error}</p>
        <button className="profile-submit" type="button" onClick={() => void loadProfile()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      {section === "personal" && (
        <>
          <div className="profile-field">
            <label htmlFor="firstName">Nombre</label>
            <input
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              maxLength={100}
              required
              value={profile.firstName}
              onChange={(event) => update("firstName", event.target.value)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="lastName">Apellidos</label>
            <input
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              maxLength={100}
              required
              value={profile.lastName}
              onChange={(event) => update("lastName", event.target.value)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={profile.email} readOnly />
          </div>
        </>
      )}

      {section === "address" && (
        <>
          <div className="profile-field">
            <label htmlFor="address">Dirección</label>
            <textarea
              id="address"
              name="address"
              autoComplete="street-address"
              maxLength={500}
              required
              rows={3}
              value={profile.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Calle, número, colonia y ciudad"
            />
          </div>
          <div className="profile-field">
            <label htmlFor="addressDetails">Indicaciones adicionales</label>
            <textarea
              id="addressDetails"
              name="addressDetails"
              maxLength={500}
              rows={3}
              value={profile.addressDetails}
              onChange={(event) => update("addressDetails", event.target.value)}
              placeholder="Conjunto o condominio, torre, interior, referencias..."
            />
            <small>Opcional. Agrega referencias para encontrar tu domicilio.</small>
          </div>
        </>
      )}

      {section === "payment" && (
        <>
          <div className="profile-field">
            <label htmlFor="paymentHolder">Nombre del titular</label>
            <input
              id="paymentHolder"
              name="paymentHolder"
              autoComplete="cc-name"
              maxLength={100}
              required
              value={profile.paymentHolder}
              onChange={(event) => update("paymentHolder", event.target.value)}
            />
          </div>
          <div className="profile-field">
            <label htmlFor="paymentBrand">Tipo de tarjeta</label>
            <select
              id="paymentBrand"
              name="paymentBrand"
              required
              value={profile.paymentBrand}
              onChange={(event) => update("paymentBrand", event.target.value)}
            >
              <option value="">Selecciona una opción</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
              <option value="Otra">Otra</option>
            </select>
          </div>
          <div className="profile-field">
            <label htmlFor="paymentLast4">Últimos 4 dígitos</label>
            <input
              id="paymentLast4"
              name="paymentLast4"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{4}"
              maxLength={4}
              required
              value={profile.paymentLast4}
              onChange={(event) => update("paymentLast4", event.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="profile-field profile-expiration">
            <label htmlFor="paymentExpirationMonth">Vencimiento</label>
            <div className="profile-expiration-inputs">
              <select
                id="paymentExpirationMonth"
                name="paymentExpirationMonth"
                required
                value={profile.paymentExpirationMonth ?? ""}
                onChange={(event) =>
                  update(
                    "paymentExpirationMonth",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
              >
                <option value="">Mes</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {String(index + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <input
                aria-label="Año de vencimiento"
                name="paymentExpirationYear"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                type="number"
                min={new Date().getFullYear()}
                max={2100}
                required
                value={profile.paymentExpirationYear ?? ""}
                onChange={(event) =>
                  update(
                    "paymentExpirationYear",
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="Año"
              />
            </div>
          </div>
          <p className="profile-note">
            Por seguridad, no ingreses el número completo ni el CVV. Aquí solo guardamos
            datos de referencia; para pagar se requiere un proveedor de pagos seguro.
          </p>
        </>
      )}

      {error && <p className="profile-error" role="alert">{error}</p>}
      {success && <p className="profile-success" role="status">{success}</p>}
      <button className="profile-submit" type="submit" disabled={isSaving}>
        {isSaving ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
