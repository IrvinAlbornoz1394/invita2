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
};

/**
 * Publicada (el enlace funciona) o inactiva (lleva a la página principal).
 * Apagarla pide confirmación: quien ya tiene el enlace deja de verla.
 */
export function PublishSwitch({ id, published }: { id: string; published: boolean }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(published);
  const set = (next: boolean) =>
    start(async () => {
      setOn(next);
      await setInvitationPublished(id, next);
    });

  return (
    <Popconfirm {...UNPUBLISH_CONFIRM} danger onConfirm={() => set(false)}>
      {(confirm) => (
        <Switch
          checked={on}
          loading={pending}
          label={on ? "Publicada" : "Inactiva"}
          onChange={(next) => (next ? set(true) : confirm())}
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
