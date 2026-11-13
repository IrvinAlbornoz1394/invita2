"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { autoBackground, BACKGROUND_STYLES, DEFAULT_SOFTEN, resolveBackground } from "@/lib/background";
import {
  COLOR_LABELS, DECOR_SECTIONS, defaultEffects, EVENT_FONTS, EVENT_TYPES, FLOATER_KINDS, INTRO_STYLES, TITLE_FONTS, type EventType,
  type FloaterKind, type TitleFont,
} from "@/lib/defaults";
import type { ThemeInput } from "@/lib/schema";
import { slugify, THEME_SLUG_MAX } from "@/lib/slugify";
import { themeDecor } from "@/lib/view";
import { isReligious } from "@/lib/defaults";
import type { DecorKey, ImageStyle, LogoStyle, Theme, ThemeColors } from "@/lib/types";
import { saveTheme } from "../../../actions";
import { ThemeActions } from "../../../ThemeActions";
import { MediaField } from "../../../MediaField";
import { PerformersField } from "../../../PerformersField";
import styles from "../../../admin.module.css";

const SHOW_STYLES: { value: ImageStyle; label: string }[] = [
  { value: "framed", label: "Con marco" },
  { value: "plain", label: "Sin marco (PNG sin fondo)" },
];

const LOGO_STYLES: { value: LogoStyle; label: string }[] = [
  { value: "badge", label: "Con recuadro y fondo" },
  { value: "plain", label: "Sin recuadro" },
];

function toForm(t: Theme): ThemeInput {
  return {
    name: t.name,
    slug: t.slug,
    event_type: t.event_type ?? null,
    colors: t.colors,
    title_font: (t.title_font in TITLE_FONTS ? t.title_font : "lilita") as TitleFont,
    logo_url: t.logo_url,
    logo_style: t.logo_style ?? "badge",
    card_url: t.card_url,
    group_url: t.group_url,
    show_url: t.show_url ?? null,
    show_style: t.show_style ?? "framed",
    show: {
      title: t.show?.title ?? "",
      description: t.show?.description ?? "",
      performers: t.show?.performers ?? [],
    },
    featured: t.featured ?? false,
    music_url: t.music_url,
    music_start: t.music_start,
    background: {
      style: t.background?.style ?? "rays",
      from: t.background?.from ?? null,
      to: t.background?.to ?? null,
      image_url: t.background?.image_url ?? null,
      soften: t.background?.soften ?? DEFAULT_SOFTEN,
    },
    intro: {
      style: t.intro?.style ?? "gift",
      color: t.intro?.color ?? null,
      image_url: t.intro?.image_url ?? null,
    },
    decor: themeDecor(t.decor),
    effects: {
      floaters: t.effects?.floaters ?? null,
      keep: t.effects?.keep ?? null,
    },
  };
}

const floaterLabel = (kind: FloaterKind) => FLOATER_KINDS.find((k) => k.value === kind)!.label;

