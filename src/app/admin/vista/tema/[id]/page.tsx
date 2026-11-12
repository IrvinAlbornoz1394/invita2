import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { demoEventAt, demoInvitation } from "@/lib/demo";
import { buildView } from "@/lib/view";
import type { Theme } from "@/lib/types";
import { Invitation } from "@/components/invitation/Invitation";
import { InvitationLoading } from "@/components/invitation/Loading";

export const metadata: Metadata = { title: "Demo del tema", robots: { index: false } };

/**
 * Demo de un tema para el admin: los mismos datos de ejemplo que la demo
 * pública, pero también para temas desactivados y sin caché, para revisar
 * los cambios recién guardados.
 */
export default function ThemeDemoPage({ params }: PageProps<"/admin/vista/tema/[id]">) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <ThemeDemo params={params} />
    </Suspense>
  );
}

async function ThemeDemo({ params }: Pick<PageProps<"/admin/vista/tema/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: theme }, eventAt] = await Promise.all([
    supabase.from("themes").select("*").eq("id", id).eq("is_deleted", false).maybeSingle<Theme>(),
    demoEventAt(),
  ]);
  if (!theme) notFound();

  return <Invitation view={buildView(demoInvitation(theme, eventAt))} preview />;
}
