import { EVENT_TYPES, eventType, type EventType } from "@/lib/defaults";
import { longDate, timeOf } from "@/lib/dates";
import { validToken, type RequestDataInput } from "@/lib/requests";
import { createPublicClient } from "@/lib/supabase/public";
import { RequestForm, type ThemeChoice } from "./RequestForm";
import styles from "./solicitud.module.css";

type RequestRow = {
  id: string;
  event_type: string;
  client_name: string;
  state: "pendiente" | "vencida" | "recibida" | "aprobada" | "rechazada";
  expires_at: string;
  data: RequestDataInput | null;
  correction_note: string | null;
};

const TZ = "America/Merida";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || null;

/**
 * Formulario de una solicitud (prospecto) buscada por su token. El tipo de
 * evento siempre sale de la solicitud guardada:
 * - Primer enlace (/solicitud/<tipo>/<token>): `expectedType` es el de la URL
 *   y tiene que coincidir.
 * - Enlace para corregir (/solicitud/corregir/<token>): sin tipo; abre el
 *   prospecto que el cliente ya había mandado.
 */
export async function RequestBody({ token, expectedType }: { token: string; expectedType?: EventType | null }) {
  if (expectedType === null || !validToken(token)) return <Closed title="Este enlace no es válido" />;

  const supabase = createPublicClient();
  const { data: req, error } = await supabase.rpc("request_by_token", { p_token: token }).maybeSingle<RequestRow>();
  if (error) throw error;
  if (!req) return <Closed title="Este enlace no es válido" />;
  const type = eventType(req.event_type);
  if (expectedType && expectedType !== type) return <Closed title="Este enlace no es válido" />;

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

  const correcting = !!req.correction_note;
  const until = `${longDate(req.expires_at, TZ).toLowerCase()} a las ${timeOf(req.expires_at, TZ)}`;

  return (
    <>
      <header className={styles.head}>
        <span className={styles.kicker}>
          <span aria-hidden="true">{EVENT_TYPES[type].emoji}</span> {EVENT_TYPES[type].label}
        </span>
        <h1 className={styles.title}>¡Hola, {req.client_name.split(/\s+/)[0]}!</h1>
        <p className={styles.lead}>
          {correcting
            ? `Revisa tus datos, corrige lo que te pedimos y vuelve a enviarlos. Tienes hasta el ${until}.`
            : `Llena los datos de tu evento y nosotros armamos tu invitación. Solo se puede enviar una vez; tienes hasta el ${until}.`}
        </p>
        {correcting && (
          <div className={styles.correction} role="note">
            <strong>Necesitamos que corrijas:</strong>
            <p>{req.correction_note}</p>
          </div>
        )}
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
