"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { EVENT_TYPES, type EventType } from "@/lib/defaults";
import { enterGiveaway } from "./actions";
import styles from "../solicitud/solicitud.module.css";

export type GiveawayTheme = { id: string; name: string; card_url: string | null; logo_url: string | null; event_type?: EventType | null };

export function GiveawayForm({ token, themes, announce }: { token: string; themes: GiveawayTheme[]; announce: string }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    facebook_name: "",
    event_type: null as EventType | null,
    theme_id: null as string | null,
    other: false,
    custom_theme: "",
    event_date: "",
    accepted: false,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"ok" | "duplicate" | null>(null);

  const type = form.event_type;
  const characters = type === "cumpleanos";
  const options = type ? themes.filter((t) => !t.event_type || t.event_type === type) : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!type) return setError("Elige el tipo de evento");
    start(async () => {
      const result = await enterGiveaway(token, {
        name: form.name,
        phone: form.phone,
        facebook_name: form.facebook_name,
        event_type: type,
        theme_id: form.other ? null : form.theme_id,
        custom_theme: form.other ? form.custom_theme : null,
        event_date: form.event_date,
      });
      if (result.ok) setDone("ok");
      else if (result.duplicate) setDone("duplicate");
      else setError(result.error);
      if (result.ok || ("duplicate" in result && result.duplicate)) scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <section className={`${styles.card} ${styles.closed}`} role="status">
        <span className={styles.closedIcon} aria-hidden="true">
          🍀
        </span>
        <h2 className={styles.title}>{done === "ok" ? "¡Ya estás participando!" : "¡Ya estabas registrado!"}</h2>
        <p className={styles.lead}>
          Anunciamos a los ganadores el {announce}. Asegúrate de seguirnos en Facebook e Instagram para no perderte el anuncio. ¡Mucha suerte!
        </p>
      </section>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <Section title="Tus datos">
        <Field label="Tu nombre">
          {(id) => <input id={id} className={styles.input} value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} autoComplete="name" placeholder="María López" />}
        </Field>
        <Field label="WhatsApp" help="Por aquí te avisamos si ganas. 10 dígitos.">
          {(id) => <input id={id} className={styles.input} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required autoComplete="tel" placeholder="999 123 4567" />}
        </Field>
        <Field label="¿Cómo apareces en Facebook?" help="Tu nombre tal como sale en Facebook, para comprobar que participas.">
          {(id) => <input id={id} className={styles.input} value={form.facebook_name} onChange={(e) => set("facebook_name", e.target.value)} required maxLength={120} placeholder="Mary López" />}
        </Field>
      </Section>

      <Section title="¿Para qué evento la quieres?">
        <div className={styles.chips}>
          {(Object.keys(EVENT_TYPES) as EventType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              className={styles.chip}
              onClick={() => setForm((f) => ({ ...f, event_type: t, theme_id: null, other: false }))}
            >
              <span aria-hidden="true">{EVENT_TYPES[t].emoji}</span> {EVENT_TYPES[t].label}
            </button>
          ))}
        </div>
        <Field label="¿Para cuándo es? (opcional)" help="Aproximado, si ya lo sabes.">
          {(id) => <input id={id} className={styles.input} type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />}
        </Field>
      </Section>

      {type && (
        <Section title={characters ? "Elige tu personaje" : "Elige el diseño"}>
          <div className={styles.themes} role="radiogroup" aria-label={characters ? "Personaje" : "Diseño"}>
            {options.map((t) => {
              const image = t.card_url || t.logo_url;
              const checked = !form.other && form.theme_id === t.id;
              return (
                <label key={t.id} className={styles.theme} data-checked={checked || undefined}>
                  <input type="radio" name="theme" checked={checked} onChange={() => setForm((f) => ({ ...f, theme_id: t.id, other: false }))} required />
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
              <input type="radio" name="theme" checked={form.other} onChange={() => setForm((f) => ({ ...f, theme_id: null, other: true }))} required />
              <span className={styles.themeBlank} aria-hidden="true">
                ✏️
              </span>
              <span className={styles.themeName}>{characters ? "Otro personaje" : "Otro diseño"}</span>
            </label>
          </div>
          {form.other && (
            <Field label={characters ? "¿Qué personaje quieres?" : "¿Qué diseño o temática quieres?"}>
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
      )}

      <Section title="Requisitos">
        <ul className={styles.requirements}>
          <li>Dale me gusta a nuestra página de Facebook</li>
          <li>Síguenos en Instagram</li>
        </ul>
        <label className={styles.check}>
          <input type="checkbox" checked={form.accepted} onChange={(e) => set("accepted", e.target.checked)} required />
          <span>Ya cumplo los requisitos</span>
        </label>
      </Section>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} disabled={pending}>
        {pending ? "Registrando…" : "Quiero participar"}
      </button>
    </form>
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

function Field({ label, help, children }: { label: string; help?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {help && <span className={styles.help}>{help}</span>}
    </div>
  );
}
