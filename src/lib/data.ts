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
