"use client";

import { useState } from "react";
import styles from "./admin.module.css";

/** Copia el enlace público de la invitación (usa el dominio desde donde se abre el panel). */
export function CopyLink({ slug, className }: { slug: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${location.origin}/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" className={className ?? `${styles.btn} ${styles.btnSmall}`} onClick={copy}>
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </button>
  );
}
