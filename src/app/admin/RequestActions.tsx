"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/defaults";
import { DEFAULT_REQUEST_DAYS, REQUEST_DAYS } from "@/lib/requests";
import { approveRequest, createRequest, deleteRequest, publishRequest, rejectRequest, renewRequest } from "./actions";
import { Popconfirm } from "./Popconfirm";
import styles from "./admin.module.css";

const noop = () => () => {};

/** Dominio desde donde se abre el panel (en el servidor, el del sitio). */
function useOrigin(fallback: string) {
  return useSyncExternalStore(noop, () => location.origin, () => fallback);
}

const daysLabel = (d: number) => (d === 1 ? "1 día" : `${d} días`);

function DaysSelect({ name = "days", value, onChange }: { name?: string; value?: number; onChange?: (d: number) => void }) {
  return (
    <select
      className={styles.select}
      name={name}
      {...(onChange ? { value, onChange: (e) => onChange(Number(e.target.value)) } : { defaultValue: DEFAULT_REQUEST_DAYS })}
    >
      {REQUEST_DAYS.map((d) => (
        <option key={d} value={d}>
          {daysLabel(d)}
        </option>
      ))}
    </select>
  );
}

/** Alta de la solicitud: el cliente y el tipo de evento quedan fijos en el enlace. */
export function NewRequestForm() {
  const [state, action, pending] = useActionState(createRequest, null);
  const [type, setType] = useState<EventType>("cumpleanos");

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
        <span className={styles.help}>El cliente no lo puede cambiar.</span>
      </div>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Nombre de quien lo solicita</span>
          <input className={styles.input} name="client_name" required maxLength={120} placeholder="María López" autoComplete="off" />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Teléfono</span>
          <input className={styles.input} name="client_phone" required type="tel" inputMode="tel" placeholder="999 123 4567" autoComplete="off" />
          <span className={styles.help}>10 dígitos; se le agrega la lada 52.</span>
        </label>
      </div>
      <label className={styles.field} style={{ maxWidth: 220 }}>
        <span className={styles.label}>El enlace vence en</span>
        <DaysSelect />
      </label>
      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Generando…" : "Generar enlace"}
      </button>
    </form>
  );
}

/** Enlace del formulario: copiarlo o mandarlo por WhatsApp al teléfono del cliente. */
export function RequestLink({ path, phone, clientName, siteUrl }: { path: string; phone: string; clientName: string; siteUrl: string }) {
  const origin = useOrigin(siteUrl);
  const url = `${origin}${path}`;
  const [copied, setCopied] = useState(false);
  const firstName = clientName.split(/\s+/)[0];
  const text = `¡Hola, ${firstName}! Aquí puedes llenar los datos de tu invitación: ${url}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.grid} style={{ gap: 10 }}>
      <div className={styles.linkBox}>
        <input className={styles.input} value={url} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Enlace del formulario" />
        <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={copy}>
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
      <div>
        <a className={`${styles.btn} ${styles.btnPrimary}`} href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          Enviar por WhatsApp
        </a>
      </div>
    </div>
  );
}

/** Enlace nuevo: el anterior deja de servir. */
export function RenewRequest({ id, label = "Generar enlace nuevo" }: { id: string; label?: string }) {
  const [days, setDays] = useState<number>(DEFAULT_REQUEST_DAYS);
  const [pending, start] = useTransition();

  return (
    <div className={styles.labelRow} style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-start" }}>
      <DaysSelect value={days} onChange={setDays} />
      <Popconfirm
        title="¿Generar un enlace nuevo?"
        description="El enlace anterior deja de funcionar; mándale el nuevo al cliente."
        okText="Generar"
        onConfirm={() => start(() => renewRequest(id, days))}
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled={pending} onClick={confirm}>
            {pending ? "Generando…" : label}
          </button>
        )}
      </Popconfirm>
    </div>
  );
}

/** Aprobar (crea la invitación sin publicar) o rechazar. */
export function ReviewRequest({ id, canApprove }: { id: string; canApprove: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={styles.grid} style={{ gap: 10 }}>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.labelRow} style={{ gap: 8, justifyContent: "flex-start", flexWrap: "wrap" }}>
        {canApprove && (
          <Popconfirm
            title="¿Aprobar la solicitud?"
            description="Se crea la invitación sin publicar para que la termines en el editor."
            okText="Aprobar"
            onConfirm={() =>
              start(async () => {
                setError(null);
                const result = await approveRequest(id);
                if (!result.ok) setError(result.error);
              })
            }
          >
            {(confirm) => (
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending} onClick={confirm}>
                {pending ? "…" : "Aprobar"}
              </button>
            )}
          </Popconfirm>
        )}
        <Popconfirm
          title="¿Rechazar la solicitud?"
          description="El enlace deja de funcionar. Después puedes generar uno nuevo para que el cliente la corrija."
          okText="Rechazar"
          danger
          onConfirm={() => start(() => rejectRequest(id))}
        >
          {(confirm) => (
            <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={pending} onClick={confirm}>
              Rechazar
            </button>
          )}
        </Popconfirm>
      </div>
    </div>
  );
}

/**
 * Solo aparece en las aprobadas y se habilita cuando no falta nada (el
 * servidor lo vuelve a comprobar).
 */
export function PublishRequest({ id, ready }: { id: string; ready: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Popconfirm
        title="¿Publicar la invitación?"
        description="El enlace de la invitación empieza a funcionar para quien lo tenga."
        okText="Publicar"
        onConfirm={() =>
          start(async () => {
            setError(null);
            const result = await publishRequest(id);
            if (!result.ok) setError(result.error);
          })
        }
      >
        {(confirm) => (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={pending || !ready}
            title={ready ? undefined : "Completa lo que falta para poder publicarla"}
            onClick={confirm}
          >
            {pending ? "Publicando…" : "Publicar invitación"}
          </button>
        )}
      </Popconfirm>
      {error && <p className={styles.error}>{error}</p>}
    </>
  );
}

export function DeleteRequest({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();

  return (
    <Popconfirm
      title={`¿Eliminar la solicitud de ${name}?`}
      description="El enlace deja de funcionar y se borra lo que haya llenado."
      okText="Eliminar"
      danger
      onConfirm={() => start(() => deleteRequest(id))}
    >
      {(confirm) => (
        <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`} disabled={pending} onClick={confirm}>
          Eliminar
        </button>
      )}
    </Popconfirm>
  );
}
