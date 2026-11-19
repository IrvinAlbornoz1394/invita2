"use server";

import { randomBytes, randomInt } from "node:crypto";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invitationTag, themeTag, themesTag } from "@/lib/data";
import { zonedToUtc } from "@/lib/dates";
import { ageRibbon, DEFAULT_COLORS, DEMO_INVITATIONS, eventType, hasAge, isReligious, RECEPTION_AFTER_HOURS, usesFullName, type EventType } from "@/lib/defaults";
import { firstError, invitationInput, themeInput, type InvitationInput, type ThemeInput } from "@/lib/schema";
import { invitationSlug, randomHash, slugify } from "@/lib/slug";
import { resolveMapsDestination } from "@/lib/maps";
import { DEFAULT_REQUEST_DAYS, missingForPublish, requestData, requestInput, type RequestData } from "@/lib/requests";
import { requestPhotoPrefix } from "@/lib/request-photos";
import { DEFAULT_GIVEAWAY_MESSAGE, giveawayInput } from "@/lib/giveaways";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Invitaciones ---------------- */

type PublishFields = { maps_url: string | null; theme_id: string | null; ceremony: { enabled?: boolean; maps_url?: string | null } | null };

/**
 * Las invitaciones que salieron de una solicitud no se publican mientras les
 * falte algo (mapa, tema…). Las demás, sin restricción. `fields` son los
 * valores que se van a guardar; sin ellos se leen de la base.
 */
async function publishBlock(supabase: Awaited<ReturnType<typeof createClient>>, id: string, fields?: PublishFields) {
  const { data: req } = await supabase.from("invitation_requests").select("data").eq("invitation_id", id).maybeSingle();
  if (!req) return null;
  let inv = fields;
  if (!inv) {
    const { data } = await supabase.from("invitations").select("maps_url, theme_id, ceremony").eq("id", id).single();
    inv = data as PublishFields;
  }
  const missing = missingForPublish(inv, (req.data as { custom_theme?: string | null } | null)?.custom_theme);
  return missing.length ? `No se puede publicar todavía. Falta: ${missing.join("; ").toLowerCase()}` : null;
}

function nameParts(name: string, type: EventType) {
  // El nombre completo va en renglones: "Lucero Jeamileth" → ["Lucero", "Jeamileth"]
  const words = name.trim().split(/\s+/);
  const nameLines = words.length <= 3 ? words : [words.slice(0, -1).join(" "), words.at(-1)!];
  // Posada: «Familia López» → /familia-lopez-k3f9a2 (con solo «familia» no se distinguen)
  const slugBase = usesFullName(type) ? words.slice(0, 3).join(" ") : words[0];
  return { nameLines, slugBase };
}

export async function createInvitation(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const timezone = String(formData.get("timezone") ?? "America/Merida");
  const themeId = String(formData.get("theme_id") ?? "") || null;
  const type = eventType(String(formData.get("event_type") ?? ""));
  const ageRaw = Number(formData.get("age") || NaN);
  const age = Number.isInteger(ageRaw) && ageRaw >= 0 && ageRaw <= 120 ? ageRaw : null;

  if (!name) return { ok: false, error: usesFullName(type) ? "Escribe quién invita" : "Escribe el nombre del festejado" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Indica fecha y hora" };

  const { nameLines, slugBase } = nameParts(name, type);

  // En los religiosos la hora escrita es la de la ceremonia; la recepción va después
  const demo = DEMO_INVITATIONS[type];
  const startsAt = zonedToUtc(date, time, timezone);
  const religious = demo.ceremony.enabled;
  const eventAt = religious ? new Date(startsAt.getTime() + RECEPTION_AFTER_HOURS * 36e5) : startsAt;

  let id: string | null = null;
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        ...demo,
        ceremony: religious ? { ...demo.ceremony, time } : demo.ceremony,
        age: hasAge(type) ? age : null,
        age_text: ageRibbon(hasAge(type) ? age : null, type),
        slug: invitationSlug(slugBase),
        name_lines: nameLines,
        event_at: eventAt.toISOString(),
        timezone,
        theme_id: themeId,
      })
      .select("id")
      .single();
    if (error && error.code !== UNIQUE_VIOLATION) return { ok: false, error: error.message };
    id = data?.id ?? null;
  }
  if (!id) return { ok: false, error: "No se pudo generar un enlace único, intenta de nuevo" };

  redirect(`/admin/invitaciones/${id}`);
}

