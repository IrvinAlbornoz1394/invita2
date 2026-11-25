import { Suspense } from "react";
import type { Metadata } from "next";
import { RequestBody } from "../../RequestBody";
import styles from "../../solicitud.module.css";

export const metadata: Metadata = {
  title: "Corrige los datos de tu invitación",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Enlace para corregir: solo el token, que abre el prospecto que ya había mandado. */
export default function CorrectionPage({ params }: PageProps<"/solicitud/corregir/[token]">) {
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

async function Body({ params }: Pick<PageProps<"/solicitud/corregir/[token]">, "params">) {
  const { token } = await params;
  return <RequestBody token={token} />;
}
