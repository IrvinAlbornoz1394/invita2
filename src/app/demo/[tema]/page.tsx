import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoEventAt, demoInvitation, demoKid, getDemoTheme } from "@/lib/demo";
import { buildView } from "@/lib/view";
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
  const [theme, eventAt] = await Promise.all([getDemoTheme(tema), demoEventAt()]);
  if (!theme) redirect("/#personajes");

  const kid = demoKid(query.para);
  const view = buildView(demoInvitation(theme, kid, eventAt));
  const contact = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP ?? null;

  return (
    <>
      <DemoBar themeId={theme.id} themeName={theme.name} kid={kid} contact={contact} />
      {/* key: al cambiar de niño a niña se vuelve a abrir desde la entrada */}
      <Invitation key={kid} view={view} />
    </>
  );
}
