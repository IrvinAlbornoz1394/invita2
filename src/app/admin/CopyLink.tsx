"use client";

import { useState } from "react";
import { AdminIcon } from "./AdminIcon";
import styles from "./admin.module.css";

/** Copia el enlace público de la invitación (usa el dominio desde donde se abre el panel). */
export function CopyLink({ slug, className, icon = false }: { slug: string; className?: string; icon?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${location.origin}/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (icon) {
    const label = copied ? "¡Enlace copiado!" : "Copiar enlace";
    return (
      <button type="button" className={`${styles.actionIcon}${copied ? ` ${styles.actionIconDone}` : ""}`} onClick={copy} aria-label={label} title={label}>
        <AdminIcon name={copied ? "check" : "link"} />
      </button>
    );
  }

  return (
    <button type="button" className={className ?? `${styles.btn} ${styles.btnSmall}`} onClick={copy}>
      {copied ? "¡Copiado!" : "Copiar enlace"}
    </button>
  );
}
