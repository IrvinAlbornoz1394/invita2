import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/dates";
import { EVENT_TYPES, eventType } from "@/lib/defaults";
import { announceLabel, ENTRY_STATES, giveawayPath, type EntryStatus } from "@/lib/giveaways";
import { FilterableList, type FilterTag } from "../../../../FilterableList";
import { DrawWinner, EntryActions, GiveawayActiveSwitch, GiveawayMessage } from "../../../../GiveawayActions";
import styles from "../../../../admin.module.css";

export const metadata: Metadata = { title: "Giveaway" };

const TZ = "America/Merida";

export default function GiveawayAdminPage({ params }: PageProps<"/admin/solicitudes/sorteo/[id]">) {
  return (
    <div style={{ maxWidth: 860 }}>
      <Link className={styles.back} href="/admin/solicitudes">
        ← Solicitudes
      </Link>
      <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
        <GiveawayDetail params={params} />
      </Suspense>
    </div>
  );
}

type Entry = {
  id: string;
  name: string;
  phone: string;
  facebook_name: string;
  event_type: string;
  custom_theme: string | null;
  event_date: string | null;
  status: EntryStatus;
  request_id: string | null;
  created_at: string;
  theme: { name: string } | null;
};

const STATUS_TAGS: FilterTag[] = (Object.keys(ENTRY_STATES) as EntryStatus[]).map((s) => ({ value: s, label: ENTRY_STATES[s] }));
const BADGE: Record<EntryStatus, string> = {
  participando: styles.badge,
  ganador: `${styles.badge} ${styles.badgeOk}`,
  descartado: `${styles.badge} ${styles.badgeOff}`,
};

async function GiveawayDetail({ params }: Pick<PageProps<"/admin/solicitudes/sorteo/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: g, error }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from("giveaways").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("giveaway_entries")
      .select("id, name, phone, facebook_name, event_type, custom_theme, event_date, status, request_id, created_at, theme:themes(name)")
      .eq("giveaway_id", id)
      .order("created_at")
      .returns<Entry[]>(),
  ]);
  if (error) throw error;
  if (entriesError) throw entriesError;
  if (!g) notFound();

  const won = entries.filter((e) => e.status === "ganador").length;
  const playing = entries.filter((e) => e.status === "participando").length;
  const open = g.is_active && new Date(g.closes_at) > new Date();

  const items = entries.map((e) => {
    const type = EVENT_TYPES[eventType(e.event_type)];
    const character = e.theme?.name ?? (e.custom_theme ? `Otro: ${e.custom_theme}` : "—");
    return {
      key: e.id,
      search: [e.name, e.facebook_name, e.phone, character, type.label].join(" "),
      tags: [e.status],
      node: (
        <article className={styles.row}>
          <span className={`${styles.thumb} ${styles.thumbBlank}`}>{type.emoji}</span>
          <div>
            <span className={styles.rowTitle}>
              {e.name} <span style={{ fontWeight: 400 }}>· Facebook: {e.facebook_name}</span>
            </span>
            <p className={styles.rowMeta}>
              <span className={BADGE[e.status]}>{ENTRY_STATES[e.status]}</span>
              <span>
                {type.label} · {character}
              </span>
              {e.event_date && <span>Evento: {shortDate(`${e.event_date}T12:00:00Z`, "UTC")}</span>}
              <a className={styles.mono} href={`https://wa.me/${e.phone}`} target="_blank" rel="noreferrer">
                {e.phone}
              </a>
              <span>Se registró el {shortDate(e.created_at, TZ)}</span>
            </p>
          </div>
          <div className={styles.rowActions}>
            {e.status === "ganador" ? (
              e.request_id && (
                <Link className={`${styles.btn} ${styles.btnSmall} ${styles.btnPrimary}`} href={`/admin/solicitudes/${e.request_id}`}>
                  Enviar su enlace
                </Link>
              )
            ) : (
              <EntryActions id={e.id} name={e.name} status={e.status} />
            )}
          </div>
        </article>
      ),
    };
  });

  return (
    <>
      <h1 className={styles.pageTitle}>{g.name}</h1>
      <p className={styles.rowMeta} style={{ marginTop: 6 }}>
        <span className={`${styles.badge} ${open ? styles.badgeOk : styles.badgePast}`}>{open ? "Registro abierto" : "Cerrado"}</span>
        <span>Anuncio: {announceLabel(g.announce_on)}</span>
        <span>{entries.length} participantes</span>
        <span>
          Ganadores {won}/{g.winners}
        </span>
      </p>

      <div className={styles.grid} style={{ marginTop: 20, gap: 16 }}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Enlace y mensaje</h2>
          <p className={styles.cardHint}>No aparece en la página principal: compártelo desde aquí.</p>
          <GiveawayMessage id={g.id} initial={g.message} path={giveawayPath(g.token)} announceOn={g.announce_on} winners={g.winners} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />
          <div style={{ marginTop: 16 }}>
            <GiveawayActiveSwitch id={g.id} active={g.is_active} />
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Ganadores</h2>
          <p className={styles.cardHint}>
            {won >= g.winners
              ? `Ya están los ${g.winners} ganadores.`
              : `${g.winners - won === 1 ? "Falta 1" : `Faltan ${g.winners - won}`}. Descarta a quien no cumplió los requisitos y sortea entre ${
                  playing === 1 ? "el único que sigue participando" : `los ${playing} que siguen participando`
                }, o márcalos a mano.`}
          </p>
          <DrawWinner giveawayId={g.id} disabled={!playing || won >= g.winners} />
        </section>

        {entries.length ? (
          <FilterableList items={items} tags={STATUS_TAGS} allLabel="Todos" placeholder="Buscar por nombre, Facebook o personaje" className={styles.list} />
        ) : (
          <div className={styles.empty}>
            <p>Todavía no se registra nadie.</p>
          </div>
        )}
      </div>
    </>
  );
}
