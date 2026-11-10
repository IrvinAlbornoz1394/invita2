"use client";

import { useTransition } from "react";
import { deleteTheme, setThemeActive } from "./actions";
import styles from "./admin.module.css";

/**
 * Desactivar (no se ofrece para invitaciones nuevas ni en la landing) y
 * eliminar (sale del panel). Las invitaciones que ya usan el tema lo conservan.
 */
export function ThemeActions({ id, name, active, uses }: { id: string; name: string; active: boolean; uses: number }) {
  const [pending, start] = useTransition();
  const using = uses === 1 ? "1 invitación lo usa y lo conserva" : `${uses} invitaciones lo usan y lo conservan`;

  return (
    <>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
        disabled={pending}
        onClick={() => {
          const msg = active
            ? `¿Desactivar «${name}»? Ya no se podrá elegir para invitaciones nuevas ni aparecerá en la página principal.${uses ? ` ${using}.` : ""}`
            : `¿Activar «${name}»? Se podrá elegir otra vez y aparecerá en la página principal.`;
          if (confirm(msg)) start(() => setThemeActive(id, !active));
        }}
      >
        {pending ? "…" : active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
        disabled={pending}
        onClick={() => {
          if (confirm(`¿Eliminar «${name}»? Sale del panel.${uses ? ` ${using}.` : ""}`)) start(() => deleteTheme(id));
        }}
      >
        Eliminar
      </button>
    </>
  );
}
