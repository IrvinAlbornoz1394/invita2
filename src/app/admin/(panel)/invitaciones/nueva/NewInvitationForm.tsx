"use client";

import { useActionState, useState } from "react";
import { EVENT_TYPES, isReligious, RECEPTION_AFTER_HOURS, TIMEZONES, type EventType } from "@/lib/defaults";
import { createInvitation } from "../../../actions";
import styles from "../../../admin.module.css";

type ThemeOption = { id: string; name: string; event_type: EventType | null };

export function NewInvitationForm({ themes }: { themes: ThemeOption[] }) {
  const [state, action, pending] = useActionState(createInvitation, null);
  const [type, setType] = useState<EventType>("cumpleanos");
  const religious = isReligious(type);
  // Primero los temas de este tipo (o de cualquiera); los demás quedan al final
  const fitting = themes.filter((t) => !t.event_type || t.event_type === type);
  const others = themes.filter((t) => t.event_type && t.event_type !== type);
  const firstOfType = themes.find((t) => t.event_type === type) ?? fitting[0];

  return (
    <form action={action} className={styles.grid}>
      {state && !state.ok && <p className={styles.error}>{state.error}</p>}
      <div className={styles.field}>
        <span className={styles.label}>Tipo de evento</span>
        <div className={styles.chips}>
          {(Object.keys(EVENT_TYPES) as EventType[]).map((t) => (
            <label key={t} className={styles.check}>
              <input type="radio" name="event_type" value={t} checked={type === t} onChange={() => setType(t)} />
              <span aria-hidden="true">{EVENT_TYPES[t].emoji}</span> {EVENT_TYPES[t].label}
            </label>
          ))}
        </div>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Nombre del festejado</span>
        <input className={styles.input} name="name" required placeholder="Lucero Jeamileth" autoFocus />
        <span className={styles.help}>El primer nombre se usa en el enlace: /lucero-k3f9a2</span>
      </label>
      {!religious && (
        <label className={styles.field} style={{ maxWidth: 200 }}>
          <span className={styles.label}>Edad que cumple</span>
          <input className={styles.input} name="age" type="number" min={0} max={120} placeholder="5" />
        </label>
      )}
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Fecha</span>
          <input className={styles.input} name="date" type="date" required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>{religious ? "Hora de la ceremonia" : "Hora"}</span>
          <input className={styles.input} name="time" type="time" required defaultValue={religious ? "12:00" : "16:00"} key={type} />
          {religious && (
            <span className={styles.help}>La recepción queda {RECEPTION_AFTER_HOURS} horas después; se ajusta en el editor.</span>
          )}
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
          {/* key: al cambiar de tipo se preselecciona su primer tema */}
          <select className={styles.select} name="theme_id" defaultValue={firstOfType?.id ?? ""} key={type}>
            <option value="">Sin tema</option>
            <optgroup label={`Para ${EVENT_TYPES[type].label.toLowerCase()}`}>
              {fitting.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            {others.length > 0 && (
              <optgroup label="De otros eventos">
                {others.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>
      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Creando…" : "Crear y seguir editando"}
      </button>
    </form>
  );
}
