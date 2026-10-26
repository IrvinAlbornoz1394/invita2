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

  const [inv, themes] = await Promise.all([
    supabase.from("invitations").select("*").eq("id", id).maybeSingle<Invitation>(),
    supabase.from("themes").select("id, name, colors").order("name").returns<Pick<Theme, "id" | "name" | "colors">[]>(),
  ]);
  if (inv.error) throw inv.error;
  if (themes.error) throw themes.error;
  if (!inv.data) notFound();

  return <InvitationEditor invitation={inv.data} themes={themes.data} />;
}
