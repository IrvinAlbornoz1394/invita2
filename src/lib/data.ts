import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import type { InvitationWithTheme } from "./types";

export const INVITATION_SELECT = "*, theme:themes(*)";

export const invitationTag = (slug: string) => `inv:${slug}`;
export const themeTag = (id: string) => `theme:${id}`;

/**
 * Invitación publicada, cacheada hasta que el panel la cambie (updateTag).
 * Devuelve null si no existe o no está publicada.
 */
export async function getPublishedInvitation(slug: string): Promise<InvitationWithTheme | null> {
  "use cache";
  cacheLife("days");
  cacheTag(invitationTag(slug));

  const { data, error } = await createPublicClient()
    .from("invitations")
    .select(INVITATION_SELECT)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) throw error;
  if (data?.theme_id) cacheTag(themeTag(data.theme_id));
  return data as InvitationWithTheme | null;
}

export const themesTag = "themes";

export type LandingTheme = { id: string; name: string; logoUrl: string | null; cardUrl: string | null; groupUrl: string | null };

/** Temas con imagen, para la landing (logos y tarjetas de personajes). */
export async function getLandingThemes(): Promise<LandingTheme[]> {
  "use cache";
  cacheLife("days");
  cacheTag(themesTag);

  const { data, error } = await createPublicClient()
    .from("themes")
    .select("id, name, logo_url, card_url, group_url")
    .or("logo_url.not.is.null,card_url.not.is.null")
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    logoUrl: t.logo_url,
    cardUrl: t.card_url,
    groupUrl: t.group_url,
  }));
}
