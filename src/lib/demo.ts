import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { themesTag, themeTag } from "./data";
import { ageRibbon, DEMO_INVITATIONS, eventType, RECEPTION_AFTER_HOURS } from "./defaults";
import { createPublicClient } from "./supabase/public";
import type { InvitationWithTheme, Theme } from "./types";

/** Para quién es la demo: cambia el nombre y la edad del festejado. */
export type DemoKid = "nino" | "nina";

const KIDS: Record<DemoKid, { name_lines: string[]; age: number }> = {
  nino: { name_lines: ["Mateo"], age: 6 },
  nina: { name_lines: ["Valentina"], age: 5 },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tema para la demo pública; null si el id no es válido o no existe. */
export async function getDemoTheme(id: string): Promise<Theme | null> {
  "use cache";
  cacheLife("days");
  cacheTag(themesTag, themeTag(id));

  if (!UUID.test(id)) return null;
  const { data, error } = await createPublicClient().from("themes").select("*").eq("id", id).eq("is_active", true).eq("is_deleted", false).maybeSingle<Theme>();
  if (error) throw error;
  return data;
}

/**
 * Invitación de ejemplo con el tema: los datos de prueba de cada invitación
 * nueva, con la fiesta siempre dentro de 3 semanas para que corra la cuenta
 * regresiva. El show usa la imagen del tema si ya la tiene.
 */
export function demoInvitation(theme: Theme, kid: DemoKid, eventAt: string): InvitationWithTheme {
  const type = eventType(theme.event_type);
  const demo = DEMO_INVITATIONS[type];
  const religious = demo.ceremony.enabled;
  // Religiosos: misa a la hora de la demo y recepción después
  const at = religious ? new Date(new Date(eventAt).getTime() + RECEPTION_AFTER_HOURS * 36e5).toISOString() : eventAt;
  const startTime = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Merida", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(eventAt));
  return {
    id: `demo-${theme.id}`,
    slug: `demo/${theme.id}`,
    published: true,
    is_active: true,
    is_deleted: false,
    theme_id: theme.id,
    ...KIDS[kid],
    ...(religious ? { age: null, age_text: ageRibbon(null, type) } : { age_text: null }),
    photo_url: null,
    event_at: at,
    timezone: "America/Merida",
    event_type: type,
    event_label: demo.event_label,
    venue_name: demo.venue_name,
    address: demo.address,
    area: demo.area,
    maps_url: null,
    message: demo.message,
    whatsapp: null,
    show: religious ? demo.show : { ...demo.show, title: `Show de ${theme.name}`, performers: [] },
    extras: demo.extras,
    family: demo.family,
    ceremony: religious ? { ...demo.ceremony, time: startTime } : demo.ceremony,
    gallery: [],
    sections: {},
    texts: {},
    updated_at: eventAt,
    theme,
  };
}

/** Fecha de la fiesta de ejemplo: dentro de 3 semanas a las 4:00 p.m. (Mérida); se renueva cada día. */
export async function demoEventAt(): Promise<string> {
  "use cache";
  cacheLife("days");

  const at = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
  at.setUTCHours(22, 0, 0, 0);
  return at.toISOString();
}

export function demoKid(value: string | string[] | undefined): DemoKid {
  return value === "nina" ? "nina" : "nino";
}
