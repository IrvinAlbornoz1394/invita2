import Link from "next/link";
import styles from "./landing.module.css";

const FEATURES = [
  { emoji: "🎁", title: "Se abre como un regalo", text: "Confeti, globos y la canción de sus personajes favoritos desde el primer toque." },
  { emoji: "⏳", title: "Cuenta regresiva", text: "Días, horas y minutos para la fiesta, siempre a la vista." },
  { emoji: "📍", title: "Mapa y agenda", text: "Cómo llegar con un toque y recordatorio en el calendario del celular." },
  { emoji: "🎤", title: "Show y extras", text: "Anuncia el show con su horario, la miniferia, los brincolines, la mesa de dulces…" },
  { emoji: "📸", title: "Galería", text: "Las mejores fotos del festejado en un álbum que se ve increíble." },
  { emoji: "💬", title: "Confirmación por WhatsApp", text: "Tus invitados confirman y te llega el mensaje directo." },
];

const STEPS = [
  { n: 1, title: "Elige los personajes", text: "Colores, música e ilustraciones de la temática de la fiesta." },
  { n: 2, title: "Mándanos los datos", text: "Nombre, fecha, lugar, foto y lo que habrá en la fiesta." },
  { n: 3, title: "Comparte el enlace", text: "Lo mandas por WhatsApp y se ve perfecto en cualquier celular." },
];

export default function Landing() {
  const demo = process.env.NEXT_PUBLIC_DEMO_SLUG;
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const quote = contact
    ? `https://wa.me/${contact}?text=${encodeURIComponent("¡Hola! Quiero cotizar una invitación digital para una fiesta.")}`
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.rays} aria-hidden="true" />
        <p className={styles.kicker}>Invitaciones digitales</p>
        <h1 className={styles.title}>
          Tu fiesta empieza
          <br />
          con un regalo
        </h1>
        <p className={styles.lead}>
          Invitaciones web animadas para fiestas infantiles, con los personajes favoritos de tus peques. Sin apps: se abren
          desde un enlace.
        </p>
        <div className={styles.actions}>
          {demo && (
            <Link className={`${styles.btn} ${styles.btnPrimary}`} href={`/${demo}`}>
              Ver un ejemplo
            </Link>
          )}
          {quote && (
            <a className={`${styles.btn} ${styles.btnLight}`} href={quote} target="_blank" rel="noopener">
              Cotizar por WhatsApp
            </a>
          )}
        </div>
      </header>

      <main>
        <section className={styles.section}>
          <h2 className={styles.heading}>Todo lo que tu invitación puede tener</h2>
          <ul className={styles.features}>
            {FEATURES.map((f) => (
              <li key={f.title} className={styles.feature}>
                <span className={styles.emoji} aria-hidden="true">
                  {f.emoji}
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <h2 className={styles.heading}>Así de fácil</h2>
          <ol className={styles.steps}>
            {STEPS.map((s) => (
              <li key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          {quote && (
            <a className={`${styles.btn} ${styles.btnPrimary}`} href={quote} target="_blank" rel="noopener">
              Quiero mi invitación
            </a>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>Invitaciones digitales animadas · Hechas con cariño</p>
      </footer>
    </div>
  );
}
