import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";

/**
 * Comprueba que haya sesión y que el usuario esté en la tabla de admins.
 * Úsalo al inicio de cada página y Server Action del panel.
 */
export async function requireAdmin() {
  // La sesión se valida contra la hora actual: nunca se prerenderiza
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/admin/login");

  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!admin) redirect("/admin/login?e=sin-acceso");

  return { supabase, userId, email: (data.claims.email as string | undefined) ?? "" };
}
