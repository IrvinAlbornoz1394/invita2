"use server";

import { eventType, hasAge, isReligious } from "@/lib/defaults";
import { requestData, validToken, type RequestDataInput } from "@/lib/requests";
import { requestPhotoPrefix } from "@/lib/request-photos";
import { firstError } from "@/lib/schema";
import { createPublicClient } from "@/lib/supabase/public";

export type SubmitResult = { ok: true } | { ok: false; error: string; closed?: boolean };

const CLOSED = "Este enlace ya no está activo. Pídenos uno nuevo por WhatsApp.";

/**
 * Lo que manda el cliente. No hay sesión: el token es la llave, y la base solo
 * lo acepta si la solicitud sigue pendiente y sin vencer (después ya no cambia).
 */
export async function submitRequest(token: string, input: RequestDataInput): Promise<SubmitResult> {
  if (!validToken(token)) return { ok: false, error: CLOSED, closed: true };

  const parsed = requestData.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const supabase = createPublicClient();
  const { data: req, error } = await supabase
    .rpc("request_by_token", { p_token: token })
    .maybeSingle<{ id: string; event_type: string; state: string }>();
  if (error) return { ok: false, error: "No pudimos guardar tus datos, intenta de nuevo" };
  if (!req || req.state !== "pendiente") return { ok: false, error: CLOSED, closed: true };

  // Solo lo que corresponde a su tipo de evento (el tipo lo fija la solicitud)
  const type = eventType(req.event_type);
  const d = parsed.data;
  if (!hasAge(type)) d.age = null;
  // En cumpleaños la edad que cumple es obligatoria (va en la cinta: «¡Cumplo 5!»)
  else if (d.age === null || d.age < 1) return { ok: false, error: "Indica cuántos años cumple" };
  if (!isReligious(type)) {
    d.ceremony = { enabled: false, time: null, place: null, address: null, maps_url: null };
    d.parents = [];
    d.godparents = [];
  }
  // Fotos solo de la carpeta de su solicitud
  const prefix = requestPhotoPrefix(req.id);
  if (d.photo_url && !d.photo_url.startsWith(prefix)) d.photo_url = null;
  d.gallery = [...new Set(d.gallery)].filter((url) => url.startsWith(prefix));
  if (d.theme_id) {
    const { data: theme } = await supabase
      .from("themes")
      .select("id")
      .eq("id", d.theme_id)
      .or(`event_type.eq.${type},event_type.is.null`)
      .eq("is_active", true)
      .eq("is_deleted", false)
      .maybeSingle();
    if (!theme) d.theme_id = null;
  }
  // Uno u otro: el de la lista o el que escribió
  if (d.theme_id) d.custom_theme = null;

  const { data: saved, error: saveError } = await supabase.rpc("submit_request", { p_token: token, p_data: d });
  if (saveError) return { ok: false, error: "No pudimos guardar tus datos, intenta de nuevo" };
  if (!saved) return { ok: false, error: CLOSED, closed: true };

  return { ok: true };
}
