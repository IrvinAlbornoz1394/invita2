import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { clockLabel, longDate, shortDate, timeOf, zonedToUtc } from "@/lib/dates";
import { EVENT_TYPES, eventType, hasAge, isReligious, usesFullName } from "@/lib/defaults";
import { publishChecks, REQUEST_STATES, requestData, requestPath, requestState, type RequestStatus } from "@/lib/requests";
import { firstError } from "@/lib/schema";
import { createThemeFromRequest } from "../../../actions";
import { CopyLink } from "../../../CopyLink";
import { PublishSwitch } from "../../../InvitationActions";
import { DeleteRequest, PublishRequest, RenewRequest, RequestLink, ReviewRequest } from "../../../RequestActions";
import { STATE_BADGE } from "../../../requestBadge";
import styles from "../../../admin.module.css";

export const metadata: Metadata = { title: "Solicitud" };

const TZ = "America/Merida";

export default function RequestPage({ params }: PageProps<"/admin/solicitudes/[id]">) {
  return (
    <div style={{ maxWidth: 720 }}>
      <Link className={styles.back} href="/admin/solicitudes">
        ← Solicitudes
      </Link>
      <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
        <RequestDetail params={params} />
      </Suspense>
    </div>
  );
}

type Row = {
  id: string;
  token: string;
  event_type: string;
  client_name: string;
  client_phone: string;
  status: RequestStatus;
  expires_at: string;
  data: unknown;
  submitted_at: string | null;
  created_at: string;
  invitation: {
    id: string;
    slug: string;
    published: boolean;
    is_active: boolean;
    is_deleted: boolean;
    maps_url: string | null;
    theme_id: string | null;
    ceremony: { enabled?: boolean; maps_url?: string | null } | null;
  } | null;
};

