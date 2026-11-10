import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { shortDate, timeOf } from "@/lib/dates";
import { EVENT_TYPES, eventType, type EventType } from "@/lib/defaults";
import { duplicateInvitation } from "../actions";
import { CopyLink } from "../CopyLink";
import { InvitationActions } from "../InvitationActions";
import styles from "../admin.module.css";

export default function InvitationsPage() {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Invitaciones</h1>
          <p className={styles.pageSub}>Los próximos eventos primero.</p>
        </div>
        <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/admin/invitaciones/nueva">
          + Nueva invitación
        </Link>
      </div>
      <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
        <InvitationsList />
      </Suspense>
    </>
  );
}

type Row = {
  id: string;
  slug: string;
  published: boolean;
  is_active: boolean;
  name_lines: string[];
  age_text: string | null;
  event_type: EventType | null;
  photo_url: string | null;
  event_at: string;
  timezone: string;
  theme: { name: string } | null;
};

async function InvitationsList() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("invitations")
    .select("id, slug, published, is_active, name_lines, age_text, event_type, photo_url, event_at, timezone, theme:themes(name)")
    .eq("is_deleted", false)
    .order("event_at", { ascending: true })
    .returns<Row[]>();
  if (error) throw error;

  if (!data.length) {
    return (
      <div className={styles.empty}>
        <p>Todavía no hay invitaciones.</p>
        <Link className={`${styles.btn} ${styles.btnPrimary}`} href="/admin/invitaciones/nueva">
          Crear la primera
        </Link>
      </div>
    );
  }

  // Próximas arriba (más cercana primero) y las pasadas al final
  const now = new Date().toISOString();
  const rows = [...data.filter((r) => r.event_at >= now), ...data.filter((r) => r.event_at < now).reverse()];

  return (
    <div className={styles.list}>
      {rows.map((inv) => {
        const past = inv.event_at < now;
        return (
          <article key={inv.id} className={styles.row}>
            {inv.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.thumb} src={inv.photo_url} alt="" />
            ) : (
              <span className={`${styles.thumb} ${styles.thumbBlank}`}>{EVENT_TYPES[eventType(inv.event_type)].emoji}</span>
            )}
            <div>
              <Link className={styles.rowTitle} href={`/admin/invitaciones/${inv.id}`}>
                {inv.name_lines.join(" ")}
                {inv.age_text ? ` · ${inv.age_text}` : ""}
              </Link>
              <p className={styles.rowMeta}>
                {inv.is_active ? (
                  <span className={`${styles.badge} ${past ? styles.badgePast : inv.published ? styles.badgeOk : ""}`}>
                    {past ? "Pasada" : inv.published ? "Publicada" : "Borrador"}
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeOff}`}>Desactivada</span>
                )}
                <span>
                  {shortDate(inv.event_at, inv.timezone)} · {timeOf(inv.event_at, inv.timezone)}
                </span>
                {inv.theme && <span>{inv.theme.name}</span>}
                <span className={styles.mono}>/{inv.slug}</span>
              </p>
            </div>
            <div className={styles.rowActions}>
              <Link className={`${styles.btn} ${styles.btnSmall}`} href={`/admin/invitaciones/${inv.id}`}>
                Editar
              </Link>
              <a className={`${styles.btn} ${styles.btnSmall}`} href={`/admin/vista/${inv.id}`} target="_blank">
                Ver
              </a>
              {inv.published && inv.is_active && <CopyLink slug={inv.slug} />}
              <form action={duplicateInvitation.bind(null, inv.id)}>
                <button className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}>Duplicar</button>
              </form>
              <InvitationActions id={inv.id} name={inv.name_lines.join(" ")} active={inv.is_active} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
