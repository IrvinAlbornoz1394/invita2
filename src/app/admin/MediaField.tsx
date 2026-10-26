"use client";

import { useId, useRef, useState } from "react";
import { uploadMedia } from "./upload";
import styles from "./admin.module.css";

type Props = {
  label?: string;
  help?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  kind?: "image" | "audio";
  wide?: boolean;
};

/** Campo de imagen o audio: subir, reemplazar o quitar. */
export function MediaField({ label, help, value, onChange, folder, kind = "image", wide }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadMedia(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el archivo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.upload}>
        {kind === "image" &&
          (value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={`${styles.uploadPreview} ${wide ? styles.uploadPreviewWide : ""}`} src={value} alt="" />
          ) : (
            <span className={`${styles.uploadPreview} ${styles.uploadBlank} ${wide ? styles.uploadPreviewWide : ""}`}>
              🖼️
            </span>
          ))}
        <div className={styles.grid} style={{ gap: 6 }}>
          {kind === "audio" && value && <audio className={styles.audio} src={value} controls preload="none" />}
          <div className={styles.uploadActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSmall}`}
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              {busy ? "Subiendo…" : value ? "Cambiar" : "Subir"}
            </button>
            {value && (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSmall} ${styles.btnGhost}`}
                onClick={() => onChange(null)}
                disabled={busy}
              >
                Quitar
              </button>
            )}
          </div>
        </div>
        <input
          id={id}
          ref={input}
          className={styles.fileInput}
          type="file"
          accept={kind === "image" ? "image/*" : "audio/*"}
          onChange={pick}
        />
      </div>
      {help && <span className={styles.help}>{help}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
