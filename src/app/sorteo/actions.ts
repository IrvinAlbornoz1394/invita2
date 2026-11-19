"use server";

import { entryInput, type EntryInput } from "@/lib/giveaways";
import { firstError } from "@/lib/schema";
import { createPublicClient } from "@/lib/supabase/public";

export type EntryResult = { ok: true } | { ok: false; error: string; closed?: boolean; duplicate?: boolean };

/** Registro al giveaway: sin sesión; la base solo lo acepta si sigue abierto y una vez por WhatsApp. */
export async function enterGiveaway(token: string, input: EntryInput): Promise<EntryResult> {
  if (typeof token !== "string" || !/^[a-z0-9]{8,32}$/.test(token)) return { ok: false, error: "Este enlace no es válido", closed: true };

  const parsed = entryInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const e = parsed.data;

  const supabase = createPublicClient();
  // El personaje tiene que ser de los activos para su tipo de evento; si no, se queda lo que escribió
  if (e.theme_id) {
    const { data: theme } = await supabase
      .from("themes")
      .select("id")
      .eq("id", e.theme_id)
      .or(`event_type.eq.${e.event_type},event_type.is.null`)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .maybeSingle();
    if (!theme) e.theme_id = null;
  }
  if (e.theme_id) e.custom_theme = null;
  if (!e.theme_id && !e.custom_theme) return { ok: false, error: "Elige un personaje o escribe cuál quieres" };

  const { data, error } = await supabase.rpc("enter_giveaway", { p_token: token, p_entry: e });
  if (error) return { ok: false, error: "No pudimos registrarte, intenta de nuevo" };
  if (data === "cerrado") return { ok: false, error: "El registro ya cerró. ¡Gracias por tu interés!", closed: true };
  if (data === "duplicado") return { ok: false, error: "Ese WhatsApp ya está participando. ¡Mucha suerte!", duplicate: true };
  return { ok: true };
}
