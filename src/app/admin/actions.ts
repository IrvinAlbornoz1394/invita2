"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { invitationTag, themeTag } from "@/lib/data";
import { zonedToUtc } from "@/lib/dates";
import { ageRibbon, DEFAULT_COLORS, DEMO_INVITATION } from "@/lib/defaults";
import { firstError, invitationInput, themeInput, type InvitationInput, type ThemeInput } from "@/lib/schema";
import { invitationSlug } from "@/lib/slug";

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
  const ageRaw = Number(formData.get("age") || NaN);
  const age = Number.isInteger(ageRaw) && ageRaw >= 0 && ageRaw <= 120 ? ageRaw : null;

  if (!name) return { ok: false, error: "Escribe el nombre del festejado" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, error: "Indica fecha y hora" };

  // El nombre completo va en renglones: "Lucero Jeamileth" → ["Lucero", "Jeamileth"]
  const words = name.split(/\s+/);
  const nameLines = words.length <= 3 ? words : [words.slice(0, -1).join(" "), words.at(-1)!];

  let id: string | null = null;
  for (let attempt = 0; attempt < 3 && !id; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({
        ...DEMO_INVITATION,
        age,
        age_text: ageRibbon(age),
        slug: invitationSlug(words[0]),
        name_lines: nameLines,
        event_at: zonedToUtc(date, time, timezone).toISOString(),
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

  const { data, error } = await supabase
    .from("invitations")
    .update({ ...fields, event_at: zonedToUtc(date, time, fields.timezone).toISOString() })
    .eq("id", id)
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
  const { id: _id, slug: _slug, created_at, updated_at, ...rest } = source;
  let newId: string | null = null;
  for (let attempt = 0; attempt < 3 && !newId; attempt++) {
    const { data, error: insertError } = await supabase
      .from("invitations")
      .insert({ ...rest, slug: invitationSlug(source.name_lines[0] ?? ""), published: false })
      .select("id")
      .single();
    if (insertError && insertError.code !== UNIQUE_VIOLATION) throw insertError;
    newId = data?.id ?? null;
  }
  if (!newId) throw new Error("No se pudo generar un enlace único");

  redirect(`/admin/invitaciones/${newId}`);
}

export async function deleteInvitation(id: string) {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase.from("invitations").delete().eq("id", id).select("slug").single();
  if (error) throw error;

  updateTag(invitationTag(data.slug));
  redirect("/admin");
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
  return { ok: true, message: "Tema guardado" };
}

export async function deleteTheme(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("themes").delete().eq("id", id);
  if (error) throw error;

  updateTag(themeTag(id));
  redirect("/admin/temas");
}
