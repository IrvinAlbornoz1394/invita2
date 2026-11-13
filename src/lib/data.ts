import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { eventType, isReligious } from "./defaults";
import { createPublicClient } from "./supabase/public";
import type { InvitationWithTheme } from "./types";

export const INVITATION_SELECT = "*, theme:themes(*)";

export const invitationTag = (slug: string) => `inv:${slug}`;
export const themeTag = (id: string) => `theme:${id}`;

/**
 * Invitación publicada, activa y no borrada, cacheada hasta que el panel la
 * cambie (updateTag). Devuelve null en cualquier otro caso.
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
    .eq("is_active", true)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) throw error;
  if (data?.theme_id) cacheTag(themeTag(data.theme_id));
  return data as InvitationWithTheme | null;
}

export const themesTag = "themes";

export type LandingTheme = {
  id: string;
  /** Dirección corta de la demo */
  slug: string;
  name: string;
  logoUrl: string | null;
  cardUrl: string | null;
  groupUrl: string | null;
  featured: boolean;
  /** Bautizo y comunión: no entran a «Personajes», tienen su mención aparte */
  religious: boolean;
};

/** Cuántos personajes muestra la landing si no hay ninguno destacado. */
export const LANDING_THEMES_FALLBACK = 6;

/** Los que la landing muestra antes de «Ver todos»: los destacados o, si no hay, los primeros. */
export function landingPicks(characters: LandingTheme[]) {
  const featured = characters.filter((t) => t.featured);
  return featured.length ? featured : characters.slice(0, LANDING_THEMES_FALLBACK);
}

/** Temas con imagen, para la landing (logos y tarjetas de personajes). */
export async function getLandingThemes(): Promise<LandingTheme[]> {
  "use cache";
  cacheLife("days");
  cacheTag(themesTag);

  const { data, error } = await createPublicClient()
    .from("themes")
    .select("id, slug, name, logo_url, card_url, group_url, featured, event_type")
    .or("logo_url.not.is.null,card_url.not.is.null")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("created_at");

  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    logoUrl: t.logo_url,
    cardUrl: t.card_url,
    groupUrl: t.group_url,
    featured: t.featured,
    religious: isReligious(eventType(t.event_type)),
  }));
}
