"use client";

import { useActionState, useState, useSyncExternalStore, useTransition } from "react";
import { giveawayMessage } from "@/lib/giveaways";
import { createGiveaway, drawWinner, pickWinner, saveGiveawayMessage, setEntryDiscarded, setGiveawayActive } from "./actions";
import { Popconfirm } from "./Popconfirm";
import { Switch } from "./Switch";
import styles from "./admin.module.css";

const noop = () => () => {};
const useOrigin = (fallback: string) => useSyncExternalStore(noop, () => location.origin, () => fallback);

export function NewGiveawayForm() {
  const [state, action, pending] = useActionState(createGiveaway, null);
  return (
    <form action={action} className={styles.grid}>
      {state && !state.ok && <p className={styles.error}>{state.error}</p>}
      <label className={styles.field}>
        <span className={styles.label}>Nombre</span>
        <input className={styles.input} name="name" required maxLength={120} defaultValue="Giveaway navideño" />
      </label>
      <div className={styles.grid2}>
        <label className={styles.field}>
          <span className={styles.label}>Invitaciones a regalar</span>
          <input className={styles.input} name="winners" type="number" min={1} max={500} defaultValue={10} required />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Día del anuncio</span>
          <input className={styles.input} name="announce_on" type="date" required />
          <span className={styles.help}>El registro cierra al empezar ese día.</span>
        </label>
      </div>
      <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending}>
        {pending ? "Creando…" : "Crear giveaway"}
      </button>
    </form>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: async (text: string) => {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
  };
}

/** Copia el mensaje completo con el enlace para mandarlo. */
export function CopyGiveawayMessage({ template, path, announceOn, siteUrl, small = false }: { template: string; path: string; announceOn: string; siteUrl: string; small?: boolean }) {
  const origin = useOrigin(siteUrl);
  const { copied, copy } = useCopy();
  return (
    <button type="button" className={`${styles.btn} ${small ? styles.btnSmall : styles.btnPrimary}`} onClick={() => copy(giveawayMessage(template, `${origin}${path}`, announceOn))}>
      {copied ? "¡Mensaje copiado!" : "Copiar mensaje con enlace"}
    </button>
  );
}

/** Enlace, mensaje editable y botón para copiarlo todo. */
export function GiveawayMessage({ id, initial, path, announceOn, siteUrl }: { id: string; initial: string; path: string; announceOn: string; siteUrl: string }) {
  const origin = useOrigin(siteUrl);
  const url = `${origin}${path}`;
  const [message, setMessage] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const link = useCopy();
  const all = useCopy();

  return (
    <div className={styles.grid} style={{ gap: 12 }}>
      <div className={styles.field}>
        <span className={styles.label}>Enlace</span>
        <div className={styles.linkBox}>
          <input className={styles.input} value={url} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Enlace del giveaway" />
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} onClick={() => link.copy(url)}>
            {link.copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
      <label className={styles.field}>
        <span className={styles.label}>Mensaje</span>
        <textarea className={styles.textarea} rows={9} value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} />
        <span className={styles.help}>
          {"{enlace}"} se cambia por el enlace y {"{fecha}"} por el día del anuncio.
        </span>
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.labelRow} style={{ gap: 8, justifyContent: "flex-start", flexWrap: "wrap" }}>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => all.copy(giveawayMessage(message, url, announceOn))}>
          {all.copied ? "¡Mensaje copiado!" : "Copiar mensaje con enlace"}
        </button>
        <button
          type="button"
          className={styles.btn}
          disabled={pending || message === saved}
          onClick={() =>
            start(async () => {
              setError(null);
              const r = await saveGiveawayMessage(id, message);
              if (r.ok) setSaved(message);
              else setError(r.error);
            })
          }
        >
          {pending ? "Guardando…" : message === saved ? "Guardado" : "Guardar mensaje"}
        </button>
      </div>
    </div>
  );
}

export function GiveawayActiveSwitch({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Popconfirm
      title={active ? "¿Cerrar el registro?" : "¿Reabrir el registro?"}
      description={active ? "El enlace deja de aceptar participantes." : "El enlace vuelve a aceptar participantes hasta el día del anuncio."}
      okText={active ? "Cerrar" : "Reabrir"}
      danger={active}
      onConfirm={() => start(() => setGiveawayActive(id, !active))}
    >
      {(confirm) => <Switch checked={active} loading={pending} label={active ? "Registro abierto" : "Registro cerrado"} onChange={() => confirm()} />}
    </Popconfirm>
  );
}

/** Uno al azar entre los que siguen participando. */
export function DrawWinner({ giveawayId, disabled }: { giveawayId: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className={styles.grid} style={{ gap: 8 }}>
      <Popconfirm
        title="¿Sortear un ganador?"
        description="Se elige uno al azar entre quienes siguen participando y se le genera su solicitud."
        okText="Sortear"
        onConfirm={() =>
          start(async () => {
            const r = await drawWinner(giveawayId);
            setResult(r.ok ? { ok: true, text: r.message ?? "¡Listo!" } : { ok: false, text: r.error });
          })
        }
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={pending || disabled} onClick={confirm}>
            {pending ? "Sorteando…" : "🎲 Sortear un ganador"}
          </button>
        )}
      </Popconfirm>
      {result && <p className={result.ok ? styles.cardHint : styles.error}>{result.text}</p>}
    </div>
  );
}

export function EntryActions({ id, name, status }: { id: string; name: string; status: "participando" | "descartado" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "descartado") {
    return (
      <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`} disabled={pending} onClick={() => start(() => setEntryDiscarded(id, false))}>
        Regresar al sorteo
      </button>
    );
  }

  return (
    <>
      <Popconfirm
        title={`¿${name} es ganador?`}
        description="Se le genera su solicitud para que llene los datos de su invitación."
        okText="Sí, ganó"
        onConfirm={() =>
          start(async () => {
            setError(null);
            const r = await pickWinner(id);
            if (!r.ok) setError(r.error);
          })
        }
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnSmall}`} disabled={pending} onClick={confirm}>
            Ganador
          </button>
        )}
      </Popconfirm>
      <Popconfirm
        title={`¿Descartar a ${name}?`}
        description="No cumplió los requisitos: ya no entra al sorteo."
        okText="Descartar"
        danger
        onConfirm={() => start(() => setEntryDiscarded(id, true))}
      >
        {(confirm) => (
          <button type="button" className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`} disabled={pending} onClick={confirm}>
            Descartar
          </button>
        )}
      </Popconfirm>
      {error && <span className={styles.error}>{error}</span>}
    </>
  );
}
