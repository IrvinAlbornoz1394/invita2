import { Suspense } from "react";
import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { getLandingThemes } from "@/lib/data";
import { demoEventAt, demoInvitation, getDemoTheme } from "@/lib/demo";
import { eventType, isReligious } from "@/lib/defaults";
import { buildView } from "@/lib/view";
import { INTRO_STYLES } from "@/lib/defaults";
import { Invitation } from "@/components/invitation/Invitation";
import { InvitationLoading } from "@/components/invitation/Loading";
import { DemoBar } from "./DemoBar";

export async function generateMetadata({ params }: PageProps<"/demo/[tema]">): Promise<Metadata> {
  const { tema } = await params;
  const theme = await getDemoTheme(tema);
  return {
    title: theme ? `Demo · ${theme.name}` : "Demo",
    description: "Así se ve una invitación digital de invita2 con este personaje.",
    robots: { index: false, follow: true },
    openGraph: theme?.card_url ? { images: [theme.card_url] } : undefined,
  };
}

/** Nombres en español para ?apertura= (también se aceptan los internos) */
const APERTURAS: Record<string, string> = { regalo: "gift", globo: "balloon", libro: "book", sobre: "envelope", telon: "curtain", "telón": "curtain" };

/** Demo pública de un tema con datos de ejemplo (niño o niña). */
export default function DemoPage({ params, searchParams }: PageProps<"/demo/[tema]">) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <Demo params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Demo({ params, searchParams }: Pick<PageProps<"/demo/[tema]">, "params" | "searchParams">) {
  const [{ tema }, query] = await Promise.all([params, searchParams]);
  const [theme, eventAt, all] = await Promise.all([getDemoTheme(tema), demoEventAt(), getLandingThemes()]);
  if (!theme) redirect("/#personajes");
  // Enlace viejo con el id: a la dirección corta, conservando ?apertura=
  if (tema !== theme.slug) {
    const qs = new URLSearchParams(Object.entries(query).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])));
    permanentRedirect(`/demo/${theme.slug}${qs.size ? `?${qs}` : ""}`);
  }

  // ?apertura=regalo|globo|libro|sobre|telon: probar otra apertura sin tocar el tema
  const asked = String(query.apertura ?? "").toLowerCase();
  const key = APERTURAS[asked] ?? asked;
  const intro = INTRO_STYLES.find((s) => s.value === key && s.value !== "image")?.value;
  const view = buildView(demoInvitation(intro ? { ...theme, intro: { ...theme.intro, style: intro } } : theme, eventAt));
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? null;
  // Se cambia entre personajes de la misma familia: fiesta con fiesta, bautizo/comunión entre ellos
  const religious = isReligious(eventType(theme.event_type));
  const themes = all
    .filter((t) => t.religious === religious)
    .map((t) => ({ id: t.id, slug: t.slug, name: t.name, image: t.logoUrl ?? t.cardUrl }));

  return (
    <>
      <DemoBar themeId={theme.id} themeName={theme.name} contact={contact} themes={themes} />
      {/* key: al cambiar de personaje se vuelve a abrir desde la entrada */}
      <Invitation key={`${theme.id}-${intro ?? ""}`} view={view} />
    </>
  );
}
