import Image, { type StaticImageData } from "next/image";
import { BrandIcon, Isologo, Logo, type BrandIconName } from "@/components/brand/icons";
import { PartyScene, type PartySceneClasses } from "@/components/brand/PartyScene";
import { getLandingThemes } from "@/lib/data";
import apertura from "../../public/landing/pantalla-apertura.jpg";
import confirmar from "../../public/landing/pantalla-confirmar.jpg";
import cuenta from "../../public/landing/pantalla-cuenta.jpg";
import fecha from "../../public/landing/pantalla-fecha.jpg";
import portada from "../../public/landing/pantalla-portada.jpg";
import styles from "./landing.module.css";

const SCENE_CLASSES: PartySceneClasses = {
  scene: styles.scene,
  strings: styles.sceneStrings,
  popA: styles.scenePopA,
  popB: styles.scenePopB,
  flame: styles.sceneFlame,
  dotA: styles.sceneDotA,
  dotB: styles.sceneDotB,
  ribbon: styles.sceneRibbon,
};

const FEATURES: { icon: BrandIconName; title: string; text: string }[] = [
  { icon: "gift", title: "Apertura sorpresa", text: "Se abre como regalo, como globo que revienta o con una imagen, con confeti." },
  { icon: "music", title: "Su canción", text: "Suena la música de sus personajes favoritos desde el primer toque." },
  { icon: "clock", title: "Cuenta regresiva", text: "Días, horas y minutos para la fiesta, siempre a la vista." },
  { icon: "pin", title: "Mapa y agenda", text: "Cómo llegar con un toque y recordatorio en el calendario del celular." },
  { icon: "mic", title: "Show", text: "Anuncia el show con su horario, descripción y los personajes que vendrán." },
  { icon: "party", title: "Extras", text: "Miniferia, brincolines, alberca, mesa de dulces, piñata… lo que habrá." },
  { icon: "image", title: "Galería", text: "Las mejores fotos del festejado en un álbum que se ve increíble." },
  { icon: "chat", title: "Confirmación", text: "Tus invitados confirman por WhatsApp y te llega el mensaje directo." },
];

const STEPS = [
  { title: "Escoge los personajes", text: "Los favoritos de tu peque: ponen los colores, la música y las ilustraciones." },
  { title: "Mándanos los datos", text: "Por WhatsApp: nombre, fecha, lugar, foto y lo que habrá en la fiesta." },
  { title: "Comparte el enlace", text: "Te la entregamos lista; la reenvías por WhatsApp y se abre en cualquier celular." },
];

const FAQ = [
  {
    q: "¿Mis invitados tienen que descargar algo?",
    a: "No. Es una página web: se abre desde el enlace que les mandas, en cualquier celular, iPhone o Android.",
  },
  {
    q: "¿Cómo confirman si van?",
    a: "Desde la misma invitación: escriben su nombre, cuántos vienen y te llega el mensaje por WhatsApp.",
  },
  {
    q: "¿Quién arma la invitación?",
    a: "Nosotros. Tú nos mandas los datos de la fiesta por WhatsApp y te entregamos el enlace listo para compartir.",
  },
  {
    q: "¿Se puede cambiar algo después de enviarla?",
    a: "Sí. Si cambia la hora o el lugar, la actualizamos y todos ven el cambio en el mismo enlace.",
  },
  {
    q: "¿Qué personajes tienen?",
    a: "Los que ves en esta página ya están listos. Si tu peque quiere otro, pregúntanos por WhatsApp.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Escríbenos por WhatsApp con los datos de la fiesta y te pasamos la cotización.",
  },
];

/** Respuestas de ejemplo que llegan al confirmar (ilustrativas). */
const RSVPS = [
  { name: "Familia Pérez", note: "Sí van · 4 personas", ok: true },
  { name: "Ana y Leo", note: "Sí van · 2 personas", ok: true },
  { name: "Familia Ruiz", note: "No podrán ir", ok: false },
];

function waLink(contact: string, text: string) {
  return `https://wa.me/${contact}?text=${encodeURIComponent(text)}`;
}

function Phone({
  src,
  alt,
  className = "",
  priority = false,
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={`${styles.phone} ${className}`}>
      <span className={styles.island} aria-hidden="true" />
      <Image src={src} alt={alt} sizes="(min-width: 1100px) 280px, 46vw" priority={priority} placeholder="blur" />
    </div>
  );
}

