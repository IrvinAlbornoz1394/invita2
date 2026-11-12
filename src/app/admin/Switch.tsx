"use client";

import styles from "./admin.module.css";

/** Interruptor al estilo de Ant Design: píldora con perilla que se desliza. */
export function Switch({
  checked,
  onChange,
  disabled,
  loading,
  label,
  title,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Texto al lado; también es el nombre accesible */
  label: string;
  title?: string;
}) {
  return (
    <label className={styles.toggle} title={title} data-disabled={disabled || undefined}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-busy={loading || undefined}
        className={styles.toggleTrack}
        disabled={disabled || loading}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.toggleKnob} />
      </button>
      {label}
    </label>
  );
}
