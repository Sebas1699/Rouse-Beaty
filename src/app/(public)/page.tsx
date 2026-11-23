import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Bienvenida</h1>
          <p>A una experiencia completa de belleza y bienestar</p>
          <Link className="hero-link" href="/catalogo">Descubre nuestros servicios</Link>
        </div>
      </section>

      <section className="services-section" id="servicios">
        <h2 className="script-heading">Servicios</h2>
        <div className="service-grid">
          <Link className="service-card" href="/catalogo/maquillaje">
            <span className="service-photo service-photo-makeup" aria-hidden="true" />
            <span className="service-label">Maquillaje Profesional</span>
          </Link>
          <Link className="service-card" href="/catalogo/cuidado-facial">
            <span className="service-photo service-photo-skincare" aria-hidden="true" />
            <span className="service-label">Skincare</span>
          </Link>
          <Link className="service-card" href="/catalogo/cuidado-facial">
            <span className="service-photo service-photo-products" aria-hidden="true" />
            <span className="service-label">Productos de belleza facial</span>
          </Link>
        </div>
      </section>

      <section className="about-section" id="nosotras">
        <div className="about-copy">
          <h2>¿Quiénes somos?</h2>
          <p>
            Somos un espacio dedicado a resaltar tu belleza natural y brindarte
            momentos de bienestar. En Rouse Beauty Studio creamos experiencias
            únicas a través de servicios de maquillaje, cuidado facial y
            tratamientos corporales pensados para que te sientas segura,
            radiante y en armonía contigo misma.
          </p>
        </div>
        <div className="about-photo" role="img" aria-label="Experiencia de cuidado facial en Rouse Beauty Studio" />
      </section>
    </>
  );
}