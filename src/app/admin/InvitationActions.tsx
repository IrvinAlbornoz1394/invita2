"use client";

import { useTransition } from "react";
import { deleteInvitation, setInvitationActive } from "./actions";
import styles from "./admin.module.css";

/**
 * Desactivar (el enlace deja de funcionar) y eliminar (sale del panel).
 * Las dos son reversibles desde la base: nada se borra de verdad.
 */
export function InvitationActions({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
        disabled={pending}
        onClick={() => {
          const msg = active
            ? `¿Desactivar la invitación de ${name}? Quien tenga el enlace ya no podrá verla hasta que la actives de nuevo.`
            : `¿Activar la invitación de ${name}? El enlace vuelve a funcionar si está publicada.`;
          if (confirm(msg)) start(() => setInvitationActive(id, !active));
        }}
      >
        {pending ? "…" : active ? "Desactivar" : "Activar"}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
        disabled={pending}
        onClick={() => {
          if (confirm(`¿Eliminar la invitación de ${name}? Sale del panel y el enlace deja de funcionar.`)) {
            start(() => deleteInvitation(id));
          }
        }}
      >
        Eliminar
      </button>
    </>
  );
}
