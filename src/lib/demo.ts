import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { themesTag, themeTag } from "./data";
import { ageRibbon, DEMO_INVITATIONS, eventType, RECEPTION_AFTER_HOURS } from "./defaults";
import { themeHasShow } from "./view";
import { createPublicClient } from "./supabase/public";
import type { InvitationWithTheme, Theme } from "./types";

/** Festejado de la demo: siempre el mismo, para que cada personaje se compare con los mismos datos. */
const DEMO_KID = { name_lines: ["Mateo"], age: 6 };

/** Fotos de ejemplo (public/temas/demo): perfil para la foto principal, el resto en la galería. */
const DEMO_PHOTOS = "/temas/demo/";
const demoPhoto = (file: string) => encodeURI(DEMO_PHOTOS + file);
const DEMO_PHOTO = demoPhoto("perfil.jpg");
const DEMO_GALLERY = [
  "images (2).jpg",
  "images (1).jpg",
  "two-happy-excited-darkskinned-latino-260nw-2484330879.webp",
  "young-latino-boy-between-1-260nw-2645144735.webp",
  "images (4).jpg",
  "images.jpg",
  "images (3).jpg",
  "1.webp",
  "istockphoto-1397872098-612x612.jpg",
  "istockphoto-638924066-612x612.jpg",
].map((file) => ({ url: demoPhoto(file) }));
/** Fotos de los papás y los padrinos: solo en bautizo y comunión */
const DEMO_FAMILY_PHOTOS = { parents_photo: demoPhoto("papas.jpg"), godparents_photo: demoPhoto("padrinos.jpg") };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Tema para la demo pública, por su dirección corta o su id; null si no existe o se eliminó.
 * Los desactivados también tienen demo: así se comparte con un cliente un tema
 * que todavía no sale en la landing.
 */
export async function getDemoTheme(key: string): Promise<Theme | null> {
  "use cache";
  cacheLife("days");
  cacheTag(themesTag);

  // Enlaces viejos con el id; los nuevos usan la dirección corta
  const byId = UUID.test(key);
  if (!byId && !/^[a-z0-9-]{1,48}$/.test(key)) return null;
  const { data, error } = await createPublicClient()
    .from("themes")
    .select("*")
    .eq(byId ? "id" : "slug", key)
    .eq("is_deleted", false)
    .maybeSingle<Theme>();
  if (error) throw error;
  if (data) cacheTag(themeTag(data.id));
  return data;
}

/**
 * Invitación de ejemplo con el tema: los datos de prueba de cada invitación
 * nueva, con la fiesta siempre dentro de 3 semanas para que corra la cuenta
 * regresiva. Si el tema trae show, la demo lo muestra (también en bautizo y
 * comunión); si no, un show de ejemplo con el nombre del tema.
 */
export function demoInvitation(theme: Theme, eventAt: string): InvitationWithTheme {
  const type = eventType(theme.event_type);
  const demo = DEMO_INVITATIONS[type];
  const religious = demo.ceremony.enabled;
  // Religiosos: misa a la hora de la demo y recepción después
  const at = religious ? new Date(new Date(eventAt).getTime() + RECEPTION_AFTER_HOURS * 36e5).toISOString() : eventAt;
  const show = themeHasShow(theme)
    ? { ...demo.show, enabled: true, time: demo.show.time ?? "19:00", source: "theme" as const }
    : religious
      ? demo.show
      : { ...demo.show, source: "custom" as const, title: `Show de ${theme.name}`, performers: [] };
  const startTime = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Merida", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(eventAt));
  return {
    id: `demo-${theme.id}`,
    slug: `demo/${theme.slug}`,
    published: true,
    is_active: true,
    is_deleted: false,
    theme_id: theme.id,
    ...DEMO_KID,
    ...(religious ? { age: null, age_text: ageRibbon(null, type) } : { age_text: null }),
    photo_url: DEMO_PHOTO,
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
    rsvp_ask_people: true,
    show,
    extras: demo.extras,
    family: religious ? { ...demo.family, ...DEMO_FAMILY_PHOTOS } : demo.family,
    ceremony: religious ? { ...demo.ceremony, time: startTime } : demo.ceremony,
    gallery: DEMO_GALLERY,
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
