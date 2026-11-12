import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { EVENT_TYPES, eventType, isReligious } from "@/lib/defaults";
import type { Theme } from "@/lib/types";
import { createTheme } from "../../actions";
import { ThemeActions } from "../../ThemeActions";
import { FeaturedSwitch } from "../../FeaturedSwitch";
import { AdminIcon } from "../../AdminIcon";
import { FilterableList, type FilterSelect, type FilterTag } from "../../FilterableList";
import styles from "../../admin.module.css";

export const metadata: Metadata = { title: "Temas" };

/** Un tema destacado también cuenta como activo. */
const THEME_TAGS: FilterTag[] = [
  { value: "activos", label: "Activos" },
  { value: "destacados", label: "Destacados" },
  { value: "desactivados", label: "Desactivados" },
];

/** Los temas sin tipo («cualquier evento») cuentan como infantiles, igual que en la landing. */
const TYPE_SELECT: FilterSelect = {
  label: "Tipo de evento",
  allLabel: "Todos los eventos",
  options: [
    { value: "cumpleanos", label: "Infantil" },
    { value: "bautizo", label: "Bautizo" },
    { value: "primera_comunion", label: "Primera comunión" },
  ],
};

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
    .select("id, name, event_type, is_active, featured, colors, card_url, logo_url, group_url, invitations(count)")
    .eq("is_deleted", false)
    .eq("invitations.is_deleted", false)
    .order("name")
    .returns<(Pick<Theme, "id" | "name" | "event_type" | "is_active" | "featured" | "colors" | "card_url" | "logo_url" | "group_url"> & { invitations: { count: number }[] })[]>();
  if (error) throw error;

  if (!data.length) return <div className={styles.empty}>Todavía no hay temas.</div>;

  const items = data.map((t) => {
    const cover = t.card_url || t.group_url || t.logo_url;
    const uses = t.invitations[0]?.count ?? 0;
    const active = t.is_active !== false;
    return {
      key: t.id,
      search: [t.name, t.event_type ? EVENT_TYPES[t.event_type].label : ""].join(" "),
      tags: active ? ["activos", ...(t.featured ? ["destacados"] : [])] : ["desactivados"],
      kind: eventType(t.event_type),
      node: (
        <div className={`${styles.themeCard}${t.is_active === false ? ` ${styles.themeOff}` : ""}`}>
          <Link className={styles.themeLink} href={`/admin/temas/${t.id}`}>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.themeCover} src={cover} alt="" />
            ) : (
              <div className={styles.themeCover} style={{ background: t.colors.accent }} />
            )}
            <div className={styles.themeBody}>
              <strong>{t.name}</strong>{" "}
              {t.is_active === false && <span className={`${styles.badge} ${styles.badgeOff}`}>Desactivado</span>}
                  <div className={styles.help}>
                {t.event_type ? `${EVENT_TYPES[t.event_type].label} · ` : ""}
                {uses === 1 ? "1 invitación" : `${uses} invitaciones`}
              </div>
              <div className={styles.swatches}>
                {Object.values(t.colors).map((c, i) => (
                  <span key={i} className={styles.swatch} style={{ background: c }} />
                ))}
              </div>
            </div>
          </Link>
          {/* Bautizo y comunión no salen entre los personajes de la landing: no se destacan */}
          {!isReligious(eventType(t.event_type)) && (
            <div className={styles.themeFeatured}>
              <FeaturedSwitch id={t.id} featured={Boolean(t.featured)} active={active} />
            </div>
          )}
          <div className={styles.themeActions}>
            <ThemeActions id={t.id} name={t.name} active={t.is_active !== false} uses={uses} />
            <a
              className={`${styles.actionIcon} ${styles.themeDemo}`}
              href={`/admin/vista/tema/${t.id}`}
              target="_blank"
              aria-label={`Ver demo de ${t.name}`}
              title="Ver demo"
            >
              <AdminIcon name="eye" />
            </a>
          </div>
        </div>
      ),
    };
  });

  return (
    <FilterableList
      items={items}
      tags={THEME_TAGS}
      select={TYPE_SELECT}
      allLabel="Todos"
      placeholder="Buscar tema por nombre"
      className={styles.themes}
    />
  );
}