async function RequestDetail({ params }: Pick<PageProps<"/admin/solicitudes/[id]">, "params">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: req, error } = await supabase
    .from("invitation_requests")
    .select("*, invitation:invitations(id, slug, published, is_active, is_deleted, maps_url, theme_id, ceremony)")
    .eq("id", id)
    .maybeSingle<Row>();
  if (error) throw error;
  if (!req) notFound();

  const type = eventType(req.event_type);
  const state = requestState(req.status, req.expires_at);
  const inv = req.invitation && !req.invitation.is_deleted ? req.invitation : null;
  const live = !!inv && inv.published && inv.is_active;

  // Qué falta para publicar: con la invitación ya creada, o lo que se sabe antes de aprobarla
  const sent = requestData.safeParse(req.data);
  const customTheme = sent.success ? sent.data.custom_theme : null;
  const checks = inv
    ? publishChecks(inv, customTheme)
    : sent.success
      ? publishChecks({ maps_url: null, theme_id: sent.data.theme_id, ceremony: isReligious(type) ? sent.data.ceremony : null }, customTheme)
      : [];
  const ready = checks.every((c) => c.done);

  return (
    <>
      <h1 className={styles.pageTitle}>{req.client_name}</h1>
      <p className={styles.rowMeta} style={{ marginTop: 6 }}>
        <span className={STATE_BADGE[state]}>{REQUEST_STATES[state].label}</span>
        <span>
          {EVENT_TYPES[type].emoji} {EVENT_TYPES[type].label}
        </span>
        <a className={styles.mono} href={`https://wa.me/${req.client_phone}`} target="_blank" rel="noreferrer">
          {req.client_phone}
        </a>
        <span>Creada el {shortDate(req.created_at, TZ)}</span>
      </p>
      <p className={styles.pageSub}>{REQUEST_STATES[state].hint}</p>

      <div style={{ marginTop: 20 }}>
        {state === "pendiente" && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Enlace para el cliente</h2>
            <p className={styles.cardHint}>
              Vence el {longDate(req.expires_at, TZ).toLowerCase()} a las {timeOf(req.expires_at, TZ)}. Solo se puede mandar una vez.
            </p>
            <RequestLink
              path={requestPath(type, req.token)}
              phone={req.client_phone}
              clientName={req.client_name}
              siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
            />
            <div style={{ marginTop: 16 }}>
              <RenewRequest id={req.id} />
            </div>
          </section>
        )}

        {(state === "vencida" || state === "rechazada") && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{state === "vencida" ? "El enlace venció" : "Solicitud rechazada"}</h2>
            <p className={styles.cardHint}>
              Con un enlace nuevo el cliente puede {req.data ? "corregir lo que ya había llenado" : "llenar el formulario"}.
            </p>
            <RenewRequest id={req.id} label="Generar enlace nuevo" />
          </section>
        )}

        {state === "recibida" && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Revisar</h2>
            <p className={styles.cardHint}>Al aprobarla se crea la invitación sin publicar para que la completes (mapa, show, extras…).</p>
            <ReviewRequest id={req.id} canApprove={!!req.data} />
          </section>
        )}

        {state === "aprobada" && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Invitación</h2>
            {inv ? (
              <>
                <p className={styles.cardHint}>
                  {live ? "Publicada: el enlace ya funciona." : "Termínala en el editor (la ubicación en el mapa la pones tú) y publícala."}
                </p>
                <div className={styles.labelRow} style={{ gap: 8, justifyContent: "flex-start", flexWrap: "wrap" }}>
                  <Link className={`${styles.btn} ${live ? "" : styles.btnGhost}`} href={`/admin/invitaciones/${inv.id}`}>
                    Abrir en el editor
                  </Link>
                  <a className={`${styles.btn} ${styles.btnGhost}`} href={`/admin/vista/${inv.id}`} target="_blank">
                    Vista previa
                  </a>
                  {live ? (
                    <>
                      <CopyLink slug={inv.slug} />
                      <PublishSwitch id={inv.id} published />
                    </>
                  ) : (
                    <PublishRequest id={req.id} ready={ready} />
                  )}
                </div>
              </>
            ) : (
              <p className={styles.cardHint}>La invitación se eliminó.</p>
            )}
          </section>
        )}

        {(state === "recibida" || (state === "aprobada" && inv && !live)) && checks.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>{ready ? "Lista para publicar" : "Qué falta para publicar"}</h2>
            <p className={styles.cardHint}>
              {state === "recibida"
                ? "Después de aprobarla, complétalo en el editor."
                : ready
                  ? "Ya tiene todo lo necesario."
                  : "Complétalo en el editor; al guardar, esta lista se actualiza."}
            </p>
            <ul className={styles.checklist}>
              {checks.map((c) => (
                <li key={c.label} data-done={c.done || undefined}>
                  <span aria-hidden="true">{c.done ? "✓" : "○"}</span>
                  <span>
                    {c.label}
                    <span className={styles.srOnly}>{c.done ? " (listo)" : " (falta)"}</span>
                    {c.key === "theme" && !c.done && customTheme && (
                      <form action={createThemeFromRequest.bind(null, req.id)} style={{ display: "inline" }}>
                        {" · "}
                        <button className={styles.linkBtn}>Crear el tema «{customTheme}»</button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {req.data ? <ClientData data={req.data} type={type} requestId={req.id} submittedAt={req.submitted_at} /> : null}

        {state !== "aprobada" && (
          <div style={{ marginTop: 20 }}>
            <DeleteRequest id={req.id} name={req.client_name} />
          </div>
        )}
      </div>
    </>
  );
}

async function ClientData({
  data,
  type: t,
  requestId,
  submittedAt,
}: {
  data: unknown;
  type: ReturnType<typeof eventType>;
  requestId: string;
  submittedAt: string | null;
}) {
  const parsed = requestData.safeParse(data);
  if (!parsed.success) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Lo que llenó el cliente</h2>
        <p className={styles.error}>Los datos no son válidos: {firstError(parsed.error)}</p>
        <pre className={styles.mono} style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      </section>
    );
  }
  const d = parsed.data;
  const religious = isReligious(t);

  let theme: { name: string; card_url: string | null; logo_url: string | null } | null = null;
  if (d.theme_id) {
    const { supabase } = await requireAdmin();
    const res = await supabase.from("themes").select("name, card_url, logo_url").eq("id", d.theme_id).maybeSingle();
    theme = res.data;
  }
  const themeImage = theme?.card_url || theme?.logo_url;
  const eventDate = longDate(zonedToUtc(d.date, d.time, TZ).toISOString(), TZ);

  const rows: [string, ReactNode][] = [
    [usesFullName(t) ? "Quién invita" : "Festejado", d.name],
    ...(hasAge(t) ? ([["Edad", d.age ?? "—"]] as [string, ReactNode][]) : []),
    ["Fecha", eventDate],
    [religious ? "Hora de la recepción" : "Hora", clockLabel(d.time)],
    ["Lugar", d.venue_name ?? "—"],
    ["Dirección", d.address],
    ...(religious
      ? ([
          [
            "Ceremonia",
            d.ceremony.enabled
              ? [d.ceremony.time && clockLabel(d.ceremony.time), d.ceremony.place, d.ceremony.address].filter(Boolean).join(" · ") || "Sí"
              : "No habrá",
          ],
          ["Papás", d.parents.join(", ") || "—"],
          ["Padrinos", d.godparents.join(", ") || "—"],
        ] as [string, ReactNode][])
      : []),
    ["Mensaje", d.message ?? "— (se usa el de ejemplo)"],
    ["WhatsApp para confirmar", d.whatsapp],
    ["Preguntar cuántos van", d.rsvp_ask_people ? "Sí" : "No"],
    ["Extras", d.extras.length ? d.extras.map((x) => `${x.emoji} ${x.label}`).join(" · ") : "Ninguno"],
    [
      "Personaje / tema",
      theme ? theme.name : d.custom_theme ? <strong>Otro (hay que hacerlo): {d.custom_theme}</strong> : "Sin elegir",
    ],
  ];

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Lo que llenó el cliente</h2>
      {submittedAt && <p className={styles.cardHint}>Enviado el {shortDate(submittedAt, TZ)}.</p>}
      {d.notes && (
        <div className={styles.field} style={{ marginBottom: 16 }}>
          <span className={styles.label}>Notas del cliente</span>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{d.notes}</p>
        </div>
      )}
      <dl style={{ display: "grid", gridTemplateColumns: "minmax(120px, max-content) 1fr", gap: "8px 16px", margin: 0 }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "contents" }}>
            <dt className={styles.label}>{label}</dt>
            <dd style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value}</dd>
          </div>
        ))}
      </dl>
      {d.gallery.length > 0 && (
        <div className={styles.field} style={{ marginTop: 16 }}>
          <span className={styles.label}>Galería ({d.gallery.length})</span>
          <div className={styles.labelRow} style={{ gap: 8, justifyContent: "flex-start", flexWrap: "wrap" }}>
            {d.gallery.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} className={styles.uploadPreview} src={url} alt={`Foto ${i + 1} de la galería`} />
            ))}
          </div>
        </div>
      )}
      {(d.photo_url || themeImage) && (
        <div className={styles.labelRow} style={{ gap: 16, justifyContent: "flex-start", marginTop: 16, flexWrap: "wrap" }}>
          {d.photo_url && (
            <figure style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.uploadPreview} src={d.photo_url} alt="Foto que subió el cliente" />
              <figcaption className={styles.help}>
                {d.photo_url.includes(`/solicitudes/${requestId}/`) ? "Foto" : "Foto (de otra carpeta, no se usará)"}
              </figcaption>
            </figure>
          )}
          {theme && themeImage && (
            <figure style={{ margin: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={styles.uploadPreview} src={themeImage} alt={theme.name} />
              <figcaption className={styles.help}>{theme.name}</figcaption>
            </figure>
          )}
        </div>
      )}
    </section>
  );
}
