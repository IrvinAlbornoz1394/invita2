import { Suspense } from "react";
import type { Metadata } from "next";
import { EVENT_TYPES, eventType } from "@/lib/defaults";
import { longDate } from "@/lib/dates";
import { typeFromSlug, validToken, type RequestDataInput } from "@/lib/requests";
import { createPublicClient } from "@/lib/supabase/public";
import { RequestForm, type ThemeChoice } from "../../RequestForm";
import styles from "../../solicitud.module.css";

export const metadata: Metadata = {
  title: "Datos de tu invitación",
  // El enlace es privado: fuera de buscadores y sin mandar la dirección a otros sitios
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function RequestPage({ params }: PageProps<"/solicitud/[tipo]/[token]">) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
          <RequestBody params={params} />
        </Suspense>
      </div>
    </main>
  );
}

type RequestRow = {
  id: string;
  event_type: string;
  client_name: string;
  state: "pendiente" | "vencida" | "recibida" | "aprobada" | "rechazada";
  expires_at: string;
  data: RequestDataInput | null;
};

const TZ = "America/Merida";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || null;

async function RequestBody({ params }: Pick<PageProps<"/solicitud/[tipo]/[token]">, "params">) {
  const { tipo, token } = await params;
  const type = typeFromSlug(tipo);
  if (!type || !validToken(token)) return <Closed title="Este enlace no es válido" />;

  const supabase = createPublicClient();
  const { data: req, error } = await supabase.rpc("request_by_token", { p_token: token }).maybeSingle<RequestRow>();
  if (error) throw error;
  // El tipo va en la URL solo para que se lea; manda el de la solicitud
  if (!req || eventType(req.event_type) !== type) return <Closed title="Este enlace no es válido" />;

  if (req.state === "recibida" || req.state === "aprobada") {
    return <Closed title="¡Ya tenemos tus datos!" text="Estamos preparando tu invitación; te avisamos por WhatsApp cuando esté lista." happy />;
  }
  if (req.state === "vencida") return <Closed title="Este enlace ya venció" text="Escríbenos y te mandamos uno nuevo." />;
  if (req.state === "rechazada") return <Closed title="Este enlace ya no está activo" text="Escríbenos y te mandamos uno nuevo." />;

  const { data: themes, error: themesError } = await supabase
    .from("themes")
    .select("id, name, card_url, logo_url")
    .or(`event_type.eq.${type},event_type.is.null`)
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("featured", { ascending: false })
    .order("name")
    .returns<ThemeChoice[]>();
  if (themesError) throw themesError;

  return (
    <>
      <header className={styles.head}>
        <span className={styles.kicker}>
          <span aria-hidden="true">{EVENT_TYPES[type].emoji}</span> {EVENT_TYPES[type].label}
        </span>
        <h1 className={styles.title}>¡Hola, {req.client_name.split(/\s+/)[0]}!</h1>
        <p className={styles.lead}>
          Llena los datos de tu evento y nosotros armamos tu invitación. Solo se puede enviar una vez; tienes hasta el{" "}
          {longDate(req.expires_at, TZ).toLowerCase()}.
        </p>
      </header>
      <RequestForm token={token} requestId={req.id} type={type} initial={req.data} themes={themes} contact={CONTACT} />
    </>
  );
}

function Closed({ title, text, happy = false }: { title: string; text?: string; happy?: boolean }) {
  return (
    <section className={`${styles.card} ${styles.closed}`}>
      <span className={styles.closedIcon} aria-hidden="true">
        {happy ? "🎉" : "🔒"}
      </span>
      <h1 className={styles.title}>{title}</h1>
      {text && <p className={styles.lead}>{text}</p>}
      {CONTACT && (
        <a className={styles.btnGhost} href={`https://wa.me/${CONTACT}`} target="_blank" rel="noreferrer">
          Escríbenos por WhatsApp
        </a>
      )}
    </section>
  );
}
