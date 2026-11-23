import { ProfileSectionForm } from "@/components/profile/ProfileSectionForm";

export default function PaymentMethodsPage() {
  return (
    <>
      <p className="eyebrow">Tu cuenta</p>
      <h1 className="page-title">Métodos de <em>pago.</em></h1>
      <p className="muted-copy">Guarda los datos de referencia de tu tarjeta.</p>
      <ProfileSectionForm section="payment" />
    </>
  );
}