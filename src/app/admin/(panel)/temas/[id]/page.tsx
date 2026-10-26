import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Theme } from "@/lib/types";
import { ThemeEditor } from "./ThemeEditor";
import styles from "../../../admin.module.css";

export const metadata: Metadata = { title: "Editar tema" };

export default function EditThemePage({ params }: PageProps<"/admin/temas/[id]">) {
  return (
    <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/temas/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [theme, uses] = await Promise.all([
    supabase.from("themes").select("*").eq("id", id).maybeSingle<Theme>(),
    supabase.from("invitations").select("id", { count: "exact", head: true }).eq("theme_id", id),
  ]);
  if (theme.error) throw theme.error;
  if (!theme.data) notFound();

  return <ThemeEditor theme={theme.data} uses={uses.count ?? 0} />;
}
