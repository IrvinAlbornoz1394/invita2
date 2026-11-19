"use client";

import { useOptimistic, useTransition } from "react";
import { deleteInvitation, setInvitationPublished } from "./actions";
import { AdminIcon } from "./AdminIcon";
import { Popconfirm } from "./Popconfirm";
import { Switch } from "./Switch";
import styles from "./admin.module.css";

export const UNPUBLISH_CONFIRM = {
  title: "¿Dejar inactiva la invitación?",
  description: "Quien tenga el enlace ya no podrá verla hasta que la publiques de nuevo.",
  okText: "Dejar inactiva",
  danger: true,
};

export const PUBLISH_CONFIRM = {
  title: "¿Publicar la invitación?",
  description: "El enlace empieza a funcionar para quien lo tenga.",
  okText: "Publicar",
  danger: false,
};

/** Confirmación según hacia dónde cambia: publicar o dejar inactiva */
export const publishConfirm = (publishing: boolean) => (publishing ? PUBLISH_CONFIRM : UNPUBLISH_CONFIRM);

/**
 * Publicada (el enlace funciona) o inactiva (lleva a la página principal).
 * Los dos cambios piden confirmación.
 */
export function PublishSwitch({ id, published, blocked }: { id: string; published: boolean; /** Por qué no se puede publicar todavía */ blocked?: string | null }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(published);
  const set = (next: boolean) =>
    start(async () => {
      setOn(next);
      await setInvitationPublished(id, next);
    });

  return (
    <Popconfirm {...publishConfirm(!on)} onConfirm={() => set(!on)}>
      {(confirm) => (
        <Switch
          checked={on}
          loading={pending}
          label={on ? "Publicada" : "Inactiva"}
          disabled={!on && !!blocked}
          title={!on && blocked ? blocked : undefined}
          onChange={() => confirm()}
        />
      )}
    </Popconfirm>
  );
}

/** Eliminar: sale del panel y el enlace deja de funcionar (reversible desde la base). */
export function InvitationActions({ id, name, icon = false }: { id: string; name: string; icon?: boolean }) {
  const [pending, start] = useTransition();

  return (
    <Popconfirm
      title={`¿Eliminar la invitación de ${name}?`}
      description="Sale del panel y el enlace deja de funcionar."
      okText="Eliminar"
      danger
      onConfirm={() => start(() => deleteInvitation(id))}
    >
      {(confirm) => (
        <button
          type="button"
          className={icon ? `${styles.actionIcon} ${styles.actionIconDanger}` : `${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
          aria-label={icon ? "Eliminar" : undefined}
          title={icon ? "Eliminar" : undefined}
          disabled={pending}
          onClick={confirm}
        >
          {icon ? <AdminIcon name="trash" /> : "Eliminar"}
        </button>
      )}
    </Popconfirm>
  );
}
