"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { DEFAULT_TIME, EXTRAS_CATALOG, hasAge, isReligious, RECEPTION_AFTER_HOURS, usesFullName, type EventType } from "@/lib/defaults";
import { REQUEST_EXTRAS_MAX, REQUEST_GALLERY_MAX, type RequestDataInput } from "@/lib/requests";
import { requestPhotoFolder } from "@/lib/request-photos";
import { uploadMedia } from "../admin/upload";
import { submitRequest } from "./actions";
import styles from "./solicitud.module.css";

export type ThemeChoice = { id: string; name: string; card_url: string | null; logo_url: string | null };

const NAME_LABEL: Record<EventType, { label: string; placeholder: string }> = {
  cumpleanos: { label: "Nombre del festejado", placeholder: "Lucero Jeamileth" },
  bautizo: { label: "Nombre de quien se bautiza", placeholder: "Mateo" },
  primera_comunion: { label: "Nombre de quien hace su Primera Comunión", placeholder: "Valentina" },
  posada: { label: "¿Quién invita?", placeholder: "Familia López" },
};

/** "12:00" + 2 h → "14:00" */
const addHours = (hhmm: string, hours: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${String((h + hours) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** En el formulario los nombres van uno por renglón */
const lines = (list?: string[]) => (list ?? []).join("\n");
const fromLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export function RequestForm({
  token,
  requestId,
  type,
  initial,
  themes,
  contact,
}: {
  token: string;
  requestId: string;
  type: EventType;
  initial: RequestDataInput | null;
  themes: ThemeChoice[];
  contact: string | null;
}) {
  const religious = isReligious(type);
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    age: initial?.age != null ? String(initial.age) : "",
    photo_url: initial?.photo_url ?? null,
    date: initial?.date ?? "",
    time: initial?.time ?? (religious ? addHours(DEFAULT_TIME[type], RECEPTION_AFTER_HOURS) : DEFAULT_TIME[type]),
    venue_name: initial?.venue_name ?? "",
    address: initial?.address ?? "",
    maps_url: initial?.maps_url ?? "",
    ceremony: {
      enabled: initial?.ceremony?.enabled ?? true,
      time: initial?.ceremony?.time ?? DEFAULT_TIME[type],
      place: initial?.ceremony?.place ?? "",
      address: initial?.ceremony?.address ?? "",
      maps_url: initial?.ceremony?.maps_url ?? "",
    },
    parents: lines(initial?.parents),
    godparents: lines(initial?.godparents),
    message: initial?.message ?? "",
    whatsapp: initial?.whatsapp ?? "",
    rsvp_ask_people: initial?.rsvp_ask_people ?? true,
    theme_id: initial?.theme_id ?? null,
    // «Otro»: el cliente escribe el personaje que no tenemos para hacerlo
    other: !!initial?.custom_theme,
    custom_theme: initial?.custom_theme ?? "",
    notes: initial?.notes ?? "",
    extras: initial?.extras ?? [],
    gallery: initial?.gallery ?? [],
  }));
  const pickTheme = (theme_id: string | null, other = false) => setForm((f) => ({ ...f, theme_id, other }));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setCeremony = (patch: Partial<typeof form.ceremony>) => setForm((f) => ({ ...f, ceremony: { ...f.ceremony, ...patch } }));

  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: RequestDataInput = {
      name: form.name,
      age: hasAge(type) && form.age !== "" ? Number(form.age) : null,
      photo_url: form.photo_url,
      date: form.date,
      time: form.time,
      venue_name: form.venue_name,
      address: form.address,
      maps_url: form.maps_url,
      ceremony: religious ? form.ceremony : { enabled: false, time: null, place: null, address: null, maps_url: null },
      parents: religious ? fromLines(form.parents) : [],
      godparents: religious ? fromLines(form.godparents) : [],
      message: form.message,
      whatsapp: form.whatsapp,
      rsvp_ask_people: form.rsvp_ask_people,
      theme_id: form.other ? null : form.theme_id,
      custom_theme: form.other ? form.custom_theme : null,
      notes: form.notes,
      extras: form.extras,
      gallery: form.gallery,
    };
    start(async () => {
      const result = await submitRequest(token, input);
      if (result.ok) {
        setDone(true);
        scrollTo({ top: 0, behavior: "smooth" });
      } else setError(result.error);
    });
  }

  if (done) {
    return (
      <section className={`${styles.card} ${styles.closed}`} role="status">
        <span className={styles.closedIcon} aria-hidden="true">
          🎉
        </span>
        <h2 className={styles.title}>¡Listo, recibimos tus datos!</h2>
        <p className={styles.lead}>Vamos a preparar tu invitación y te avisamos por WhatsApp cuando esté lista.</p>
      </section>
    );
  }

  const nameCopy = NAME_LABEL[type];
  const characters = type === "cumpleanos";

  return (
    <form className={styles.form} onSubmit={submit}>
      <Section title={usesFullName(type) ? "¿Quién invita?" : "¿Quién celebra?"}>
        <Field label={nameCopy.label}>
          {(id) => (
            <input id={id} className={styles.input} value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={80} placeholder={nameCopy.placeholder} autoComplete="off" />
          )}
        </Field>
        {hasAge(type) && (
          <Field label="¿Cuántos años cumple?" narrow>
            {(id) => (
              <input id={id} className={styles.input} type="number" inputMode="numeric" min={1} max={120} step={1} value={form.age} onChange={(e) => set("age", e.target.value)} required placeholder="5" />
            )}
          </Field>
        )}
        <Photo
          value={form.photo_url}
          onChange={(url) => set("photo_url", url)}
          folder={requestPhotoFolder(requestId)}
          onBusy={setUploading}
          label={usesFullName(type) ? "Foto (opcional)" : "Foto del festejado (opcional)"}
        />
      </Section>

      <Section title="¿Cuándo?">
        <div className={styles.row2}>
          <Field label="Fecha">
            {(id) => <input id={id} className={styles.input} type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />}
          </Field>
          <Field label={religious ? "Hora de la recepción" : "Hora"}>
            {(id) => <input id={id} className={styles.input} type="time" value={form.time} onChange={(e) => set("time", e.target.value)} required />}
          </Field>
        </div>
      </Section>

      {religious && (
        <Section title={type === "bautizo" ? "Ceremonia (bautizo)" : "Misa"}>
          <label className={styles.check}>
            <input type="checkbox" checked={form.ceremony.enabled} onChange={(e) => setCeremony({ enabled: e.target.checked })} />
            <span>Sí, habrá {type === "bautizo" ? "ceremonia" : "misa"} antes de la recepción</span>
          </label>
          {form.ceremony.enabled && (
            <>
              <div className={styles.row2}>
                <Field label="Hora">
                  {(id) => <input id={id} className={styles.input} type="time" value={form.ceremony.time ?? ""} onChange={(e) => setCeremony({ time: e.target.value })} required />}
                </Field>
                <Field label="Iglesia o parroquia">
                  {(id) => <input id={id} className={styles.input} value={form.ceremony.place ?? ""} onChange={(e) => setCeremony({ place: e.target.value })} maxLength={120} placeholder="Parroquia de San Juan" />}
                </Field>
              </div>
              <Field label="Dirección de la iglesia">
                {(id) => <input id={id} className={styles.input} value={form.ceremony.address ?? ""} onChange={(e) => setCeremony({ address: e.target.value })} maxLength={200} placeholder="Calle 62 #500, Centro" />}
              </Field>
              <MapsField value={form.ceremony.maps_url ?? ""} onChange={(v) => setCeremony({ maps_url: v })} />
            </>
          )}
        </Section>
      )}

      <Section title={religious ? "Recepción" : "¿Dónde?"}>
        <Field label="Nombre del lugar (opcional)">
          {(id) => <input id={id} className={styles.input} value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} maxLength={120} placeholder="Salón Arcoíris" />}
        </Field>
        <Field label="Dirección" help="Calle, número, cruzamientos y colonia.">
          {(id) => <textarea id={id} className={styles.textarea} rows={2} value={form.address} onChange={(e) => set("address", e.target.value)} required maxLength={200} placeholder="Calle 60 #500 por 61 y 63, Centro" />}
        </Field>
        <MapsField value={form.maps_url} onChange={(v) => set("maps_url", v)} />
      </Section>

      {religious && (
        <Section title="Familia">
          <div className={styles.row2}>
            <Field label="Papás" help="Un nombre por renglón.">
              {(id) => <textarea id={id} className={styles.textarea} rows={2} value={form.parents} onChange={(e) => set("parents", e.target.value)} placeholder={"Ana López\nCarlos Pérez"} />}
            </Field>
            <Field label="Padrinos" help="Un nombre por renglón.">
              {(id) => <textarea id={id} className={styles.textarea} rows={2} value={form.godparents} onChange={(e) => set("godparents", e.target.value)} placeholder={"Laura Gómez\nJorge Ruiz"} />}
            </Field>
          </div>
        </Section>
      )}

      <Section title={characters ? "Elige tu personaje" : "Elige el diseño"}>
        <div className={styles.themes} role="radiogroup" aria-label={characters ? "Personaje" : "Diseño"}>
          {themes.map((t) => {
            const image = t.card_url || t.logo_url;
            const checked = !form.other && form.theme_id === t.id;
            return (
              <label key={t.id} className={styles.theme} data-checked={checked || undefined}>
                <input type="radio" name="theme" checked={checked} onChange={() => pickTheme(t.id)} required />
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" loading="lazy" />
                ) : (
                  <span className={styles.themeBlank} aria-hidden="true">
                    ✨
                  </span>
                )}
                <span className={styles.themeName}>{t.name}</span>
              </label>
            );
          })}
          <label className={styles.theme} data-checked={form.other || undefined}>
            <input type="radio" name="theme" checked={form.other} onChange={() => pickTheme(null, true)} required />
            <span className={styles.themeBlank} aria-hidden="true">
              ✏️
            </span>
            <span className={styles.themeName}>{characters ? "Otro personaje" : "Otro diseño"}</span>
          </label>
        </div>
        {form.other && (
          <Field
            label={characters ? "¿Qué personaje quieres?" : "¿Qué diseño o temática quieres?"}
            help="Lo preparamos especialmente para tu invitación."
          >
            {(id) => (
              <input
                id={id}
                className={styles.input}
                value={form.custom_theme}
                onChange={(e) => set("custom_theme", e.target.value)}
                required
                maxLength={120}
                placeholder={characters ? "Spider-Man, Frozen, Minecraft…" : "Angelitos, flores, dorado…"}
                autoFocus
              />
            )}
          </Field>
        )}
      </Section>

      <Section title={religious ? "¿Qué habrá en la celebración?" : "¿Qué habrá en la fiesta?"}>
        <Extras type={type} value={form.extras} onChange={(extras) => set("extras", extras)} />
      </Section>

      <Section title="Galería de fotos (opcional)">
        <Gallery value={form.gallery} onChange={(gallery) => set("gallery", gallery)} folder={`${requestPhotoFolder(requestId)}/galeria`} onBusy={setUploading} />
      </Section>

      <Section title="Confirmaciones">
        <Field label="WhatsApp donde te confirmarán los invitados" help="10 dígitos.">
          {(id) => <input id={id} className={styles.input} type="tel" inputMode="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} required placeholder="999 123 4567" autoComplete="tel" />}
        </Field>
        <label className={styles.check}>
          <input type="checkbox" checked={form.rsvp_ask_people} onChange={(e) => set("rsvp_ask_people", e.target.checked)} />
          <span>Preguntarles cuántas personas asistirán</span>
        </label>
      </Section>

      <Section title="Para terminar">
        <Field label="Mensaje para tus invitados (opcional)" help="Si lo dejas vacío, te proponemos uno.">
          {(id) => <textarea id={id} className={styles.textarea} rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={600} placeholder="Ven a compartir sonrisas y momentos inolvidables conmigo…" />}
        </Field>
        <Field label="Notas para nosotros (opcional)" help="¿Algún comentario que quieras decirnos o que debamos tomar en cuenta?">
          {(id) => <textarea id={id} className={styles.textarea} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} />}
        </Field>
      </Section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} disabled={pending || uploading}>
        {pending ? "Enviando…" : uploading ? "Subiendo foto…" : "Enviar mis datos"}
      </button>
      {contact && (
        <p className={styles.help} style={{ textAlign: "center" }}>
          ¿Dudas?{" "}
          <a href={`https://wa.me/${contact}`} target="_blank" rel="noreferrer">
            Escríbenos por WhatsApp
          </a>
        </p>
      )}
    </form>
  );
}

