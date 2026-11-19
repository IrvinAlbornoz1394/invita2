import { z } from "zod";
import { EVENT_TYPE_KEYS } from "./defaults";
import { phoneDigits, withCountryCode } from "./requests";
import { optionalText, text } from "./schema";

export type EntryStatus = "participando" | "ganador" | "descartado";

export const ENTRY_STATES: Record<EntryStatus, string> = {
  participando: "Participando",
  ganador: "Ganador",
  descartado: "Descartado",
};

export const giveawayPath = (token: string) => `/sorteo/${token}`;

/** «el jueves 10 de diciembre» */
export function announceLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("es-MX", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).replace(",", "");
}

/** Lo que se copia para mandar; {enlace} y {fecha} se reemplazan al copiar. */
export const DEFAULT_GIVEAWAY_MESSAGE = `🎁 ¡Estamos regalando invitaciones digitales animadas! 🎉

Para participar:
✅ Dale me gusta a nuestra página de Facebook
✅ Síguenos en Instagram
✅ Regístrate aquí: {enlace}

Anunciamos a los ganadores {fecha}. ¡Mucha suerte! 🍀`;

export function giveawayMessage(template: string, link: string, announceOn: string) {
  return (template || DEFAULT_GIVEAWAY_MESSAGE).replaceAll("{enlace}", link).replaceAll("{fecha}", `el ${announceLabel(announceOn)}`);
}

/** Lo que llena quien participa */
export const entryInput = z
  .object({
    name: text(120).min(1, "Escribe tu nombre"),
    phone: z
      .string()
      .transform((v) => withCountryCode(phoneDigits(v)))
      .refine((v) => /^[0-9]{8,15}$/.test(v), "WhatsApp no válido (10 dígitos)"),
    facebook_name: text(120).min(1, "Escribe cómo apareces en Facebook"),
    event_type: z.enum(EVENT_TYPE_KEYS, "Elige el tipo de evento"),
    theme_id: z.uuid().nullable(),
    custom_theme: optionalText(120),
    event_date: z.iso.date().nullable().or(z.literal("").transform(() => null)),
  })
  .refine((e) => e.theme_id || e.custom_theme, { message: "Elige un personaje o escribe cuál quieres", path: ["theme_id"] });

export type EntryInput = z.input<typeof entryInput>;

/** Lo que captura el panel al crear el giveaway */
export const giveawayInput = z.object({
  name: text(120).min(1, "Ponle nombre al giveaway"),
  winners: z.coerce.number().int().min(1, "Mínimo 1 ganador").max(500),
  announce_on: z.iso.date("Indica la fecha del anuncio"),
});
