import { ProfileSectionForm } from "@/components/profile/ProfileSectionForm";

export default function ProfilePage() {
  return (
    <>
      <p className="eyebrow">Tu espacio</p>
      <h1 className="page-title">Mis <em>datos.</em></h1>
      <p className="muted-copy">Actualiza el nombre y apellidos de tu cuenta.</p>
      <ProfileSectionForm section="personal" />
    </>
  );
}