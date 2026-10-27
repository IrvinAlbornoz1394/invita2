"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { utcToZoned } from "@/lib/dates";
import {
  DEFAULT_SECTIONS,
  DEFAULT_TEXTS,
  EXTRAS_CATALOG,
  SECTION_LABELS,
  TEXT_LABELS,
  TIMEZONES,
} from "@/lib/defaults";
import type { InvitationInput } from "@/lib/schema";
import type { Extra, ImageStyle, Invitation, Performer, SectionKey, TextKey, Theme } from "@/lib/types";
import { deleteInvitation, duplicateInvitation, saveInvitation } from "../../../actions";
import { CopyLink } from "../../../CopyLink";
import { MediaField } from "../../../MediaField";
import { uploadMedia } from "../../../upload";
import styles from "../../../admin.module.css";

type ThemeOption = Pick<Theme, "id" | "name" | "colors">;

type Form = {
  published: boolean;
  theme_id: string;
  name_lines: [string, string, string];
  age: string;
  age_text: string;
  photo_url: string | null;
  date: string;
  time: string;
  timezone: string;
  event_label: string;
  venue_name: string;
  address: string;
  area: string;
  maps_url: string;
  message: string;
  whatsapp: string;
  show: {
    enabled: boolean;
    time: string;
    title: string;
    description: string;
    performers: Performer[];
    image_url: string | null;
    image_style: ImageStyle;
  };
  extras: Extra[];
  gallery: { url: string }[];
  sections: Record<SectionKey, boolean>;
  texts: Record<TextKey, string>;
};

function toForm(inv: Invitation): Form {
  const { date, time } = utcToZoned(inv.event_at, inv.timezone);
  const lines = [...inv.name_lines, "", "", ""].slice(0, 3) as Form["name_lines"];
  return {
    published: inv.published,
    theme_id: inv.theme_id ?? "",
    name_lines: lines,
    age: inv.age == null ? "" : String(inv.age),
    age_text: inv.age_text ?? "",
    photo_url: inv.photo_url,
    date,
    time,
    timezone: inv.timezone,
    event_label: inv.event_label,
    venue_name: inv.venue_name ?? "",
    address: inv.address ?? "",
    area: inv.area ?? "",
    maps_url: inv.maps_url ?? "",
    message: inv.message ?? "",
    whatsapp: inv.whatsapp ?? "",
    show: {
      enabled: inv.show?.enabled ?? false,
      time: inv.show?.time ?? "",
      title: inv.show?.title ?? "",
      description: inv.show?.description ?? "",
      performers: inv.show?.performers ?? [],
      image_url: inv.show?.image_url ?? null,
      image_style: inv.show?.image_style ?? "framed",
    },
    extras: inv.extras ?? [],
    gallery: inv.gallery ?? [],
    sections: { ...DEFAULT_SECTIONS, ...inv.sections },
    texts: Object.fromEntries((Object.keys(DEFAULT_TEXTS) as TextKey[]).map((k) => [k, inv.texts?.[k] || DEFAULT_TEXTS[k]])) as Form["texts"],
  };
}

function toInput(f: Form): InvitationInput {
  return {
    ...f,
    theme_id: f.theme_id || null,
    age: f.age === "" ? null : Number(f.age),
    show: { ...f.show, time: f.show.time || null },
    // Solo se guardan los textos cambiados: los demás siguen al texto de ejemplo
    texts: Object.fromEntries(Object.entries(f.texts).filter(([k, v]) => v.trim() !== DEFAULT_TEXTS[k as TextKey])),
  };
}

