import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPublishedInvitation } from "@/lib/data";
import { buildView } from "@/lib/view";
import { Invitation } from "@/components/invitation/Invitation";
import { InvitationLoading } from "@/components/invitation/Loading";

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const inv = await getPublishedInvitation(slug);
  if (!inv) return { title: "Invitación" };

  const v = buildView(inv);
  const title = v.ageText ? `${v.fullName} · ${v.ageText}` : v.fullName;
  const description = [v.longDate, v.time, v.area].filter(Boolean).join(" · ");
  const image = inv.theme?.card_url || inv.photo_url;

  return {
    title,
    description,
    // Las invitaciones llevan dirección privada: que no aparezcan en buscadores
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title: `¡${v.firstName} te invita a su fiesta!`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function Page({ params }: PageProps<"/[slug]">) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <InvitationPage params={params} />
    </Suspense>
  );
}

async function InvitationPage({ params }: Pick<PageProps<"/[slug]">, "params">) {
  const { slug } = await params;
  const inv = await getPublishedInvitation(slug);
  // Sin hash válido (o sin publicar) se manda a la landing
  if (!inv) redirect("/");

  return <Invitation view={buildView(inv)} />;
}
