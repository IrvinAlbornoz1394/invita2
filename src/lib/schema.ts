import { z } from "zod";
import { THEME_SLUG_MAX } from "./slugify";
import { DECOR_MAX, DEFAULT_SECTIONS, DEFAULT_TEXTS, EVENT_TYPE_KEYS, FLOATER_KIND_KEYS, TITLE_FONTS } from "./defaults";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  text(max)
    .nullish()
    .transform((v) => v || null);

/** Rutas propias (/temas/...) o URLs https (Supabase Storage). */
const assetUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "URL de archivo no válida");
const optionalAsset = assetUrl
  .nullish()
  .or(z.literal(""))
  .transform((v) => v || null);

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora no válida");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color no válido");

/** Lista de nombres (papás, padrinos): se quitan los renglones vacíos */
const names = z
  .array(text(80))
  .max(8)
  .transform((list) => list.filter(Boolean));

const performers = z
  .array(z.object({ name: text(60), image_url: optionalAsset }))
  .max(12)
  .transform((list) => list.filter((p) => p.name || p.image_url));

const textKeys = Object.keys(DEFAULT_TEXTS) as [keyof typeof DEFAULT_TEXTS, ...(keyof typeof DEFAULT_TEXTS)[]];
const sectionKeys = Object.keys(DEFAULT_SECTIONS) as [keyof typeof DEFAULT_SECTIONS, ...(keyof typeof DEFAULT_SECTIONS)[]];

export const invitationInput = z.object({
  published: z.boolean(),
  theme_id: z.uuid().nullable(),
  name_lines: z
    .array(text(24))
    .transform((lines) => lines.filter(Boolean))
    .pipe(z.array(z.string()).min(1, "Escribe el nombre").max(3, "Máximo 3 renglones")),
  age: z.number().int().min(0).max(120).nullable(),
  age_text: optionalText(60),
  photo_url: optionalAsset,
  date: z.iso.date("Fecha no válida"),
  time: hhmm,
  timezone: z.string().min(1).max(64),
  event_type: z.enum(EVENT_TYPE_KEYS),
  event_label: text(40).min(1, "Indica cómo se llama el evento"),
  venue_name: optionalText(120),
  address: optionalText(200),
  area: optionalText(200),
  maps_url: optionalAsset,
  message: optionalText(600),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || /^[0-9]{8,15}$/.test(v), "Número de WhatsApp no válido (8 a 15 dígitos con lada)")
    .transform((v) => v || null),
  rsvp_ask_people: z.boolean(),
  show: z.object({
    enabled: z.boolean(),
    source: z.enum(["theme", "custom"]),
    time: hhmm.nullable().or(z.literal("").transform(() => null)),
    title: text(120),
    description: text(600),
    performers: performers,
    image_source: z.enum(["theme", "custom"]),
    image_url: optionalAsset,
    image_style: z.enum(["framed", "plain"]),
  }),
  extras: z
    .array(z.object({ emoji: text(16), label: text(60).min(1, "Cada extra necesita nombre"), note: text(140) }))
    .max(30),
  gallery: z.array(z.object({ url: assetUrl })).max(40),
  family: z.object({
    parents: names,
    godparents: names,
    parents_photo: optionalAsset,
    godparents_photo: optionalAsset,
  }),
  ceremony: z.object({
    enabled: z.boolean(),
    time: hhmm.nullable().or(z.literal("").transform(() => null)),
    place: optionalText(120),
    address: optionalText(200),
    maps_url: optionalAsset,
  }),
  effects: z.object({
    source: z.enum(["theme", "custom"]),
    intro: z.enum(["gift", "balloon", "book", "envelope", "curtain"]),
    floaters: z.enum(FLOATER_KIND_KEYS),
    keep: z.boolean(),
  }),
  sections: z.record(z.enum(sectionKeys), z.boolean()),
  texts: z
    .partialRecord(z.enum(textKeys), text(200))
    .transform((t) => Object.fromEntries(Object.entries(t).filter(([, v]) => v))),
});

export type InvitationInput = z.input<typeof invitationInput>;

// Cada espacio tiene un lugar fijo, así que se conservan los huecos (null)
const decorImages = z.array(optionalAsset).max(DECOR_MAX);

export const themeInput = z.object({
  name: text(80).min(1, "Ponle nombre al tema"),
  slug: z
    .string()
    .trim()
    .min(2, "La dirección de la demo es muy corta")
    .max(THEME_SLUG_MAX, `La dirección de la demo va hasta ${THEME_SLUG_MAX} letras`)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "La dirección de la demo solo lleva minúsculas, números y guiones"),
  event_type: z.enum(EVENT_TYPE_KEYS).nullable(),
  colors: z.object({
    primary: hex,
    secondary: hex,
    accent: hex,
    highlight: hex,
    surface: hex,
    ink: hex,
  }),
  title_font: z.enum(Object.keys(TITLE_FONTS) as [keyof typeof TITLE_FONTS, ...(keyof typeof TITLE_FONTS)[]]),
  logo_url: optionalAsset,
  logo_style: z.enum(["badge", "plain"]),
  card_url: optionalAsset,
  group_url: optionalAsset,
  show_url: optionalAsset,
  show_style: z.enum(["framed", "plain"]),
  show: z.object({ title: text(120), description: text(600), performers }),
  featured: z.boolean(),
  music_url: optionalAsset,
  music_start: z.number().int().min(0).max(600),
  background: z.object({
    style: z.enum(["rays", "gradient", "dots", "image"]),
    from: hex.nullable(),
    to: hex.nullable(),
    image_url: optionalAsset,
    soften: z.number().int().min(0).max(80),
  }),
  intro: z.object({
    style: z.enum(["gift", "balloon", "book", "envelope", "curtain", "image"]),
    color: hex.nullable(),
    image_url: optionalAsset,
  }),
  decor: z.object({
    details: decorImages,
    extras: decorImages,
    extras_top_width: z.number().int().min(20).max(100),
  }),
  effects: z.object({
    floaters: z.enum(FLOATER_KIND_KEYS).nullable(),
    keep: z.boolean().nullable(),
  }),
});

export type ThemeInput = z.input<typeof themeInput>;

export function firstError(error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Datos no válidos";
}
