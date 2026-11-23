import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="contact-heading">
        <h2>Contáctanos</h2>
        <p>Nos encantaría saber de ti y ayudarte a sentirte increíble.</p>
      </div>
      <div className="footer-columns">
        <section className="footer-column">
          <h3>Contáctanos</h3>
          <p><span aria-hidden="true">⌖</span> Calle Falsa 123, Ciudad Bella</p>
          <p><span aria-hidden="true">♡</span> 123-456-7890</p>
          <p><span aria-hidden="true">✉</span> hola@rousebeauty.example</p>
          <p><span aria-hidden="true">◎</span> @rousebeautystudio</p>
        </section>
        <section className="footer-column">
          <h3>Links de interés</h3>
          <Link href="/catalogo">✓　Términos y condiciones</Link>
          <Link href="/catalogo">✓　Políticas de envíos</Link>
          <Link href="/catalogo">✓　Preguntas frecuentes</Link>
          <Link href="/catalogo">✓　PQR</Link>
        </section>
        <section className="footer-column">
          <h3>Mi cuenta</h3>
          <Link href="/login">Iniciar sesión</Link>
          <a href="mailto:hola@rousebeauty.example?subject=Cambiar%20contrase%C3%B1a">
            Cambiar contraseña
          </a>
          <Link href="/perfil/pedidos">Pedidos</Link>
        </section>
      </div>
      <div className="footer-social">
        <p>Síguenos en:</p>
        <a
          href="https://instagram.com/rousebeautystudio"
          target="_blank"
          rel="noreferrer"
          aria-label="Rouse Beauty Studio en Instagram"
        >
          ◎
        </a>
        <a
          href="https://www.tiktok.com/"
          target="_blank"
          rel="noreferrer"
          aria-label="TikTok"
        >
          ♪
        </a>
      </div>
      <div className="footer-bottom">
        <Link className="footer-brand" href="/">Rouse Beauty Studio</Link>
        <span>© {new Date().getFullYear()} Rouse Beauty Studio. Todos los derechos reservados.</span>
      </div>
    </footer>
  );
}
