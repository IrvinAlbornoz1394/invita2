import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Invitation } from "@/lib/types";
import { InvitationEditor, type ThemeOption } from "./InvitationEditor";
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
    .select("id, name, colors, show_url, show_style, show, event_type, intro, effects")
    .or(`and(is_active.eq.true,is_deleted.eq.false)${keep}`)
    .order("name")
    .returns<ThemeOption[]>();
  if (themes.error) throw themes.error;

  // Si salió de una solicitud, solo se publica cuando no le falte nada
  const req = await supabase.from("invitation_requests").select("id, data").eq("invitation_id", id).maybeSingle();
  if (req.error) throw req.error;
  const fromRequest = req.data
    ? { id: req.data.id as string, customTheme: (req.data.data as { custom_theme?: string | null } | null)?.custom_theme ?? null }
    : null;

  return <InvitationEditor invitation={inv.data} themes={themes.data} fromRequest={fromRequest} />;
}