export async function saveInvitation(id: string, input: InvitationInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = invitationInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { date, time, ...fields } = parsed.data;

  if (fields.published) {
    const blocked = await publishBlock(supabase, id, fields);
    if (blocked) return { ok: false, error: blocked };
  }

  const [mapsDestination, ceremonyDestination] = await Promise.all([
    resolveMapsDestination(fields.maps_url),
    resolveMapsDestination(fields.ceremony.maps_url),
  ]);

  const { data, error } = await supabase
    .from("invitations")
    .update({
      ...fields,
      // Publicar también reactiva: solo hay «publicada» o «inactiva»
      ...(fields.published ? { is_active: true } : {}),
      event_at: zonedToUtc(date, time, fields.timezone).toISOString(),
      maps_destination: mapsDestination,
      ceremony: { ...fields.ceremony, destination: ceremonyDestination },
    })
    .eq("id", id)
    .eq("is_deleted", false)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };

  updateTag(invitationTag(data.slug));
  return { ok: true, message: fields.published ? "Guardado y publicado" : "Guardado (inactiva)" };
}

export async function duplicateInvitation(id: string) {
  const { supabase } = await requireAdmin();

  const { data: source, error } = await supabase.from("invitations").select("*").eq("id", id).single();
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, slug: _slug, created_at, updated_at, is_deleted, deleted_at, ...rest } = source;
  let newId: string | null = null;
  for (let attempt = 0; attempt < 3 && !newId; attempt++) {
    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({ ...rest, slug: invitationSlug(source.name_lines[0] ?? ""), published: false, is_active: true })
      .select("id")
      .single();
    if (insertError && insertError.code !== UNIQUE_VIOLATION) throw insertError;
    newId = data?.id ?? null;
  }
  if (!newId) throw new Error("No se pudo generar un enlace único");

  redirect(`/admin/invitaciones/${newId}`);
}

/** Borrado lógico: sale del panel y el enlace deja de funcionar; el registro se conserva. */
export async function deleteInvitation(id: string) {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("invitations")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) throw error;

  updateTag(invitationTag(data.slug));
  redirect("/admin");
}

/**
 * Publicada (el enlace funciona) o inactiva (lleva a la página principal).
 * Es el único estado que maneja el panel: publicar también reactiva las que
 * se habían desactivado antes de existir esta opción.
 */
export async function setInvitationPublished(id: string, published: boolean) {
  const { supabase } = await requireAdmin();

  // El panel ya deshabilita el interruptor; esto es por si acaso
  if (published) {
    const blocked = await publishBlock(supabase, id);
    if (blocked) throw new Error(blocked);
  }

  const { data, error } = await supabase
    .from("invitations")
    .update({ published, is_active: true })
    .eq("id", id)
    .eq("is_deleted", false)
    .select("slug")
    .single();
  if (error) throw error;

  updateTag(invitationTag(data.slug));
  refresh();
}

/* ---------------- Solicitudes ---------------- */

const DAY_MS = 864e5;
const REQUEST_TIMEZONE = "America/Merida";
const NAME_LINE_MAX = 24;

/** 192 bits al azar: es lo único que protege el formulario del cliente */
const newToken = () => randomBytes(24).toString("base64url");
const expiresIn = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString();
const validDays = (days: number) => (Number.isInteger(days) && days >= 1 && days <= 60 ? days : DEFAULT_REQUEST_DAYS);