function move<T>(list: T[], i: number, step: number) {
  const j = i + step;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

export function InvitationEditor({ invitation, themes }: { invitation: Invitation; themes: ThemeOption[] }) {
  const [form, setForm] = useState<Form>(() => toForm(invitation));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(invitation)));
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [uploading, setUploading] = useState<string | null>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const dirty = JSON.stringify(form) !== saved;
  const folder = `invitaciones/${invitation.id}`;

  const patch = (p: Partial<Form>) => setForm((f) => ({ ...f, ...p }));
  const patchShow = (p: Partial<Form["show"]>) => setForm((f) => ({ ...f, show: { ...f.show, ...p } }));

  function save(next: Form = form) {
    setError(null);
    startSaving(async () => {
      const res = await saveInvitation(invitation.id, toInput(next));
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(JSON.stringify(next));
      setToast(res.message ?? "Guardado");
      setPreviewKey((k) => k + 1);
    });
  }

  // Ctrl/Cmd + S guarda
  const onShortcut = useEffectEvent(() => save());
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onShortcut();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  // Avisa antes de salir con cambios sin guardar
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  async function addGalleryFiles(files: FileList) {
    const list = [...files];
    const urls: string[] = [];
    setError(null);
    try {
      for (const [i, file] of list.entries()) {
        setUploading(`Subiendo ${i + 1} de ${list.length}…`);
        urls.push(await uploadMedia(file, `${folder}/galeria`));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir una foto");
    } finally {
      setUploading(null);
      if (urls.length) setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls.map((url) => ({ url }))] }));
    }
  }

  const theme = themes.find((t) => t.id === form.theme_id);
  const fullName = form.name_lines.filter(Boolean).join(" ") || "Sin nombre";
  const usedExtras = new Set(form.extras.map((x) => x.label.toLowerCase()));

  return (
    <>
      <Link className={styles.back} href="/admin">
        ← Invitaciones
      </Link>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>{fullName}</h1>
          <p className={styles.pageSub}>
            <span className={`${styles.badge} ${form.published ? styles.badgeOk : ""}`}>
              {form.published ? "Publicada" : "Borrador"}
            </span>{" "}
            <span className={styles.mono}>/{invitation.slug}</span>
          </p>
        </div>
      </div>

      <div className={styles.editor}>
        <div>
          {/* ---------------- Festejado ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Festejado</h2>
            <p className={styles.cardHint}>Cada renglón del nombre aparece en su propia línea en la portada.</p>
            <div className={styles.grid}>
              <div className={styles.grid3}>
                {form.name_lines.map((line, i) => (
                  <label key={i} className={styles.field}>
                    <span className={styles.label}>
                      Nombre · renglón {i + 1}
                      {i > 0 && " (opcional)"}
                    </span>
                    <input
                      className={styles.input}
                      value={line}
                      maxLength={24}
                      onChange={(e) => {
                        const lines = [...form.name_lines] as Form["name_lines"];
                        lines[i] = e.target.value;
                        patch({ name_lines: lines });
                      }}
                    />
                  </label>
                ))}
              </div>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Edad (número en la foto)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    max={120}
                    value={form.age}
                    onChange={(e) => patch({ age: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Texto de edad</span>
                  <input
                    className={styles.input}
                    value={form.age_text}
                    placeholder="Mi primer añito"
                    onChange={(e) => patch({ age_text: e.target.value })}
                  />
                </label>
              </div>
              <MediaField
                label="Foto del festejado"
                help="Se recorta en círculo; procura que la cara quede en la parte de arriba."
                value={form.photo_url}
                onChange={(photo_url) => patch({ photo_url })}
                folder={folder}
              />
            </div>
          </section>

          {/* ---------------- Cuándo y dónde ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Cuándo y dónde</h2>
            <p className={styles.cardHint}>La cuenta regresiva y el botón de agendar usan esta fecha y hora.</p>
            <div className={styles.grid}>
              <div className={styles.grid3}>
                <label className={styles.field}>
                  <span className={styles.label}>Fecha</span>
                  <input className={styles.input} type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Hora</span>
                  <input className={styles.input} type="time" value={form.time} onChange={(e) => patch({ time: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Zona horaria</span>
                  <select className={styles.select} value={form.timezone} onChange={(e) => patch({ timezone: e.target.value })}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Tipo de evento</span>
                <input
                  className={styles.input}
                  value={form.event_label}
                  placeholder="cumpleaños"
                  onChange={(e) => patch({ event_label: e.target.value })}
                />
                <span className={styles.help}>
                  Se usa en el mensaje de WhatsApp y el calendario: “confirmo mi asistencia al <b>{form.event_label || "…"}</b> de{" "}
                  {fullName}”.
                </span>
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Nombre del lugar (opcional)</span>
                <input
                  className={styles.input}
                  value={form.venue_name}
                  placeholder="Salón Arcoíris"
                  onChange={(e) => patch({ venue_name: e.target.value })}
                />
              </label>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span className={styles.label}>Dirección</span>
                  <input
                    className={styles.input}
                    value={form.address}
                    placeholder="Calle 105 #416, por 52 y 50"
                    onChange={(e) => patch({ address: e.target.value })}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Colonia y ciudad</span>
                  <input
                    className={styles.input}
                    value={form.area}
                    placeholder="Col. Dolores Otero, Mérida, Yucatán"
                    onChange={(e) => patch({ area: e.target.value })}
                  />
                </label>
              </div>
              <label className={styles.field}>
                <span className={styles.label}>Enlace de Google Maps (opcional)</span>
                <input
                  className={styles.input}
                  value={form.maps_url}
                  placeholder="https://maps.app.goo.gl/…"
                  onChange={(e) => patch({ maps_url: e.target.value })}
                />
                <span className={styles.help}>
                  Si lo dejas vacío, “Cómo llegar” busca la dirección. Pega el enlace cuando la dirección no sea exacta.
                </span>
              </label>
            </div>
          </section>

          {/* ---------------- Tema ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Tema</h2>
            <p className={styles.cardHint}>Personajes, colores, música e ilustraciones. Se editan en la pestaña Temas.</p>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span className={styles.label}>Tema</span>
                <select className={styles.select} value={form.theme_id} onChange={(e) => patch({ theme_id: e.target.value })}>
                  <option value="">Sin tema (colores por defecto)</option>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              {theme && (
                <div className={styles.field}>
                  <span className={styles.label}>Colores</span>
                  <div className={styles.swatches}>
                    {Object.values(theme.colors).map((c, i) => (
                      <span key={i} className={styles.swatch} style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ---------------- Show ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Show</h2>
            <p className={styles.cardHint}>Anuncia el show y a qué hora empieza. Los personajes son opcionales.</p>
            <label className={styles.switch}>
              <input type="checkbox" checked={form.show.enabled} onChange={(e) => patchShow({ enabled: e.target.checked })} />
              Habrá show
            </label>
            {form.show.enabled && (
              <div className={styles.grid} style={{ marginTop: 16 }}>
                <div className={styles.grid2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Hora del show</span>
                    <input
                      className={styles.input}
                      type="time"
                      value={form.show.time}
                      onChange={(e) => patchShow({ time: e.target.value })}
                    />
                    <span className={styles.help}>Aparece como “Show programado a las 7:00 p.m.”</span>
                  </label>
                  <label className={styles.field}>
                    <span className={styles.label}>Nombre del show</span>
                    <input
                      className={styles.input}
                      value={form.show.title}
                      placeholder="Show de Bely y Beto"
                      onChange={(e) => patchShow({ title: e.target.value })}
                    />
                  </label>
                </div>
                <label className={styles.field}>
                  <span className={styles.label}>Descripción (opcional)</span>
                  <textarea
                    className={styles.textarea}
                    value={form.show.description}
                    placeholder="Canciones, bailes y concursos…"
                    onChange={(e) => patchShow({ description: e.target.value })}
                  />
                </label>

                <MediaField
                  label="Imagen del show (opcional)"
                  help="Un póster, los personajes o el escenario. Va debajo de la hora del show."
                  value={form.show.image_url}
                  onChange={(image_url) => patchShow({ image_url })}
                  folder={folder}
                />
                {form.show.image_url && (
                  <div className={styles.field}>
                    <span className={styles.label}>Estilo de la imagen</span>
                    <div className={styles.chips}>
                      {(
                        [
                          ["framed", "Con marco"],
                          ["plain", "Sin marco (PNG sin fondo)"],
                        ] as const
                      ).map(([value, label]) => (
                        <label key={value} className={styles.check}>
                          <input
                            type="radio"
                            name="show_image_style"
                            checked={form.show.image_style === value}
                            onChange={() => patchShow({ image_style: value })}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.field}>
                  <span className={styles.label}>Personajes / artistas (opcional)</span>
                  <div className={styles.items}>
                    {form.show.performers.map((p, i) => (
                      <div key={i} className={styles.item}>
                        <div className={styles.grid}>
                          <input
                            className={styles.input}
                            value={p.name}
                            placeholder="Nombre"
                            onChange={(e) =>
                              patchShow({
                                performers: form.show.performers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                              })
                            }
                          />
                          <MediaField
                            value={p.image_url}
                            folder={`${folder}/show`}
                            onChange={(image_url) =>
                              patchShow({ performers: form.show.performers.map((x, j) => (j === i ? { ...x, image_url } : x)) })
                            }
                          />
                        </div>
                        <ItemTools
                          index={i}
                          count={form.show.performers.length}
                          onMove={(step) => patchShow({ performers: move(form.show.performers, i, step) })}
                          onRemove={() => patchShow({ performers: form.show.performers.filter((_, j) => j !== i) })}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSmall}`}
                      onClick={() => patchShow({ performers: [...form.show.performers, { name: "", image_url: null }] })}
                      disabled={form.show.performers.length >= 12}
                    >
                      + Agregar personaje
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ---------------- Extras ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Extras de la fiesta</h2>
            <p className={styles.cardHint}>Toca para agregar; luego puedes cambiar el nombre, el emoji o añadir una nota.</p>
            <div className={styles.chips}>
              {EXTRAS_CATALOG.map((x) => (
                <button
                  key={x.label}
                  type="button"
                  className={styles.chip}
                  disabled={usedExtras.has(x.label.toLowerCase())}
                  onClick={() => patch({ extras: [...form.extras, { ...x, note: "" }] })}
                >
                  <span aria-hidden="true">{x.emoji}</span> {x.label}
                </button>
              ))}
              <button
                type="button"
                className={styles.chip}
                onClick={() => patch({ extras: [...form.extras, { emoji: "✨", label: "", note: "" }] })}
              >
                + Otro
              </button>
            </div>
            <div className={styles.items}>
              {form.extras.map((x, i) => {
                const update = (p: Partial<Extra>) => patch({ extras: form.extras.map((e, j) => (j === i ? { ...e, ...p } : e)) });
                return (
                  <div key={i} className={styles.item}>
                    <div className={styles.grid} style={{ gap: 8 }}>
                      <div className={styles.extraRow}>
                        <input
                          className={`${styles.input} ${styles.emojiInput}`}
                          value={x.emoji}
                          aria-label="Emoji"
                          maxLength={16}
                          onChange={(e) => update({ emoji: e.target.value })}
                        />
                        <input
                          className={styles.input}
                          value={x.label}
                          placeholder="Nombre del extra"
                          onChange={(e) => update({ label: e.target.value })}
                        />
                      </div>
                      <input
                        className={styles.input}
                        value={x.note}
                        placeholder="Nota opcional (ej. Trae tu traje de baño)"
                        onChange={(e) => update({ note: e.target.value })}
                      />
                    </div>
                    <ItemTools
                      index={i}
                      count={form.extras.length}
                      onMove={(step) => patch({ extras: move(form.extras, i, step) })}
                      onRemove={() => patch({ extras: form.extras.filter((_, j) => j !== i) })}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* ---------------- Galería ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Galería</h2>
            <p className={styles.cardHint}>Si no subes fotos, la sección no aparece.</p>
            <div className={styles.galleryGrid}>
              {form.gallery.map((g, i) => (
                <div key={g.url + i} className={styles.galleryItem}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" />
                  <div className={styles.galleryTools}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Mover a la izquierda"
                      disabled={i === 0}
                      onClick={() => patch({ gallery: move(form.gallery, i, -1) })}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Quitar"
                      onClick={() => patch({ gallery: form.gallery.filter((_, j) => j !== i) })}
                    >
                      ✕
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label="Mover a la derecha"
                      disabled={i === form.gallery.length - 1}
                      onClick={() => patch({ gallery: move(form.gallery, i, 1) })}
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
              {form.gallery.length < 40 && (
                <button
                  type="button"
                  className={styles.dropzone}
                  onClick={() => galleryInput.current?.click()}
                  disabled={uploading !== null}
                >
                  {uploading ?? "+ Subir fotos"}
                </button>
              )}
            </div>
            <input
              ref={galleryInput}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) addGalleryFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </section>

          {/* ---------------- Mensaje y confirmación ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Mensaje y confirmación</h2>
            <div className={styles.grid} style={{ marginTop: 12 }}>
              <label className={styles.field}>
                <span className={styles.label}>Mensaje para los invitados</span>
                <textarea
                  className={styles.textarea}
                  value={form.message}
                  placeholder="Ven a compartir sonrisas y momentos inolvidables conmigo…"
                  onChange={(e) => patch({ message: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>WhatsApp para confirmaciones</span>
                <input
                  className={styles.input}
                  value={form.whatsapp}
                  inputMode="tel"
                  placeholder="5219991234567"
                  onChange={(e) => patch({ whatsapp: e.target.value })}
                />
                <span className={styles.help}>
                  Los 10 dígitos (se agrega el 52 de México solo) o con lada de país si es de otro país. Si lo dejas vacío, WhatsApp pedirá elegir el
                  contacto.
                </span>
              </label>
            </div>
          </section>

          {/* ---------------- Secciones y textos ---------------- */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Secciones visibles</h2>
            <p className={styles.cardHint}>Show, extras y galería se muestran solos cuando tienen contenido.</p>
            <div className={styles.grid2}>
              {(Object.keys(SECTION_LABELS) as SectionKey[]).map((k) => (
                <label key={k} className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.sections[k]}
                    onChange={(e) => patch({ sections: { ...form.sections, [k]: e.target.checked } })}
                  />
                  {SECTION_LABELS[k]}
                </label>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <details className={styles.more}>
              <summary>Personalizar textos</summary>
              <p className={styles.cardHint}>
                Ya vienen con el texto de ejemplo; cámbialos a tu gusto. Puedes escribir {"{nombre}"} y {"{edad}"}, y si
                dejas uno vacío se usa el de ejemplo.
              </p>
              <div className={styles.grid2}>
                {(Object.keys(TEXT_LABELS) as TextKey[]).map((k) => (
                  <div key={k} className={styles.field}>
                    <span className={styles.labelRow}>
                      <label className={styles.label} htmlFor={`text-${k}`}>
                        {TEXT_LABELS[k]}
                      </label>
                      {form.texts[k].trim() !== DEFAULT_TEXTS[k] && (
                        <button
                          type="button"
                          className={styles.restore}
                          onClick={() => patch({ texts: { ...form.texts, [k]: DEFAULT_TEXTS[k] } })}
                        >
                          Restaurar
                        </button>
                      )}
                    </span>
                    <input
                      id={`text-${k}`}
                      className={styles.input}
                      value={form.texts[k]}
                      placeholder={DEFAULT_TEXTS[k] || "Según la apertura del tema (ej. Toca el regalo)"}
                      onChange={(e) => patch({ texts: { ...form.texts, [k]: e.target.value } })}
                    />
                  </div>
                ))}
              </div>
            </details>
          </section>
        </div>

        {/* ---------------- Lateral: publicación y vista previa ---------------- */}
        <aside className={styles.side}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Publicación</h2>
            <p className={styles.cardHint}>Mientras sea borrador, el enlace lleva a la página principal.</p>
            <div className={styles.grid}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => {
                    const next = { ...form, published: e.target.checked };
                    setForm(next);
                    save(next);
                  }}
                  disabled={saving}
                />
                {form.published ? "Publicada" : "Borrador"}
              </label>
              <div className={styles.linkBox}>
                <input className={styles.input} readOnly value={`/${invitation.slug}`} aria-label="Enlace" />
                <CopyLink slug={invitation.slug} className={`${styles.btn} ${styles.btnSmall}`} />
              </div>
              <a className={`${styles.btn} ${styles.btnSmall}`} href={`/admin/vista/${invitation.id}`} target="_blank">
                Abrir vista previa
              </a>
            </div>
          </section>

          <div className={styles.phone}>
            <iframe key={previewKey} src={`/admin/vista/${invitation.id}`} title="Vista previa" />
          </div>

          <section className={styles.card}>
            <div className={styles.uploadActions}>
              <form action={duplicateInvitation.bind(null, invitation.id)}>
                <button className={`${styles.btn} ${styles.btnSmall}`}>Duplicar</button>
              </form>
              <form
                action={deleteInvitation.bind(null, invitation.id)}
                onSubmit={(e) => {
                  if (!confirm(`¿Borrar la invitación de ${fullName}? Esto no se puede deshacer.`)) e.preventDefault();
                }}
              >
                <button className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}>Borrar</button>
              </form>
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.saveBar}>
        <span className={`${styles.saveStatus} ${dirty ? styles.dirty : ""}`}>
          {error ? <span className={styles.error}>{error}</span> : dirty ? "Cambios sin guardar" : "Todo guardado"}
        </span>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => save()} disabled={saving || !dirty}>
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

function ItemTools({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (step: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.itemTools}>
      <button type="button" className={styles.iconBtn} aria-label="Subir" disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Bajar" disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Quitar" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