/** Opcional: si no lo pone, buscamos la ubicación nosotros con la dirección. */
function MapsField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field
      label="Ubicación en Google Maps (opcional)"
      help="En Google Maps toca «Compartir» y pega aquí el enlace. Si no lo tienes, lo buscamos con la dirección."
    >
      {(id) => (
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={1000}
          placeholder="https://maps.app.goo.gl/…"
          autoComplete="off"
        />
      )}
    </Field>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className={styles.card}>
      <legend className={styles.sectionTitle}>{title}</legend>
      <div className={styles.fields}>{children}</div>
    </fieldset>
  );
}

function Field({ label, help, narrow, children }: { label: string; help?: string; narrow?: boolean; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={styles.field} style={narrow ? { maxWidth: 160 } : undefined}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {help && <span className={styles.help}>{help}</span>}
    </div>
  );
}

function Photo({
  value,
  onChange,
  folder,
  onBusy,
  label,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  onBusy: (busy: boolean) => void;
  label: string;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    onBusy(true);
    setError(null);
    try {
      onChange(await uploadMedia(file, folder));
    } catch {
      setError("No se pudo subir la foto. Prueba con una JPG o PNG.");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.photo}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.photoPreview} src={value} alt="Foto elegida" />
        ) : (
          <span className={`${styles.photoPreview} ${styles.photoBlank}`} aria-hidden="true">
            📷
          </span>
        )}
        <div className={styles.photoActions}>
          <label htmlFor={id} className={styles.btnGhost} aria-disabled={busy || undefined}>
            {busy ? "Subiendo…" : value ? "Cambiar foto" : "Elegir foto"}
          </label>
          <input id={id} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} />
          {value && !busy && (
            <button type="button" className={styles.linkBtn} onClick={() => onChange(null)}>
              Quitar
            </button>
          )}
        </div>
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}

