import { z } from "zod";
import { EVENT_TYPE_KEYS, type EventType } from "./defaults";
import { hhmm, names, optionalText, text } from "./schema";

/** Estado guardado; «vencida» se calcula (pendiente con la vigencia ya pasada). */
export type RequestStatus = "pendiente" | "recibida" | "aprobada" | "rechazada";
export type RequestState = RequestStatus | "vencida";

export const REQUEST_STATES: Record<RequestState, { label: string; hint: string }> = {
  pendiente: { label: "Esperando datos", hint: "El cliente todavía no llena el formulario." },
  vencida: { label: "Enlace vencido", hint: "El cliente ya no puede llenarlo; renueva el enlace si hace falta." },
  recibida: { label: "Por revisar", hint: "El cliente ya mandó sus datos: apruébala o recházala." },
  aprobada: { label: "Aprobada", hint: "Ya tiene invitación: termínala en el editor y publícala." },
  rechazada: { label: "Rechazada", hint: "No sigue. Puedes renovar el enlace para que el cliente la corrija." },
};

export function requestState(status: RequestStatus, expiresAt: string, now = Date.now()): RequestState {
  return status === "pendiente" && new Date(expiresAt).getTime() <= now ? "vencida" : status;
}

/** Días de vigencia que se ofrecen al generar o renovar un enlace */
export const REQUEST_DAYS = [1, 3, 7, 15, 30] as const;
export const DEFAULT_REQUEST_DAYS = 7;
/** Al pedir correcciones el enlace dura poco: 24 h */
export const CORRECTION_DAYS = 1;
export const CORRECTION_NOTE_MAX = 600;

/** En la URL va con guion: /solicitud/primera-comunion/<token> */
export const typeSlug = (type: EventType) => type.replace(/_/g, "-");
export const typeFromSlug = (slug: string) => {
  const type = slug.replace(/-/g, "_");
  return (EVENT_TYPE_KEYS as readonly string[]).includes(type) ? (type as EventType) : null;
};

/** Forma del token (base64url); lo demás lo comprueba la base */
export const validToken = (token: unknown): token is string => typeof token === "string" && /^[A-Za-z0-9_-]{32,64}$/.test(token);

export const requestPath = (type: EventType, token: string) => `/solicitud/${typeSlug(type)}/${token}`;

/** Enlace para corregir un prospecto ya enviado: el tipo ya está en la solicitud */
export const correctionPath = (token: string) => `/solicitud/corregir/${token}`;

/** Solo dígitos, con lada: «+52 999 123 4567» → «529991234567» */
export const phoneDigits = (v: string) => v.replace(/\D/g, "");

/** 10 dígitos de México sin lada → con 52, como lo pide WhatsApp */
export const withCountryCode = (digits: string) => (digits.length === 10 ? `52${digits}` : digits);

const phone = (message: string) =>
  z
    .string()
    .transform((v) => withCountryCode(phoneDigits(v)))
    .refine((v) => /^[0-9]{8,15}$/.test(v), message);

/**
 * Enlace de Google Maps (opcional). Acepta el texto que comparte la app
 * («Ubicación: https://maps.app.goo.gl/…») y se queda solo con el enlace.
 */
const mapsLink = z
  .string()
  .trim()
  .max(1000)
  .nullish()
  .transform((v) => v?.match(/https?:\/\/\S+/)?.[0] ?? (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/.test(v), "Pega el enlace completo de Google Maps (empieza con https://)");

export const REQUEST_GALLERY_MAX = 12;
export const REQUEST_EXTRAS_MAX = 20;

/** Lo que llena el cliente. El tipo de evento no viene aquí: lo fija la solicitud. */
export const requestData = z.object({
  name: text(80).min(1, "Escribe el nombre"),
  age: z.number().int().min(0, "Edad no válida").max(120, "Edad no válida").nullable(),
  photo_url: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Foto no válida")
    .nullish()
    .transform((v) => v || null),
  date: z.iso.date("Indica la fecha"),
  time: hhmm,
  venue_name: optionalText(120),
  address: text(200).min(1, "Escribe la dirección del evento"),
  maps_url: mapsLink,
  ceremony: z.object({
    enabled: z.boolean(),
    time: hhmm.nullable().or(z.literal("").transform(() => null)),
    place: optionalText(120),
    address: optionalText(200),
    maps_url: mapsLink,
  }),
  parents: names,
  godparents: names,
  message: optionalText(600),
  whatsapp: phone("Número de WhatsApp no válido (10 dígitos, o con lada del país)"),
  rsvp_ask_people: z.boolean(),
  theme_id: z.uuid().nullable(),
  /** Personaje que no tenemos y el cliente pide que hagamos */
  custom_theme: optionalText(120),
  notes: optionalText(1000),
  // Las de antes no traían extras ni galería
  extras: z
    .array(z.object({ emoji: text(16), label: text(60).min(1, "Cada extra necesita nombre") }))
    .max(REQUEST_EXTRAS_MAX, `Máximo ${REQUEST_EXTRAS_MAX} extras`)
    .default([]),
  gallery: z
    .array(z.string().trim().max(1000).regex(/^https?:\/\//, "Foto no válida"))
    .max(REQUEST_GALLERY_MAX, `Máximo ${REQUEST_GALLERY_MAX} fotos en la galería`)
    .default([]),
});

export type RequestDataInput = z.input<typeof requestData>;
export type RequestData = z.output<typeof requestData>;

/** Lo que captura el panel al crear la solicitud */
export const requestInput = z.object({
  client_name: text(120).min(1, "Escribe el nombre del cliente"),
  client_phone: phone("Teléfono no válido (10 dígitos, o con lada del país)"),
  event_type: z.enum(EVENT_TYPE_KEYS),
  days: z.coerce.number().int().min(1).max(60),
});

type PublishCheck = {
  maps_url: string | null;
  theme_id: string | null;
  ceremony?: { enabled?: boolean; maps_url?: string | null } | null;
};

/**
 * Lo que necesita la invitación de una solicitud para poder publicarse. Lo
 * demás ya lo llenó el cliente (o trae lo de ejemplo de su tipo de evento).
 */
export function publishChecks(inv: PublishCheck, customTheme?: string | null) {
  const checks: { key: "maps" | "ceremony" | "theme"; label: string; done: boolean }[] = [
    { key: "maps", label: "Ubicación de la recepción en Google Maps", done: !!inv.maps_url },
  ];
  if (inv.ceremony?.enabled) checks.push({ key: "ceremony", label: "Ubicación de la iglesia en Google Maps", done: !!inv.ceremony.maps_url });
  checks.push({
    key: "theme",
    label: !inv.theme_id && customTheme ? `Tema: el cliente pidió «${customTheme}», hay que crearlo y asignarlo` : "Tema asignado",
    done: !!inv.theme_id,
  });
  return checks;
}

export const missingForPublish = (inv: PublishCheck, customTheme?: string | null) =>
  publishChecks(inv, customTheme)
    .filter((c) => !c.done)
    .map((c) => c.label);
