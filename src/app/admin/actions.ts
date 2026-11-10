"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invitationTag, themeTag, themesTag } from "@/lib/data";
import { zonedToUtc } from "@/lib/dates";
import { ageRibbon, DEFAULT_COLORS, DEMO_INVITATIONS, eventType, RECEPTION_AFTER_HOURS } from "@/lib/defaults";
import { firstError, invitationInput, themeInput, type InvitationInput, type ThemeInput } from "@/lib/schema";
import { invitationSlug } from "@/lib/slug";
import { resolveMapsDestination } from "@/lib/maps";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const UNIQUE_VIOLATION = "23505";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

/* ---------------- Invitaciones ---------------- */

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

  if (!name) return { ok: false, error: "Escribe el nombre del festejado" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Indica fecha y hora" };

  // El nombre completo va en renglones: "Lucero Jeamileth" → ["Lucero", "Jeamileth"]
  const words = name.split(/\s+/);
  const nameLines = words.length <= 3 ? words : [words.slice(0, -1).join(" "), words.at(-1)!];

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
        age: religious ? null : age,
        age_text: ageRibbon(religious ? null : age, type),
        slug: invitationSlug(words[0]),
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

  const [mapsDestination, ceremonyDestination] = await Promise.all([
    resolveMapsDestination(fields.maps_url),
    resolveMapsDestination(fields.ceremony.maps_url),
  ]);

  const { data, error } = await supabase
    .from("invitations")
    .update({
      ...fields,
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
  return { ok: true, message: fields.published ? "Guardado y publicado" : "Guardado como borrador" };
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

/** Activa o desactiva el enlace público sin tocar el resto de la invitación. */
export async function setInvitationActive(id: string, active: boolean) {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("invitations")
    .update({ is_active: active })
    .eq("id", id)
    .eq("is_deleted", false)
    .select("slug")
    .single();
  if (error) throw error;

  updateTag(invitationTag(data.slug));
  refresh();
}

/* ---------------- Temas ---------------- */

export async function createTheme() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("themes")
    .insert({ name: "Nuevo tema", colors: DEFAULT_COLORS })
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
  if (error) return { ok: false, error: error.message };

  // Refresca todas las invitaciones que usan este tema
  updateTag(themeTag(id));
  updateTag(themesTag);
  return { ok: true, message: "Tema guardado" };
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
