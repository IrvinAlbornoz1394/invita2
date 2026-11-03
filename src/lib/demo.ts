import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { themesTag, themeTag } from "./data";
import { DEMO_INVITATION } from "./defaults";
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
  const { data, error } = await createPublicClient().from("themes").select("*").eq("id", id).maybeSingle<Theme>();
  if (error) throw error;
  return data;
}

/**
 * Invitación de ejemplo con el tema: los datos de prueba de cada invitación
 * nueva, con la fiesta siempre dentro de 3 semanas para que corra la cuenta
 * regresiva. El show usa la imagen del tema si ya la tiene.
 */
export function demoInvitation(theme: Theme, kid: DemoKid, eventAt: string): InvitationWithTheme {
  return {
    id: `demo-${theme.id}`,
    slug: `demo/${theme.id}`,
    published: true,
    theme_id: theme.id,
    ...KIDS[kid],
    age_text: null,
    photo_url: null,
    event_at: eventAt,
    timezone: "America/Merida",
    event_label: DEMO_INVITATION.event_label,
    venue_name: DEMO_INVITATION.venue_name,
    address: DEMO_INVITATION.address,
    area: DEMO_INVITATION.area,
    maps_url: null,
    message: DEMO_INVITATION.message,
    whatsapp: null,
    show: { ...DEMO_INVITATION.show, title: `Show de ${theme.name}`, performers: [] },
    extras: DEMO_INVITATION.extras,
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
