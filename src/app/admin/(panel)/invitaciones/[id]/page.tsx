import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Invitation, Theme } from "@/lib/types";
import { InvitationEditor } from "./InvitationEditor";
import styles from "../../../admin.module.css";

export const metadata: Metadata = { title: "Editar invitación" };

export default function EditInvitationPage({ params }: PageProps<"/admin/invitaciones/[id]">) {
  return (
    <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/invitaciones/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const inv = await supabase.from("invitations").select("*").eq("id", id).eq("is_deleted", false).maybeSingle<Invitation>();
  if (inv.error) throw inv.error;
  if (!inv.data) notFound();

  // Temas activos y no borrados, más el que ya usa la invitación aunque esté desactivado o borrado
  const keep = inv.data.theme_id ? `,id.eq.${inv.data.theme_id}` : "";
  const themes = await supabase
    .from("themes")
    .select("id, name, colors, show_url, show_style, show, event_type")
    .or(`and(is_active.eq.true,is_deleted.eq.false)${keep}`)
    .order("name")
    .returns<Pick<Theme, "id" | "name" | "colors" | "show_url" | "show_style" | "show" | "event_type">[]>();
  if (themes.error) throw themes.error;

  return <InvitationEditor invitation={inv.data} themes={themes.data} />;
}
