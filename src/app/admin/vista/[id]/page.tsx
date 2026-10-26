import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { INVITATION_SELECT } from "@/lib/data";
import { buildView } from "@/lib/view";
import type { InvitationWithTheme } from "@/lib/types";
import { Invitation } from "@/components/invitation/Invitation";
import { InvitationLoading } from "@/components/invitation/Loading";

export const metadata: Metadata = { title: "Vista previa", robots: { index: false } };

/** Vista previa para el admin: muestra también borradores, sin caché. */
export default function PreviewPage({ params }: PageProps<"/admin/vista/[id]">) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: Pick<PageProps<"/admin/vista/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("invitations").select(INVITATION_SELECT).eq("id", id).maybeSingle<InvitationWithTheme>();
  if (!data) notFound();

  return <Invitation view={buildView(data)} preview />;
}