export default async function Landing() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const quote = contact ? waLink(contact, "¡Hola! Quiero cotizar una invitación digital para una fiesta.") : null;
  const themes = await getLandingThemes();
  // "Ver un ejemplo": la invitación configurada o, si no hay, la demo del primer personaje
  const demo = process.env.NEXT_PUBLIC_DEMO_SLUG || (themes[0] ? `demo/${themes[0].id}` : null);
  const group = themes.find((t) => t.groupUrl)?.groupUrl ?? null;

  // Sin WhatsApp configurado, el ejemplo pasa a ser la acción principal
  const primary = quote
    ? { href: quote, label: "Cotizar por WhatsApp", external: true }
    : demo
      ? { href: `/${demo}`, label: "Ver un ejemplo", external: false }
      : null;
  const secondary = quote && demo ? { href: `/${demo}`, label: "Ver un ejemplo" } : null;
  const ext = { target: "_blank", rel: "noopener" };

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <a href="#inicio" aria-label="invita2, inicio" className={styles.logoLink}>
          <Logo className={styles.logo} priority />
        </a>
        <nav className={styles.links} aria-label="Secciones">
          <a href="#funciones">Funciones</a>
          <a href="#como-funciona">Cómo funciona</a>
          {themes.length > 0 && <a href="#personajes">Personajes</a>}
          <a href="#preguntas">Preguntas</a>
        </nav>
        <div className={styles.navActions}>
          {secondary && (
            <a className={`${styles.btn} ${styles.btnSand} ${styles.btnSm} ${styles.hideMobile}`} href={secondary.href}>
              {secondary.label}
            </a>
          )}
          {primary && (
            <a
              className={`${styles.btn} ${styles.btnPurple} ${styles.btnSm}`}
              href={primary.href}
              {...(primary.external ? ext : {})}
            >
              {quote ? "Cotizar" : primary.label}
            </a>
          )}
        </div>
      </header>

      <main id="inicio">
        {/* ============ Portada ============ */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Invitaciones que se abren como regalo</h1>

          <div className={styles.heroPitch}>
            <p className={styles.heroLead}>
              Invitaciones web animadas para fiestas infantiles, con música, cuenta regresiva, mapa y confirmación por
              WhatsApp. Sin apps: se abren desde un enlace.
            </p>
            <div className={styles.actions}>
              {primary && (
                <a className={`${styles.btn} ${styles.btnPurple}`} href={primary.href} {...(primary.external ? ext : {})}>
                  {primary.external && <BrandIcon name="chat" />}
                  {primary.label}
                </a>
              )}
              {secondary && (
                <a className={`${styles.btn} ${styles.btnSand}`} href={secondary.href}>
                  {secondary.label}
                </a>
              )}
            </div>
            <ul className={styles.heroChecks}>
              <li>
                <BrandIcon name="check" /> Se abre en cualquier celular
              </li>
              <li>
                <BrandIcon name="check" /> Nosotros la armamos
              </li>
            </ul>
          </div>

          <div className={styles.heroDevices}>
            <span className={styles.halo} aria-hidden="true" />
            <Phone
              src={portada}
              alt="Portada de una invitación de ejemplo: «¡Cumplo 5 años!, Sofía»"
              className={styles.phoneBack}
              priority
            />
            <Phone
              src={cuenta}
              alt="Cuenta regresiva de la invitación: días, horas, minutos y segundos"
              className={styles.phoneFront}
              priority
            />

            <div className={styles.rsvpCard}>
              <p className={styles.rsvpHead}>
                Confirmaciones <span>Ejemplo</span>
              </p>
              <ul>
                {RSVPS.map((r) => (
                  <li key={r.name}>
                    <span className={`${styles.rsvpDot} ${r.ok ? styles.rsvpOk : styles.rsvpNo}`} aria-hidden="true">
                      <BrandIcon name={r.ok ? "check" : "plus"} />
                    </span>
                    <span>
                      <b>{r.name}</b>
                      {r.note}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============ Personajes ============ */}
        {themes.length > 0 && (
          <section className={styles.strip} id="personajes" aria-labelledby="personajes-t">
            <h2 id="personajes-t" className={styles.stripTitle}>
              Personajes disponibles
            </h2>
            <p className={styles.stripHint}>Toca uno para ver su invitación de ejemplo</p>
            <ul className={styles.stripList}>
              {themes.map((t) => (
                <li key={t.id}>
                  <a className={styles.stripDemo} href={`/demo/${t.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.logoUrl ?? t.cardUrl ?? ""} alt="" loading="lazy" />
                    <span>{t.name}</span>
                  </a>
                </li>
              ))}
              {contact && (
                <li>
                  <a className={styles.stripAsk} href={waLink(contact, "¡Hola! ¿Tienen invitación con el tema de…?")} {...ext}>
                    <BrandIcon name="plus" />
                    ¿Otro personaje?
                  </a>
                </li>
              )}
            </ul>
          </section>
        )}

        {/* ============ Como una app ============ */}
        <section className={styles.about}>
          <div className={styles.aboutText}>
            <h2 className={styles.h2}>Se siente como una app, pero no hay que descargar nada</h2>
            <p className={styles.p}>
              Tus invitados tocan el enlace y la invitación se abre con su canción, su cuenta regresiva y todo lo de la
              fiesta. Tú no tienes que diseñar nada.
            </p>
            <div className={styles.miniCards}>
              <div className={styles.miniCard}>
                <span className={styles.miniIcon}>
                  <BrandIcon name="hand" />
                </span>
                <h3>La armamos por ti</h3>
                <p>Nos mandas los datos por WhatsApp y te la entregamos lista.</p>
              </div>
              <div className={styles.miniCard}>
                <span className={styles.miniIcon}>
                  <BrandIcon name="link" />
                </span>
                <h3>Se comparte con un enlace</h3>
                <p>La reenvías por WhatsApp y se ve perfecta en cualquier celular.</p>
              </div>
            </div>
          </div>
          <div className={styles.aboutDevice}>
            <span className={styles.aboutBlock} aria-hidden="true" />
            <Phone
              src={fecha}
              alt="Sección «¡Aparta la fecha!» con fecha, hora y lugar de la fiesta"
              className={styles.phoneTilt}
            />
          </div>
        </section>

        {/* ============ Bento ============ */}
        <section className={styles.why} aria-labelledby="why-t">
          <h2 id="why-t" className={`${styles.h2} ${styles.center}`}>
            Una invitación que de verdad abren
          </h2>
          <p className={`${styles.p} ${styles.center} ${styles.narrow}`}>
            Nada de imágenes que se pierden en el chat: es una página con todo lo que tus invitados necesitan saber.
          </p>
          <div className={styles.bento}>
            <article className={`${styles.tile} ${styles.tileSand}`}>
              <h3>Se abre como regalo</h3>
              <p>Un toque y llueve confeti.</p>
              <Phone src={apertura} alt="Pantalla de apertura con un regalo para tocar" className={styles.tilePhone} />
            </article>
            <article className={`${styles.tile} ${styles.tilePurple}`}>
              <p className={styles.tileBig}>0</p>
              <h3>apps que descargar</h3>
              <p>Funciona desde el navegador del celular, con el enlace que les mandas.</p>
            </article>
            <article className={`${styles.tile} ${styles.tileWhite}`}>
              <h3>Con sus personajes favoritos</h3>
              <p>Cada tema pone sus colores, su música y sus ilustraciones.</p>
              {group && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.tileImg} src={group} alt="" loading="lazy" />
              )}
            </article>
          </div>
        </section>

        {/* ============ Funciones ============ */}
        <section className={styles.features} id="funciones" aria-labelledby="funciones-t">
          <div className={styles.featuresHead}>
            <h2 id="funciones-t" className={styles.h2}>
              Todo lo que trae tu invitación
            </h2>
            <p className={styles.p}>Cada sección se muestra o se oculta según tu fiesta.</p>
          </div>
          <ul className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <li key={f.title} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <BrandIcon name={f.icon} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ============ Cómo funciona ============ */}
        <section className={styles.how} id="como-funciona" aria-labelledby="how-t">
          <h2 id="how-t" className={`${styles.h2} ${styles.center}`}>
            Así de fácil
          </h2>
          <div className={styles.howGrid}>
            <ol className={styles.steps}>
              {STEPS.map((s, i) => (
                <li key={s.title} className={styles.step}>
                  <span className={styles.stepNum}>{i + 1}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className={styles.howDevice}>
              <span className={styles.halo} aria-hidden="true" />
              <Phone src={confirmar} alt="Formulario para confirmar asistencia por WhatsApp" />
            </div>
          </div>
        </section>

        {/* ============ Preguntas ============ */}
        <section className={styles.faq} id="preguntas" aria-labelledby="faq-t">
          <h2 id="faq-t" className={`${styles.h2} ${styles.center}`}>
            Preguntas frecuentes
          </h2>
          <div className={styles.faqList}>
            {FAQ.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>
                  {f.q}
                  <BrandIcon name="plus" className={styles.faqIcon} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ============ Cierre ============ */}
        <section className={styles.ctaWrap}>
          <div className={styles.cta}>
            <h2>¿Hacemos la invitación de tu peque?</h2>
            <p>Cuéntanos de quién es la fiesta y qué personajes le gustan. Del resto nos encargamos.</p>
            {primary && (
              <a className={`${styles.btn} ${styles.btnSand}`} href={primary.href} {...(primary.external ? ext : {})}>
                {primary.external && <BrandIcon name="chat" />}
                {primary.label}
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footScene}>
          <PartyScene classes={SCENE_CLASSES} />
        </div>
        <div className={styles.footBand}>
          <div className={styles.footMain}>
            <a href="#inicio" aria-label="invita2, volver al inicio" className={styles.footLogo}>
              <Isologo className={styles.isologo} />
            </a>
            <div className={styles.footInfo}>
              <p className={styles.footTagline}>Invitaciones digitales animadas para fiestas infantiles. Hechas con cariño.</p>
              <nav className={styles.footLinks} aria-label="Pie de página">
                <a href="#funciones">Funciones</a>
                <a href="#como-funciona">Cómo funciona</a>
                {themes.length > 0 && <a href="#personajes">Personajes</a>}
                <a href="#preguntas">Preguntas</a>
              </nav>
            </div>
            {(quote || demo) && (
              <div className={styles.footActions}>
                {quote && (
                  <a className={styles.footWa} href={quote} {...ext}>
                    <BrandIcon name="chat" />
                    Cotizar por WhatsApp
                  </a>
                )}
                {demo && (
                  <a className={styles.footDemo} href={`/${demo}`}>
                    Ver un ejemplo
                  </a>
                )}
              </div>
            )}
          </div>
          <p className={styles.footCopy}>© invita2 · Invitaciones digitales para fiestas infantiles</p>
        </div>
      </footer>
    </div>
  );
}
