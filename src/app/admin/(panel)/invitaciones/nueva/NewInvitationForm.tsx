"use client";

import { useActionState } from "react";
import { TIMEZONES } from "@/lib/defaults";
import { createInvitation } from "../../../actions";
import styles from "../../../admin.module.css";

export function NewInvitationForm({ themes }: { themes: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createInvitation, null);

  return (
    <form action={action} className={styles.grid}>
      {state && !state.ok && <p className={styles.error}>{state.error}</p>}
      <label className={styles.field}>
        <span className={styles.label}>Nombre del festejado</span>
        <input className={styles.input} name="name" required placeholder="Lucero Jeamileth" autoFocus />
        <span className={styles.help}>El primer nombre se usa en el enlace: /lucero-k3f9a2</span>
      </label>
      <label className={styles.field} style={{ maxWidth: 200 }}>
        <span className={styles.label}>Edad que cumple</span>
        <input className={styles.input} name="age" type="number" min={0} max={120} placeholder="5" />
      </label>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Fecha</span>
          <input className={styles.input} name="date" type="date" required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Hora</span>
          <input className={styles.input} name="time" type="time" required defaultValue="16:00" />
        </label>
      </div>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Zona horaria</span>
          <select className={styles.select} name="timezone" defaultValue="America/Merida">
            {TIMEZONES.map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Tema</span>
          <select className={styles.select} name="theme_id" defaultValue={themes[0]?.id ?? ""}>
            <option value="">Sin tema</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Creando…" : "Crear y seguir editando"}
      </button>
    </form>
  );
}
