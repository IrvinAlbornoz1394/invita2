"use client";

import { useRef } from "react";
import Link from "next/link";
import styles from "./demo.module.css";

export type DemoThemeOption = { id: string; name: string; image: string | null };

/** Barra de la demo: volver, cambiar de personaje y pedir el tema por WhatsApp. */
export function DemoBar({
  themeId,
  themeName,
  contact,
  themes,
}: {
  themeId: string;
  themeName: string;
  contact: string | null;
  /** Personajes entre los que se puede cambiar sin volver a la landing */
  themes: DemoThemeOption[];
}) {
  const sheet = useRef<HTMLDialogElement>(null);
  const current = themes.find((t) => t.id === themeId);
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

      {themes.length > 1 && (
        <>
          <button
            type="button"
            className={styles.pick}
            onClick={() => sheet.current?.showModal()}
            aria-haspopup="dialog"
            aria-label={`Personaje: ${themeName}. Cambiar personaje`}
          >
            {current?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.image} alt="" />
            ) : (
              <span className={styles.pickInitial} aria-hidden="true">
                {themeName.charAt(0)}
              </span>
            )}
            <span className={styles.pickName}>{themeName}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 10l5 5 5-5" />
            </svg>
          </button>

          <dialog
            ref={sheet}
            className={styles.sheet}
            aria-labelledby="demo-sheet-t"
            // Tocar fuera de la hoja la cierra
            onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
          >
            <div className={styles.sheetBody}>
              <div className={styles.sheetHead}>
                <h2 id="demo-sheet-t">Cambiar personaje</h2>
                <button type="button" className={styles.sheetClose} onClick={() => sheet.current?.close()} aria-label="Cerrar">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <ul className={styles.sheetList}>
                {themes.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/demo/${t.id}`}
                      replace
                      scroll={false}
                      className={styles.sheetItem}
                      aria-current={t.id === themeId ? "true" : undefined}
                      onClick={() => sheet.current?.close()}
                    >
                      {t.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.pickInitial} aria-hidden="true">
                          {t.name.charAt(0)}
                        </span>
                      )}
                      <span>{t.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </dialog>
        </>
      )}

      {ask && (
        <a className={styles.ask} href={ask} target="_blank" rel="noopener">
          La quiero
        </a>
      )}
    </div>
  );
}