type ExtraChoice = { emoji: string; label: string };

/** Extras del catálogo de su evento (se tocan para elegir) y los que quiera agregar. */
function Extras({ type, value, onChange }: { type: EventType; value: ExtraChoice[]; onChange: (extras: ExtraChoice[]) => void }) {
  const id = useId();
  const [custom, setCustom] = useState("");
  const key = (label: string) => label.trim().toLowerCase();
  const chosen = new Set(value.map((x) => key(x.label)));
  const catalog = EXTRAS_CATALOG[type];
  const extraCustom = value.filter((x) => !catalog.some((c) => key(c.label) === key(x.label)));
  const full = value.length >= REQUEST_EXTRAS_MAX;

  const toggle = (x: ExtraChoice) =>
    onChange(chosen.has(key(x.label)) ? value.filter((v) => key(v.label) !== key(x.label)) : [...value, x]);

  function add() {
    const label = custom.trim().slice(0, 60);
    if (!label || full) return;
    if (!chosen.has(key(label))) onChange([...value, { emoji: "✨", label }]);
    setCustom("");
  }

  return (
    <>
      <p className={styles.help} style={{ margin: 0 }}>
        Toca lo que habrá; puedes elegir varios.
      </p>
      <div className={styles.chips}>
        {catalog.map((x) => {
          const on = chosen.has(key(x.label));
          return (
            <button
              key={x.label}
              type="button"
              className={styles.chip}
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(x)}
            >
              <span aria-hidden="true">{x.emoji}</span> {x.label}
            </button>
          );
        })}
        {extraCustom.map((x) => (
          <button key={x.label} type="button" className={styles.chip} aria-pressed onClick={() => toggle(x)} title="Quitar">
            <span aria-hidden="true">{x.emoji}</span> {x.label} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          ¿Algo más?
        </label>
        <div className={styles.addRow}>
          <input
            id={id}
            className={styles.input}
            value={custom}
            maxLength={60}
            placeholder="Taquiza, mago, inflable de agua…"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className={styles.btnGhost} onClick={add} disabled={!custom.trim() || full}>
            Agregar
          </button>
        </div>
      </div>
    </>
  );
}

/** Hasta 12 fotos para la galería de la invitación. */
function Gallery({
  value,
  onChange,
  folder,
  onBusy,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder: string;
  onBusy: (busy: boolean) => void;
}) {
  const id = useId();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const room = REQUEST_GALLERY_MAX - value.length;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const list = files.slice(0, room);
    const urls: string[] = [];
    setError(files.length > room ? `Solo caben ${REQUEST_GALLERY_MAX} fotos; subimos las primeras ${room}.` : null);
    onBusy(true);
    try {
      for (const [i, file] of list.entries()) {
        setProgress(`Subiendo ${i + 1} de ${list.length}…`);
        urls.push(await uploadMedia(file, folder));
      }
    } catch {
      setError("No se pudo subir una foto. Prueba con JPG o PNG.");
    } finally {
      setProgress(null);
      onBusy(false);
      if (urls.length) onChange([...value, ...urls]);
    }
  }

  return (
    <>
      <p className={styles.help} style={{ margin: 0 }}>
        Fotos del festejado o de su familia para la invitación. Hasta {REQUEST_GALLERY_MAX}.
      </p>
      {value.length > 0 && (
        <div className={styles.gallery}>
          {value.map((url, i) => (
            <div key={url} className={styles.galleryItem}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1}`} />
              <button type="button" className={styles.galleryRemove} onClick={() => onChange(value.filter((u) => u !== url))} aria-label={`Quitar foto ${i + 1}`}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {room > 0 && (
        <div>
          <label htmlFor={id} className={styles.btnGhost} aria-disabled={!!progress || undefined}>
            {progress ?? (value.length ? "Agregar más fotos" : "Elegir fotos")}
          </label>
          <input id={id} className={styles.fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={!!progress} />
        </div>
      )}
      {error && <span className={styles.errorText}>{error}</span>}
    </>
  );
}