export function ThemeEditor({ theme, uses }: { theme: Theme; uses: number }) {
  const [form, setForm] = useState<ThemeInput>(() => toForm(theme));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(theme)));
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dirty = JSON.stringify(form) !== saved;
  const folder = `temas/${theme.id}`;
  const recommended = EVENT_FONTS[form.event_type ?? "cumpleanos"];
  const otherFonts = (Object.keys(TITLE_FONTS) as TitleFont[]).filter((k) => !recommended.includes(k));
  const patch = (p: Partial<ThemeInput>) => setForm((f) => ({ ...f, ...p }));
  const patchBg = (p: Partial<ThemeInput["background"]>) => setForm((f) => ({ ...f, background: { ...f.background, ...p } }));
  const autoBg = autoBackground(form.colors);
  const patchShow = (p: Partial<ThemeInput["show"]>) => setForm((f) => ({ ...f, show: { ...f.show, ...p } }));
  const forParties = !form.event_type || !isReligious(form.event_type);
  const patchIntro = (p: Partial<ThemeInput["intro"]>) => setForm((f) => ({ ...f, intro: { ...f.intro, ...p } }));
  const patchEffects = (p: Partial<ThemeInput["effects"]>) => setForm((f) => ({ ...f, effects: { ...f.effects, ...p } }));
  // Sin elegir: lo de siempre del tipo de evento (sin tipo, como cumpleaños)
  const autoEffects = defaultEffects(form.event_type ?? "cumpleanos");
  const floaters = form.effects.floaters ?? autoEffects.floaters;
  const setDecor = (key: DecorKey, i: number, url: string | null) =>
    setForm((f) => ({ ...f, decor: { ...f.decor, [key]: f.decor[key].map((u, j) => (j === i ? url : u)) } }));

  function save() {
    setError(null);
    startSaving(async () => {
      const res = await saveTheme(theme.id, form);
      if (!res.ok) return setError(res.error);
      setSaved(JSON.stringify(form));
      setToast(res.message ?? "Guardado");
    });
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <>
      <Link className={styles.back} href="/admin/temas">
        ← Temas
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{form.name || "Tema"}</h1>
          <p className={styles.pageSub}>
            {uses === 0 ? "Ninguna invitación lo usa" : uses === 1 ? "Lo usa 1 invitación" : `Lo usan ${uses} invitaciones`}
            {uses > 0 && " · los cambios se ven en todas al guardar"}
            {theme.is_active === false && (
              <>
                {" "}
                <span className={`${styles.badge} ${styles.badgeOff}`}>Desactivado</span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className={styles.editor}>
        <div>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>General</h2>
            <div className={styles.grid} style={{ marginTop: 12 }}>
              <label className={styles.field}>
                <span className={styles.label}>Nombre del tema</span>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    // Mientras la dirección siga al nombre (o sea la de «Nuevo tema»), se actualiza con él
                    setForm((f) =>
                      f.slug === slugify(f.name, THEME_SLUG_MAX) || f.slug.startsWith("nuevo-tema-")
                        ? { ...f, name, slug: slugify(name, THEME_SLUG_MAX) || f.slug }
                        : { ...f, name }
                    );
                  }}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Dirección de la demo</span>
                <span className={styles.slugField}>
                  <span className={styles.slugPrefix}>/demo/</span>
                  <input
                    className={styles.input}
                    value={form.slug}
                    maxLength={THEME_SLUG_MAX}
                    onChange={(e) => patch({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-") })}
                    onBlur={() => patch({ slug: slugify(form.slug, THEME_SLUG_MAX) || slugify(form.name, THEME_SLUG_MAX) })}
                  />
                </span>
                <span className={styles.help}>
                  La que compartes con el cliente. Si la cambias, los enlaces que ya mandaste con la anterior dejan de funcionar.
                </span>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Tipo de evento</span>
                <select
                  className={styles.select}
                  value={form.event_type ?? ""}
                  onChange={(e) => patch({ event_type: (e.target.value || null) as EventType | null })}
                >
                  <option value="">Cualquier evento</option>
                  {(Object.keys(EVENT_TYPES) as EventType[]).map((t) => (
                    <option key={t} value={t}>
                      {EVENT_TYPES[t].label}
                    </option>
                  ))}
                </select>
                <span className={styles.help}>Al crear una invitación de ese tipo, este tema aparece primero.</span>
              </label>
              {forParties && (
                <label className={styles.check}>
                  <input type="checkbox" checked={form.featured} onChange={(e) => patch({ featured: e.target.checked })} />
                  Destacado en la landing
                </label>
              )}
              {forParties && (
                <span className={styles.help} style={{ marginTop: -8 }}>
                  La landing muestra los destacados y un botón para ver todos los personajes. Si no hay ninguno destacado,
                  muestra los primeros 6.
                </span>
              )}
              <label className={styles.field}>
                <span className={styles.label}>Tipografía de títulos</span>
                <select
                  className={styles.select}
                  value={form.title_font}
                  onChange={(e) => patch({ title_font: e.target.value as TitleFont })}
                >
                  <optgroup label={form.event_type ? `Recomendadas para ${EVENT_TYPES[form.event_type].label.toLowerCase()}` : "Infantiles"}>
                    {recommended.map((key) => (
                      <option key={key} value={key}>
                        {TITLE_FONTS[key]}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Todas las demás">
                    {otherFonts.map((key) => (
                      <option key={key} value={key}>
                        {TITLE_FONTS[key]}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className={styles.fontSample} style={{ fontFamily: `var(--font-${form.title_font})` }}>
                  {EVENT_TYPES[form.event_type ?? "cumpleanos"].sample}
                </span>
              </label>
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Colores</h2>
            <p className={styles.cardHint}>Los tonos oscuros (sombras, bordes) se calculan solos a partir de estos.</p>
            <div className={styles.grid2}>
              {(Object.keys(COLOR_LABELS) as (keyof ThemeColors)[]).map((k) => (
                <label key={k} className={styles.field}>
                  <span className={styles.label}>{COLOR_LABELS[k]}</span>
                  <span className={styles.colorField}>
                    <ColorInputs value={form.colors[k]} onChange={(v) => patch({ colors: { ...form.colors, [k]: v } })} />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Fondo</h2>
            <p className={styles.cardHint}>Se usa en la pantalla del regalo, la portada y el pie de la invitación.</p>
            <div className={styles.chips}>
              {BACKGROUND_STYLES.map((o) => (
                <label key={o.value} className={styles.check}>
                  <input
                    type="radio"
                    name="bg_style"
                    checked={form.background.style === o.value}
                    onChange={() => patchBg({ style: o.value })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <div className={styles.grid2}>
              {(
                [
                  ["from", form.background.style === "image" ? "Color mientras carga la imagen" : "Color 1"],
                  ["to", "Color 2"],
                ] as const
              )
                .filter(([key]) => key === "from" || form.background.style !== "image")
                .map(([key, label]) => (
                  <div key={key} className={styles.field}>
                    <span className={styles.labelRow}>
                      <span className={styles.label}>{label}</span>
                      {form.background[key] ? (
                        <button type="button" className={styles.restore} onClick={() => patchBg({ [key]: null })}>
                          Usar colores del tema
                        </button>
                      ) : (
                        <span className={styles.help}>automático</span>
                      )}
                    </span>
                    <span className={styles.colorField}>
                      <ColorInputs value={form.background[key] ?? autoBg[key]} onChange={(v) => patchBg({ [key]: v || null })} />
                    </span>
                  </div>
                ))}
            </div>
            <label className={styles.field} style={{ marginTop: 14 }}>
              <span className={styles.label}>Suavizar fondo: {form.background.soften}%</span>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={form.background.soften}
                onChange={(e) => patchBg({ soften: Number(e.target.value) })}
              />
              <span className={styles.help}>
                Un velo blanco encima del fondo para que no compita con el contenido. Súbelo si los colores del fondo se
                parecen a los de los títulos.
              </span>
            </label>
            {form.background.style === "image" && (
              <div className={styles.grid} style={{ marginTop: 14 }}>
                <MediaField
                  label="Imagen de fondo"
                  help="Vertical de preferencia (se recorta para cubrir la pantalla). Sin imagen se usan los rayos."
                  value={form.background.image_url ?? null}
                  onChange={(image_url) => patchBg({ image_url })}
                  folder={folder}
                />
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Ilustraciones</h2>
            <p className={styles.cardHint}>Todas son opcionales; si falta alguna, esa parte simplemente no se muestra.</p>
            <div className={styles.grid}>
              <MediaField
                label="Logo"
                help="Aparece arriba en la portada."
                value={form.logo_url ?? null}
                onChange={(logo_url) => patch({ logo_url })}
                folder={folder}
              />
              {form.logo_url && (
                <div className={styles.field}>
                  <span className={styles.label}>Estilo del logo</span>
                  <div className={styles.chips}>
                    {LOGO_STYLES.map((o) => (
                      <label key={o.value} className={styles.check}>
                        <input
                          type="radio"
                          name="logo_style"
                          checked={form.logo_style === o.value}
                          onChange={() => patch({ logo_style: o.value })}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <span className={styles.help}>
                    Con recuadro va bien para logos con fondo propio; sin recuadro, para logos PNG con fondo transparente
                    (se muestra completo, sin recortar).
                  </span>
                </div>
              )}
              <MediaField
                label="Imagen de la tarjeta"
                help="Los personajes, de preferencia PNG sin fondo. Va arriba en la tarjeta y el nombre y la fecha debajo, sin encimarse."
                value={form.card_url ?? null}
                onChange={(card_url) => patch({ card_url })}
                folder={folder}
              />
              <MediaField
                label="Imagen de grupo"
                help="Los personajes juntos; se muestra en la sección del mensaje."
                value={form.group_url ?? null}
                onChange={(group_url) => patch({ group_url })}
                folder={folder}
              />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Show</h2>
            <p className={styles.cardHint}>
              El show que trae el tema. Lo usan la demo y las invitaciones que eligen “Show del tema”; cada invitación solo
              pone la hora. Si no tiene nombre, se llama “Show de {form.name || "este tema"}”.
            </p>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span className={styles.label}>Nombre del show</span>
                <input
                  className={styles.input}
                  value={form.show.title}
                  placeholder={`Show de ${form.name || "Bely y Beto"}`}
                  onChange={(e) => patchShow({ title: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Descripción</span>
                <textarea
                  className={styles.textarea}
                  value={form.show.description}
                  placeholder="Canciones, bailes y concursos con los personajes…"
                  onChange={(e) => patchShow({ description: e.target.value })}
                />
              </label>
              <MediaField
                label="Imagen del show"
                help="Los personajes del show o un póster. Las invitaciones con show propio también pueden usarla."
                value={form.show_url ?? null}
                onChange={(show_url) => patch({ show_url })}
                folder={folder}
              />
              {form.show_url && (
                <div className={styles.field}>
                  <span className={styles.label}>Estilo de la imagen del show</span>
                  <div className={styles.chips}>
                    {SHOW_STYLES.map((o) => (
                      <label key={o.value} className={styles.check}>
                        <input
                          type="radio"
                          name="show_style"
                          checked={form.show_style === o.value}
                          onChange={() => patch({ show_style: o.value })}
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <PerformersField
                value={form.show.performers}
                onChange={(performers) => patchShow({ performers })}
                folder={`${folder}/show`}
                label="Personajes del show (opcional)"
              />
            </div>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Elementos flotantes</h2>
            <p className={styles.cardHint}>
              Imágenes PNG sin fondo (personajes, globos, estrellas…) que flotan en algunas secciones. Cada espacio
              tiene su lugar; los vacíos no se muestran.
            </p>
            {DECOR_SECTIONS.map((s) => (
              <div key={s.key} className={styles.field} style={{ marginTop: 14 }}>
                <span className={styles.label}>
                  {s.label} · {s.hint}
                </span>
                <div className={styles.grid2}>
                  {form.decor[s.key].map((url, i) => (
                    <MediaField
                      key={i}
                      label={s.slots[i]}
                      value={url ?? null}
                      onChange={(v) => setDecor(s.key, i, v)}
                      folder={folder}
                    />
                  ))}
                </div>
                {s.key === "extras" && (
                  <label className={styles.field} style={{ marginTop: 10 }}>
                    <span className={styles.label}>
                      Ancho de las imágenes: {form.decor.extras_top_width}%
                    </span>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      step={5}
                      value={form.decor.extras_top_width}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, decor: { ...f.decor, extras_top_width: Number(e.target.value) } }))
                      }
                    />
                    <span className={styles.help}>
                      Aplica a las dos: la de debajo del título y la de debajo de los elementos. Qué tanto del ancho de la pantalla ocupan (100% = de orilla a orilla).
                    </span>
                  </label>
                )}
              </div>
            ))}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Apertura</h2>
            <p className={styles.cardHint}>Lo primero que ven: al tocarlo se abre la invitación y empieza la música.</p>
            <div className={styles.chips}>
              {INTRO_STYLES.map((o) => (
                <label key={o.value} className={styles.check}>
                  <input
                    type="radio"
                    name="intro_style"
                    checked={form.intro.style === o.value}
                    onChange={() => patchIntro({ style: o.value })}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            {form.intro.style === "balloon" && (
              <div className={styles.field} style={{ maxWidth: 320 }}>
                <span className={styles.labelRow}>
                  <span className={styles.label}>Color del globo</span>
                  {form.intro.color ? (
                    <button type="button" className={styles.restore} onClick={() => patchIntro({ color: null })}>
                      Usar color principal
                    </button>
                  ) : (
                    <span className={styles.help}>color principal</span>
                  )}
                </span>
                <span className={styles.colorField}>
                  <ColorInputs
                    value={form.intro.color ?? form.colors.primary}
                    onChange={(v) => patchIntro({ color: v || null })}
                  />
                </span>
              </div>
            )}
            {form.intro.style === "image" && (
              <div className={styles.grid}>
                <MediaField
                  label="Imagen para abrir"
                  help="PNG sin fondo: la placa de Paw Patrol, un huevo de dinosaurio, el logo de Roblox… Flota y al tocarla estalla con confeti. Sin imagen se usa el regalo."
                  value={form.intro.image_url ?? null}
                  onChange={(image_url) => patchIntro({ image_url })}
                  folder={folder}
                />
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Elementos que flotan</h2>
            <p className={styles.cardHint}>
              Suben (o caen) por la portada y se pueden tocar. Cada invitación puede usar estos o elegir otros.
            </p>
            <div className={styles.field}>
              <span className={styles.label}>¿Qué flota?</span>
              <div className={styles.chips}>
                <label className={styles.check}>
                  <input
                    type="radio"
                    name="effects_floaters"
                    checked={form.effects.floaters === null}
                    onChange={() => patchEffects({ floaters: null })}
                  />
                  Según el evento ({floaterLabel(autoEffects.floaters).toLowerCase()})
                </label>
                {FLOATER_KINDS.map((o) => (
                  <label key={o.value} className={styles.check}>
                    <input
                      type="radio"
                      name="effects_floaters"
                      checked={form.effects.floaters === o.value}
                      onChange={() => patchEffects({ floaters: o.value })}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            </div>
            {floaters !== "none" && (
              <div className={styles.field} style={{ marginTop: 16 }}>
                <span className={styles.label}>Después de la portada</span>
                <div className={styles.chips}>
                  {(
                    [
                      [null, `Según el evento (${autoEffects.keep ? "siguen saliendo" : "solo en la portada"})`],
                      [false, "Solo en la portada"],
                      [true, "Siguen saliendo en toda la invitación"],
                    ] as const
                  ).map(([value, label]) => (
                    <label key={String(value)} className={styles.check}>
                      <input
                        type="radio"
                        name="effects_keep"
                        checked={form.effects.keep === value}
                        onChange={() => patchEffects({ keep: value })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <span className={styles.help}>Si siguen saliendo, cada tanto sube una tanda pequeña mientras se lee la invitación.</span>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Música</h2>
            <p className={styles.cardHint}>Empieza al abrir el regalo y se repite. MP3 de preferencia.</p>
            <div className={styles.grid}>
              <MediaField
                kind="audio"
                value={form.music_url ?? null}
                onChange={(music_url) => patch({ music_url })}
                folder={folder}
              />
              <label className={styles.field} style={{ maxWidth: 260 }}>
                <span className={styles.label}>Empezar en el segundo</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={600}
                  value={form.music_start}
                  onChange={(e) => patch({ music_start: Number(e.target.value) || 0 })}
                />
                <span className={styles.help}>Para saltar silencios o intros largas.</span>
              </label>
            </div>
          </section>
        </div>

        <aside className={styles.side}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Vista rápida</h2>
            <ThemeSample form={form} />
          </section>
          <section className={styles.card}>
            <div className={styles.uploadActions}>
              <ThemeActions id={theme.id} name={form.name || theme.name} active={theme.is_active !== false} uses={uses} />
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.saveBar}>
        <span className={`${styles.saveStatus} ${dirty ? styles.dirty : ""}`}>
          {error ? <span className={styles.error}>{error}</span> : dirty ? "Cambios sin guardar" : "Todo guardado"}
        </span>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving || !dirty}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </>
  );
}

/** Muestra pequeña con los colores y la tipografía elegidos. */
function ThemeSample({ form }: { form: ThemeInput }) {
  const c = form.colors;
  const title = `var(--font-${form.title_font})`;
  const bg = resolveBackground(c, form.background);
  const backgrounds = {
    rays: `repeating-conic-gradient(from 0deg, ${bg.from} 0deg 11deg, ${bg.to} 11deg 22deg)`,
    gradient: `linear-gradient(150deg, ${bg.from}, ${bg.to})`,
    dots: `radial-gradient(circle, ${bg.to} 0 7px, transparent 8px) 0 0 / 40px 40px, radial-gradient(circle, ${bg.to} 0 7px, transparent 8px) 20px 20px / 40px 40px, ${bg.from}`,
    image: `url("${encodeURI(bg.imageUrl ?? "")}") center / cover no-repeat, ${bg.from}`,
  };
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: `linear-gradient(rgb(255 255 255 / ${bg.soften / 100}), rgb(255 255 255 / ${bg.soften / 100})), ${backgrounds[bg.style]}`,
        padding: "28px 16px",
        textAlign: "center",
        display: "grid",
        gap: 10,
        justifyItems: "center",
      }}
    >
      <span style={{ background: c.secondary, color: "#fff", padding: "4px 14px", borderRadius: 999, border: "3px solid #fff", fontFamily: title }}>
        ¡Estás invitado!
      </span>
      <span
        style={{
          fontFamily: title,
          fontSize: "2.6rem",
          lineHeight: 1,
          color: c.primary,
          WebkitTextStroke: "8px #fff",
          paintOrder: "stroke fill",
        }}
      >
        Sofía
      </span>
      <span style={{ background: c.surface, color: c.ink, padding: "6px 14px", borderRadius: 12, border: "3px solid #fff", fontWeight: 800 }}>
        12 de diciembre · 5:00 p. m.
      </span>
      <span style={{ background: c.primary, color: "#fff", padding: "6px 18px", borderRadius: 999, border: "3px solid #fff", fontFamily: title }}>
        Confirmar
      </span>
    </div>
  );
}

/** Selector de color + campo de texto hexadecimal. */
function ColorInputs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <input
        className={`${styles.input} ${styles.mono}`}
        value={value}
        maxLength={7}
        onChange={(e) => onChange(e.target.value)}
      />
    </>
  );
}
