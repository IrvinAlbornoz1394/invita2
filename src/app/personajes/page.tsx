import type { Metadata } from "next";
import Link from "next/link";
import { BrandIcon, Logo } from "@/components/brand/icons";
import { getLandingThemes } from "@/lib/data";
import styles from "../landing.module.css";

export const metadata: Metadata = {
  title: "Personajes disponibles",
  description: "Todos los personajes con invitación digital lista. Toca uno para ver su demo.",
};

/** Todos los personajes de fiesta (sin bautizo ni comunión), cada uno abre su demo. */
export default async function CharactersPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP;
  const characters = (await getLandingThemes()).filter((t) => !t.religious);
  const ask = contact ? `https://wa.me/${contact}?text=${encodeURIComponent("¡Hola! ¿Tienen invitación con el tema de…?")}` : null;

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link href="/" aria-label="invita2, inicio" className={styles.logoLink}>
          <Logo className={styles.logo} priority />
        </Link>
        <div className={styles.navActions}>
          <Link className={`${styles.btn} ${styles.btnSand} ${styles.btnSm}`} href="/">
            Volver
          </Link>
        </div>
      </header>

      <main className={`${styles.strip} ${styles.allCharacters}`}>
        <h1 className={styles.allTitle}>Personajes disponibles</h1>
        <p className={styles.stripHint}>Toca uno para ver su invitación de ejemplo</p>
        {characters.length === 0 ? (
          <p className={styles.stripHint}>Pronto habrá personajes aquí.</p>
        ) : (
          <ul className={styles.stripList}>
            {characters.map((t) => (
              <li key={t.id}>
                <a className={styles.stripDemo} href={`/demo/${t.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.logoUrl ?? t.cardUrl ?? ""} alt="" loading="lazy" />
                  <span>{t.name}</span>
                </a>
              </li>
            ))}
            {ask && (
              <li>
                <a className={styles.stripAsk} href={ask} target="_blank" rel="noopener">
                  <BrandIcon name="plus" />
                  ¿Otro personaje?
                </a>
              </li>
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
