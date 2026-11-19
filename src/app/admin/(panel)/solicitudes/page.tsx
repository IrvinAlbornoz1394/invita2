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
