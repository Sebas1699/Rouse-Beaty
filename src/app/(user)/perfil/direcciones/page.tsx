import { ProfileSectionForm } from "@/components/profile/ProfileSectionForm";

export default function AddressesPage() {
  return (
    <>
      <p className="eyebrow">Tu cuenta</p>
      <h1 className="page-title">Mis <em>direcciones.</em></h1>
      <p className="muted-copy">Guarda tu dirección y las indicaciones para la entrega.</p>
      <ProfileSectionForm section="address" />
    </>
  );
}