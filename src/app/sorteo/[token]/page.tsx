import { Suspense } from "react";
import type { Metadata } from "next";
import { announceLabel } from "@/lib/giveaways";
import { createPublicClient } from "@/lib/supabase/public";
import type { EventType } from "@/lib/defaults";
import { GiveawayForm, type GiveawayTheme } from "../GiveawayForm";
import styles from "../../solicitud/solicitud.module.css";

export const metadata: Metadata = {
  title: "¡Gana tu invitación digital!",
  description: "Regístrate para participar por una invitación digital animada.",
  // No está en la landing: solo lo tiene quien recibe el enlace
  robots: { index: false, follow: false },
};

export default function GiveawayPage({ params }: PageProps<"/sorteo/[token]">) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
          <GiveawayBody params={params} />
        </Suspense>
      </div>
    </main>
  );
}

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || null;

async function GiveawayBody({ params }: Pick<PageProps<"/sorteo/[token]">, "params">) {
  const { token } = await params;
  if (!/^[a-z0-9]{8,32}$/.test(token)) return <Closed title="Este enlace no es válido" />;

  const supabase = createPublicClient();
  const { data: g, error } = await supabase
    .rpc("giveaway_by_token", { p_token: token })
    .maybeSingle<{ id: string; name: string; announce_on: string; open: boolean }>();
  if (error) throw error;
  if (!g) return <Closed title="Este enlace no es válido" />;
  if (!g.open) return <Closed title="El registro ya cerró" text={`Anunciamos a los ganadores el ${announceLabel(g.announce_on)}. ¡Gracias por participar!`} />;

  const { data: themes, error: themesError } = await supabase
    .from("themes")
    .select("id, name, card_url, logo_url, event_type")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("featured", { ascending: false })
    .order("name")
    .returns<(GiveawayTheme & { event_type: EventType | null })[]>();
  if (themesError) throw themesError;

  return (
    <>
      <header className={styles.head}>
        <span className={styles.kicker}>
          <span aria-hidden="true">🎁</span> Giveaway
        </span>
        <h1 className={styles.title}>¡Gana tu invitación digital animada!</h1>
        <p className={styles.lead}>
          Regístrate para participar. Anunciamos a los ganadores el {announceLabel(g.announce_on)} en nuestras redes y les escribimos por WhatsApp.
        </p>
      </header>
      <GiveawayForm token={token} themes={themes} announce={announceLabel(g.announce_on)} />
    </>
  );
}

function Closed({ title, text }: { title: string; text?: string }) {
  return (
    <section className={`${styles.card} ${styles.closed}`}>
      <span className={styles.closedIcon} aria-hidden="true">
        🎁
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
