import { Suspense } from "react";
import type { Metadata } from "next";
import { typeFromSlug } from "@/lib/requests";
import { RequestBody } from "../../RequestBody";
import styles from "../../solicitud.module.css";

export const metadata: Metadata = {
  title: "Datos de tu invitación",
  // El enlace es privado: fuera de buscadores y sin mandar la dirección a otros sitios
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Primer enlace: el tipo de evento va en la URL (y tiene que ser el de la solicitud). */
export default function RequestPage({ params }: PageProps<"/solicitud/[tipo]/[token]">) {
  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Suspense fallback={<p className={styles.loading}>Cargando…</p>}>
          <Body params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function Body({ params }: Pick<PageProps<"/solicitud/[tipo]/[token]">, "params">) {
  const { tipo, token } = await params;
  return <RequestBody token={token} expectedType={typeFromSlug(tipo)} />;
}
