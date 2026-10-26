import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { NewInvitationForm } from "./NewInvitationForm";
import styles from "../../../admin.module.css";

export const metadata: Metadata = { title: "Nueva invitación" };

export default function NewInvitationPage() {
  return (
    <div style={{ maxWidth: 560 }}>
      <Link className={styles.back} href="/admin">
        ← Invitaciones
      </Link>
      <h1 className={styles.pageTitle}>Nueva invitación</h1>
      <p className={styles.pageSub}>Con esto se genera el enlace. Lo demás ya viene con datos de ejemplo para que solo los ajustes en el editor.</p>
      <div className={styles.card} style={{ marginTop: 20 }}>
        <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
          <FormWithThemes />
        </Suspense>
      </div>
    </div>
  );
}

async function FormWithThemes() {
  const { supabase } = await requireAdmin();
  const { data: themes, error } = await supabase.from("themes").select("id, name").order("name");
  if (error) throw error;
  return <NewInvitationForm themes={themes} />;
}