/** El panel genera el enlace con el cliente y el tipo de evento ya fijos. */
export async function createRequest(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = requestInput.safeParse({
    client_name: formData.get("client_name") ?? "",
    client_phone: formData.get("client_phone") ?? "",
    event_type: formData.get("event_type") ?? "",
    days: formData.get("days") ?? DEFAULT_REQUEST_DAYS,
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const { days, ...fields } = parsed.data;

  const { data, error } = await supabase
    .from("invitation_requests")
    .insert({ ...fields, token: newToken(), expires_at: expiresIn(days) })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  redirect(`/admin/solicitudes/${data.id}`);
}

/**
 * Enlace nuevo con otra vigencia: el anterior deja de servir. Sirve para las
 * vencidas y para las rechazadas (el cliente ve lo que ya había llenado).
 */
export async function renewRequest(id: string, days: number) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("invitation_requests")
    .update({ token: newToken(), status: "pendiente", expires_at: expiresIn(validDays(days)), reviewed_at: null })
    .eq("id", id)
    .in("status", ["pendiente", "rechazada"]);
  if (error) throw error;

  refresh();
}

export async function rejectRequest(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("invitation_requests")
    .update({ status: "rechazada", reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["pendiente", "recibida"]);
  if (error) throw error;

  refresh();
}

/** Las aprobadas no se borran: ya tienen invitación. */
export async function deleteRequest(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("invitation_requests").delete().eq("id", id).neq("status", "aprobada");
  if (error) throw error;

  redirect("/admin/solicitudes");
}

/** Renglones de hasta 24 letras (lo que acepta el editor), máximo 3. */
function wrapName(lines: string[]) {
  if (lines.every((l) => l.length <= NAME_LINE_MAX)) return lines;
  const out: string[] = [];
  for (const word of lines.join(" ").split(" ")) {
    const last = out.at(-1);
    if (last !== undefined && `${last} ${word}`.length <= NAME_LINE_MAX) out[out.length - 1] = `${last} ${word}`;
    else out.push(word.slice(0, NAME_LINE_MAX));
  }
  return out.slice(0, 3);
}

/** Invitación sin publicar con lo que llenó el cliente; lo demás, del ejemplo de su tipo de evento. */
function invitationFromRequest(type: EventType, d: RequestData) {
  const demo = DEMO_INVITATIONS[type];
  const religious = isReligious(type);
  const age = hasAge(type) ? d.age : null;
  const { nameLines, slugBase } = nameParts(d.name, type);

  return {
    slugBase,
    row: {
      ...demo,
      published: false,
      name_lines: wrapName(nameLines),
      age,
      age_text: ageRibbon(age, type),
      photo_url: d.photo_url,
      // En los religiosos es la hora de la recepción; la de la ceremonia va aparte
      event_at: zonedToUtc(d.date, d.time, REQUEST_TIMEZONE).toISOString(),
      timezone: REQUEST_TIMEZONE,
      venue_name: d.venue_name,
      address: d.address,
      area: null,
      message: d.message ?? demo.message,
      whatsapp: d.whatsapp,
      rsvp_ask_people: d.rsvp_ask_people,
      family: religious ? { parents: d.parents, godparents: d.godparents } : demo.family,
      // Lo que eligió el cliente (sin extras, la sección no se muestra)
      extras: d.extras.map((x) => ({ ...x, note: "" })),
      gallery: d.gallery.map((url) => ({ url })),
      ceremony:
        religious && d.ceremony.enabled
          ? { enabled: true, time: d.ceremony.time, place: d.ceremony.place, address: d.ceremony.address, maps_url: null }
          : { enabled: false },
    },
  };
}

/**
 * Aprobar crea la invitación (sin publicar) para terminarla en el editor: el
 * mapa, el show, los extras… Solo las aprobadas se pueden publicar.
 */
export async function approveRequest(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: req, error } = await supabase
    .from("invitation_requests")
    .select("id, event_type, status, data")
    .eq("id", id)
    .single();
  if (error) return { ok: false, error: error.message };
  if (req.status !== "recibida") return { ok: false, error: "Solo se aprueban las solicitudes que ya tienen datos del cliente" };

  const parsed = requestData.safeParse(req.data);
  if (!parsed.success) return { ok: false, error: `Los datos del cliente no son válidos: ${firstError(parsed.error)}` };
  const d = parsed.data;
  const type = eventType(req.event_type);

  // Foto solo si es de su carpeta; personaje solo si sigue existiendo
  const prefix = requestPhotoPrefix(id);
  if (d.photo_url && !d.photo_url.startsWith(prefix)) d.photo_url = null;
  d.gallery = d.gallery.filter((url) => url.startsWith(prefix));
  if (d.theme_id) {
    const { data: theme } = await supabase.from("themes").select("id").eq("id", d.theme_id).eq("is_deleted", false).maybeSingle();
    d.theme_id = theme?.id ?? null;
  }

  const { row, slugBase } = invitationFromRequest(type, d);
  let invitationId: string | null = null;
  for (let attempt = 0; attempt < 3 && !invitationId; attempt++) {
    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({ ...row, theme_id: d.theme_id, slug: invitationSlug(slugBase) })
      .select("id")
      .single();
    if (insertError && insertError.code !== UNIQUE_VIOLATION) return { ok: false, error: insertError.message };
    invitationId = data?.id ?? null;
  }
  if (!invitationId) return { ok: false, error: "No se pudo generar un enlace único, intenta de nuevo" };

  const { data: updated, error: updateError } = await supabase
    .from("invitation_requests")
    .update({ status: "aprobada", invitation_id: invitationId, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "recibida")
    .select("id");
  if (updateError || !updated.length) {
    // Otro admin la cambió al mismo tiempo: no se deja una invitación huérfana
    await supabase.from("invitations").delete().eq("id", invitationId);
    return { ok: false, error: updateError?.message ?? "La solicitud cambió mientras tanto; recarga la página" };
  }

  refresh();
  return { ok: true, message: "Aprobada: ya puedes terminarla en el editor y publicarla" };
}

/** Publicar desde la solicitud: solo si ya está aprobada y no le falta nada. */
export async function publishRequest(id: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const { data: req, error } = await supabase
    .from("invitation_requests")
    .select("status, data, invitation:invitations(id, maps_url, theme_id, ceremony, is_deleted)")
    .eq("id", id)
    .single<{
      status: string;
      data: { custom_theme?: string | null } | null;
      invitation: { id: string; maps_url: string | null; theme_id: string | null; ceremony: { enabled?: boolean; maps_url?: string | null } | null; is_deleted: boolean } | null;
    }>();
  if (error) return { ok: false, error: error.message };
  const inv = req.invitation;
  if (req.status !== "aprobada" || !inv || inv.is_deleted) return { ok: false, error: "Primero aprueba la solicitud" };

  const missing = missingForPublish(inv, req.data?.custom_theme);
  if (missing.length) return { ok: false, error: `Falta: ${missing.join("; ").toLowerCase()}` };

  await setInvitationPublished(inv.id, true);
  return { ok: true };
}

/**
 * El cliente pidió un personaje que no tenemos: crea el tema con ese nombre y
 * su tipo de evento y abre el editor del tema para armarlo.
 */
export async function createThemeFromRequest(id: string) {
  const { supabase } = await requireAdmin();

  const { data: req, error } = await supabase.from("invitation_requests").select("event_type, data").eq("id", id).single();
  if (error) throw error;
  const name = String((req.data as { custom_theme?: unknown } | null)?.custom_theme ?? "").trim().slice(0, 80) || "Nuevo tema";

  const { data, error: insertError } = await supabase
    .from("themes")
    .insert({
      name,
      slug: `${slugify(name) || "nuevo-tema"}-${randomHash()}`,
      event_type: eventType(req.event_type),
      colors: DEFAULT_COLORS,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  updateTag(themesTag);
  redirect(`/admin/temas/${data.id}`);
}

/* ---------------- Giveaways ---------------- */

/** Días que tiene un ganador para llenar sus datos */
const WINNER_DAYS = 15;

export async function createGiveaway(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = giveawayInput.safeParse({
    name: formData.get("name") ?? "",
    winners: formData.get("winners") ?? 10,
    announce_on: formData.get("announce_on") ?? "",
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const g = parsed.data;

  // El registro cierra al empezar el día del anuncio (hora de Mérida)
  const closesAt = zonedToUtc(g.announce_on, "00:00", REQUEST_TIMEZONE);
  if (closesAt.getTime() <= Date.now()) return { ok: false, error: "La fecha del anuncio tiene que ser futura" };

  const { data, error } = await supabase
    .from("giveaways")
    .insert({ ...g, token: randomHash(10), closes_at: closesAt.toISOString(), message: DEFAULT_GIVEAWAY_MESSAGE })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  redirect(`/admin/solicitudes/sorteo/${data.id}`);
}

export async function saveGiveawayMessage(id: string, message: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const text = String(message ?? "").slice(0, 2000);
  const { error } = await supabase.from("giveaways").update({ message: text }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Mensaje guardado" };
}

/** Cerrar (o reabrir) el registro antes de la fecha */
export async function setGiveawayActive(id: string, active: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("giveaways").update({ is_active: active }).eq("id", id);
  if (error) throw error;
  refresh();
}

/**
 * Ganador: se le genera una solicitud con su tipo de evento y lo que eligió al
 * registrarse ya puesto, para mandarle el enlace y que llene los datos.
 */
async function makeWinner(supabase: Awaited<ReturnType<typeof createClient>>, entryId: string): Promise<ActionResult> {
  const { data: entry, error } = await supabase
    .from("giveaway_entries")
    .select("id, name, phone, event_type, theme_id, custom_theme, event_date, status")
    .eq("id", entryId)
    .single();
  if (error) return { ok: false, error: error.message };
  if (entry.status !== "participando") return { ok: false, error: "Solo puede ganar quien sigue participando" };

  const { data: req, error: reqError } = await supabase
    .from("invitation_requests")
    .insert({
      token: newToken(),
      event_type: entry.event_type,
      client_name: entry.name,
      client_phone: entry.phone,
      expires_at: expiresIn(WINNER_DAYS),
      preset: { theme_id: entry.theme_id, custom_theme: entry.custom_theme, date: entry.event_date },
    })
    .select("id")
    .single();
  if (reqError) return { ok: false, error: reqError.message };

  const { data: updated, error: updateError } = await supabase
    .from("giveaway_entries")
    .update({ status: "ganador", request_id: req.id })
    .eq("id", entryId)
    .eq("status", "participando")
    .select("id");
  if (updateError || !updated.length) {
    await supabase.from("invitation_requests").delete().eq("id", req.id);
    return { ok: false, error: updateError?.message ?? "Cambió mientras tanto; recarga la página" };
  }
  return { ok: true, message: `¡${entry.name} ganó! Ya puedes mandarle su enlace.` };
}

export async function pickWinner(entryId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const result = await makeWinner(supabase, entryId);
  refresh();
  return result;
}

/** Sorteo: uno al azar entre quienes siguen participando (los descartados no entran). */
export async function drawWinner(giveawayId: string): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("giveaway_entries")
    .select("id")
    .eq("giveaway_id", giveawayId)
    .eq("status", "participando");
  if (error) return { ok: false, error: error.message };
  if (!data.length) return { ok: false, error: "No queda nadie participando" };

  const result = await makeWinner(supabase, data[randomInt(data.length)].id);
  refresh();
  return result;
}

/** Descartar a quien no cumplió los requisitos (o regresarlo al sorteo). */
export async function setEntryDiscarded(entryId: string, discarded: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("giveaway_entries")
    .update({ status: discarded ? "descartado" : "participando" })
    .eq("id", entryId)
    .neq("status", "ganador");
  if (error) throw error;
  refresh();
}

/* ---------------- Temas ---------------- */

export async function createTheme() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("themes")
    // La dirección de la demo se cambia en el editor; esta no choca con otra
    .insert({ name: "Nuevo tema", slug: `nuevo-tema-${randomHash()}`, colors: DEFAULT_COLORS })
    .select("id")
    .single();
  if (error) throw error;

  redirect(`/admin/temas/${data.id}`);
}

export async function saveTheme(id: string, input: ThemeInput): Promise<ActionResult> {
  const { supabase } = await requireAdmin();

  const parsed = themeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { error } = await supabase.from("themes").update(parsed.data).eq("id", id);
  if (error?.code === "23505") return { ok: false, error: `La dirección /demo/${parsed.data.slug} ya la usa otro tema` };
  if (error) return { ok: false, error: error.message };

  // Refresca todas las invitaciones que usan este tema
  updateTag(themeTag(id));
  updateTag(themesTag);
  return { ok: true, message: "Tema guardado" };
}

/** Destacado: aparece en la landing antes de «Ver todos». */
export async function setThemeFeatured(id: string, featured: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("themes").update({ featured }).eq("id", id).eq("is_deleted", false);
  if (error) throw error;

  updateTag(themeTag(id));
  updateTag(themesTag);
  refresh();
}

/** Desactivar: deja de ofrecerse para invitaciones nuevas y en la landing; las que ya lo usan lo conservan. */
export async function setThemeActive(id: string, active: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("themes").update({ is_active: active }).eq("id", id).eq("is_deleted", false);
  if (error) throw error;

  updateTag(themeTag(id));
  updateTag(themesTag);
  refresh();
}

/** Borrado lógico: el tema sale del panel, pero las invitaciones que ya lo usan lo conservan. */
export async function deleteTheme(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("themes")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;

  updateTag(themeTag(id));
  updateTag(themesTag);
  redirect("/admin/temas");
}
