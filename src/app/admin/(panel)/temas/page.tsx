import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import type { Theme } from "@/lib/types";
import { createTheme } from "../../actions";
import styles from "../../admin.module.css";

export const metadata: Metadata = { title: "Temas" };

export default function ThemesPage() {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Temas</h1>
          <p className={styles.pageSub}>Cada tema es un set de personajes: colores, tipografía, ilustraciones y música.</p>
        </div>
        <form action={createTheme}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>+ Nuevo tema</button>
        </form>
      </div>
      <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
        <ThemesList />
      </Suspense>
    </>
  );
}

async function ThemesList() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("themes")
    .select("id, name, colors, card_url, logo_url, group_url, invitations(count)")
    .order("name")
    .returns<(Pick<Theme, "id" | "name" | "colors" | "card_url" | "logo_url" | "group_url"> & { invitations: { count: number }[] })[]>();
  if (error) throw error;

  if (!data.length) return <div className={styles.empty}>Todavía no hay temas.</div>;

  return (
    <div className={styles.themes}>
      {data.map((t) => {
        const cover = t.card_url || t.group_url || t.logo_url;
        const uses = t.invitations[0]?.count ?? 0;
        return (
          <Link key={t.id} className={styles.themeCard} href={`/admin/temas/${t.id}`}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.themeCover} src={cover} alt="" />
            ) : (
              <div className={styles.themeCover} style={{ background: t.colors.accent }} />
            )}
            <div className={styles.themeBody}>
              <strong>{t.name}</strong>
              <div className={styles.help}>
                {uses === 1 ? "1 invitación" : `${uses} invitaciones`}
              </div>
              <div className={styles.swatches}>
                {Object.values(t.colors).map((c, i) => (
                  <span key={i} className={styles.swatch} style={{ background: c }} />
                ))}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
