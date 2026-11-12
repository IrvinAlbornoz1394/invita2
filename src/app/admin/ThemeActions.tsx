"use client";

import { useTransition } from "react";
import { deleteTheme, setThemeActive } from "./actions";
import { Popconfirm } from "./Popconfirm";
import styles from "./admin.module.css";

/**
 * Desactivar (no se ofrece para invitaciones nuevas ni en la landing) y
 * eliminar (sale del panel). Las invitaciones que ya usan el tema lo conservan.
 */
export function ThemeActions({ id, name, active, uses }: { id: string; name: string; active: boolean; uses: number }) {
  const [pending, start] = useTransition();
  const using = uses === 1 ? "1 invitación lo usa y lo conserva." : `${uses} invitaciones lo usan y lo conservan.`;

  return (
    <>
      <Popconfirm
        title={active ? `¿Desactivar «${name}»?` : `¿Activar «${name}»?`}
        description={
          active
            ? `Ya no se podrá elegir para invitaciones nuevas ni aparecerá en la página principal.${uses ? ` ${using}` : ""}`
            : "Se podrá elegir otra vez y aparecerá en la página principal."
        }
        okText={active ? "Desactivar" : "Activar"}
        danger={active}
        onConfirm={() => start(() => setThemeActive(id, !active))}
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`} disabled={pending} onClick={confirm}>
            {pending ? "…" : active ? "Desactivar" : "Activar"}
          </button>
        )}
      </Popconfirm>
      <Popconfirm
        title={`¿Eliminar «${name}»?`}
        description={`Sale del panel.${uses ? ` ${using}` : ""}`}
        okText="Eliminar"
        danger
        onConfirm={() => start(() => deleteTheme(id))}
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`} disabled={pending} onClick={confirm}>
            Eliminar
          </button>
        )}
      </Popconfirm>
    </>
  );
}
