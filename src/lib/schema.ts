import { z } from "zod";
import { DEFAULT_SECTIONS, DEFAULT_TEXTS, TITLE_FONTS } from "./defaults";

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
  event_label: text(40).min(1, "Indica el tipo de evento"),
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
  show: z.object({
    enabled: z.boolean(),
    time: hhmm.nullable().or(z.literal("").transform(() => null)),
    title: text(120),
    description: text(600),
    performers: z.array(z.object({ name: text(60), image_url: optionalAsset })).max(12),
    image_url: optionalAsset,
    image_style: z.enum(["framed", "plain"]),
  }),
  extras: z
    .array(z.object({ emoji: text(16), label: text(60).min(1, "Cada extra necesita nombre"), note: text(140) }))
    .max(30),
  gallery: z.array(z.object({ url: assetUrl })).max(40),
  sections: z.record(z.enum(sectionKeys), z.boolean()),
  texts: z
    .partialRecord(z.enum(textKeys), text(200))
    .transform((t) => Object.fromEntries(Object.entries(t).filter(([, v]) => v))),
});

export type InvitationInput = z.input<typeof invitationInput>;

export const themeInput = z.object({
  name: text(80).min(1, "Ponle nombre al tema"),
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
    style: z.enum(["gift", "balloon", "image"]),
    color: hex.nullable(),
    image_url: optionalAsset,
  }),
});

export type ThemeInput = z.input<typeof themeInput>;

export function firstError(error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Datos no válidos";
}
