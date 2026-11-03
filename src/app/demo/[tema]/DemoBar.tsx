import Link from "next/link";
import type { DemoKid } from "@/lib/demo";
import styles from "./demo.module.css";

const KIDS: { value: DemoKid; label: string }[] = [
  { value: "nino", label: "Niño" },
  { value: "nina", label: "Niña" },
];

/** Barra de la demo: volver, cambiar niño/niña y pedir el tema por WhatsApp. */
export function DemoBar({
  themeId,
  themeName,
  kid,
  contact,
}: {
  themeId: string;
  themeName: string;
  kid: DemoKid;
  contact: string | null;
}) {
  const ask = contact
    ? `https://wa.me/${contact}?text=${encodeURIComponent(`¡Hola! Quiero una invitación con el tema de ${themeName}.`)}`
    : null;

  return (
    <div className={styles.bar} role="region" aria-label="Demo">
      <Link href="/#personajes" className={styles.back} aria-label="Volver a los personajes">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </Link>
      <div className={styles.kids} role="group" aria-label="Ver la demo para">
        {KIDS.map((k) => (
          <Link
            key={k.value}
            href={`/demo/${themeId}?para=${k.value}`}
            replace
            scroll={false}
            className={styles.kid}
            aria-current={kid === k.value ? "true" : undefined}
          >
            {k.label}
          </Link>
        ))}
      </div>
      {ask && (
        <a className={styles.ask} href={ask} target="_blank" rel="noopener">
          La quiero
        </a>
      )}
    </div>
  );
}
