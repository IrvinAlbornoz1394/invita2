import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { shortDate } from "@/lib/dates";
import { EVENT_TYPES, eventType } from "@/lib/defaults";
import { REQUEST_STATES, requestState, type RequestState, type RequestStatus } from "@/lib/requests";
import { AdminIcon } from "../../AdminIcon";
import { FilterableList, type FilterTag } from "../../FilterableList";
import { NewRequestForm } from "../../RequestActions";
import { CopyGiveawayMessage, NewGiveawayForm } from "../../GiveawayActions";
import { announceLabel, giveawayPath } from "@/lib/giveaways";
import { STATE_BADGE } from "../../requestBadge";
import styles from "../../admin.module.css";

export const metadata: Metadata = { title: "Solicitudes" };

export default function RequestsPage() {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Solicitudes</h1>
          <p className={styles.pageSub}>Enlaces para que el cliente llene los datos de su evento. Primero las que hay que revisar.</p>
        </div>
      </div>
      <Suspense fallback={null}>
        <Giveaways />
      </Suspense>
      <div className={styles.card} style={{ marginBottom: 24 }}>
        <h2 className={styles.cardTitle}>Nueva solicitud</h2>
        <p className={styles.cardHint}>Genera el enlace con el tipo de evento ya fijo y mándaselo al cliente.</p>
        <NewRequestForm />
      </div>
      <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
        <RequestsList />
      </Suspense>
    </>
  );
}

const STATE_ORDER: RequestState[] = ["recibida", "pendiente", "aprobada", "vencida", "rechazada"];
const STATE_TAGS: FilterTag[] = STATE_ORDER.map((s) => ({ value: s, label: REQUEST_STATES[s].label }));

type Row = {
  id: string;
  event_type: string;
  client_name: string;
  client_phone: string;
  status: RequestStatus;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
  data: { name?: string } | null;
};

const TZ = "America/Merida";

async function RequestsList() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("invitation_requests")
    .select("id, event_type, client_name, client_phone, status, expires_at, submitted_at, created_at, data")
    .order("created_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw error;

  if (!data.length) return <div className={styles.empty}><p>Todavía no hay solicitudes.</p></div>;

  const rows = data
    .map((r) => ({ ...r, state: requestState(r.status, r.expires_at) }))
    .sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state));

  const items = rows.map((r) => {
    const type = EVENT_TYPES[eventType(r.event_type)];
    const festejado = r.data?.name;
    return {
      key: r.id,
      search: [r.client_name, r.client_phone, festejado, type.label].filter(Boolean).join(" "),
      tags: [r.state],
      node: (
        <article className={styles.row}>
          <span className={`${styles.thumb} ${styles.thumbBlank}`}>{type.emoji}</span>
          <div>
            <Link className={styles.rowTitle} href={`/admin/solicitudes/${r.id}`}>
              {r.client_name}
              {festejado ? ` · ${festejado}` : ""}
            </Link>
            <p className={styles.rowMeta}>
              <span className={STATE_BADGE[r.state]}>{REQUEST_STATES[r.state].label}</span>
              <span>{type.label}</span>
              <span className={styles.mono}>{r.client_phone}</span>
              <span>
                {r.state === "pendiente"
                  ? `Vence el ${shortDate(r.expires_at, TZ)}`
                  : r.submitted_at
                    ? `Llenada el ${shortDate(r.submitted_at, TZ)}`
                    : `Creada el ${shortDate(r.created_at, TZ)}`}
              </span>
            </p>
          </div>
          <div className={styles.rowActions}>
            <Link className={styles.actionIcon} href={`/admin/solicitudes/${r.id}`} aria-label="Abrir" title="Abrir">
              <AdminIcon name="eye" />
            </Link>
          </div>
        </article>
      ),
    };
  });

  return <FilterableList items={items} tags={STATE_TAGS} allLabel="Todas" placeholder="Buscar por cliente, teléfono o festejado" className={styles.list} />;
}

type GiveawayRow = {
  id: string;
  token: string;
  name: string;
  winners: number;
  announce_on: string;
  closes_at: string;
  message: string;
  is_active: boolean;
  entries: { status: string }[];
};

/** Giveaways: el enlace no está en la landing; se copia de aquí con su mensaje. */
async function Giveaways() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("giveaways")
    .select("id, token, name, winners, announce_on, closes_at, message, is_active, entries:giveaway_entries(status)")
    .order("created_at", { ascending: false })
    .returns<GiveawayRow[]>();
  if (error) throw error;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return (
    <section className={styles.card} style={{ marginBottom: 16 }}>
      <h2 className={styles.cardTitle}>🎁 Giveaways</h2>
      <p className={styles.cardHint}>Enlace para que la gente se registre; a los ganadores se les genera su solicitud.</p>
      <div className={styles.grid} style={{ gap: 12 }}>
        {data.map((g) => {
          const won = g.entries.filter((e) => e.status === "ganador").length;
          const open = g.is_active && new Date(g.closes_at) > new Date();
          return (
            <div key={g.id} className={styles.item}>
              <div className={styles.labelRow} style={{ gap: 12, flexWrap: "wrap" }}>
                <div>
                  <Link className={styles.rowTitle} href={`/admin/solicitudes/sorteo/${g.id}`}>
                    {g.name}
                  </Link>
                  <p className={styles.rowMeta}>
                    <span className={`${styles.badge} ${open ? styles.badgeOk : styles.badgePast}`}>{open ? "Registro abierto" : "Cerrado"}</span>
                    <span>{g.entries.length} participantes</span>
                    <span>
                      Ganadores {won}/{g.winners}
                    </span>
                    <span>Anuncio: {announceLabel(g.announce_on)}</span>
                  </p>
                </div>
                <div className={styles.labelRow} style={{ gap: 8 }}>
                  {open && <CopyGiveawayMessage template={g.message} path={giveawayPath(g.token)} announceOn={g.announce_on} winners={g.winners} siteUrl={siteUrl} small />}
                  <Link className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`} href={`/admin/solicitudes/sorteo/${g.id}`}>
                    Ver participantes
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        <details>
          <summary className={styles.label} style={{ cursor: "pointer" }}>
            + Nuevo giveaway
          </summary>
          <div style={{ marginTop: 12 }}>
            <NewGiveawayForm />
          </div>
        </details>
      </div>
    </section>
  );
}
