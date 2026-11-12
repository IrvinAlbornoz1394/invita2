"use client";

import type { Performer } from "@/lib/types";
import { MediaField } from "./MediaField";
import styles from "./admin.module.css";

export const MAX_PERFORMERS = 12;

export function move<T>(list: T[], i: number, step: number) {
  const j = i + step;
  if (j < 0 || j >= list.length) return list;
  const copy = [...list];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** Personajes o artistas del show: nombre y foto, con orden. */
export function PerformersField({
  value,
  onChange,
  folder,
  label = "Personajes / artistas (opcional)",
}: {
  value: { name: string; image_url?: string | null }[];
  onChange: (list: Performer[]) => void;
  folder: string;
  label?: string;
}) {
  const emit = (list: typeof value) => onChange(list.map((p) => ({ name: p.name, image_url: p.image_url ?? null })));
  const set = (i: number, p: Partial<Performer>) => emit(value.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.items}>
        {value.map((p, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.grid}>
              <input className={styles.input} value={p.name} placeholder="Nombre" onChange={(e) => set(i, { name: e.target.value })} />
              <MediaField value={p.image_url ?? null} folder={folder} onChange={(image_url) => set(i, { image_url })} />
            </div>
            <ItemTools
              index={i}
              count={value.length}
              onMove={(step) => emit(move(value, i, step))}
              onRemove={() => emit(value.filter((_, j) => j !== i))}
            />
          </div>
        ))}
      </div>
      <div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnSmall}`}
          onClick={() => emit([...value, { name: "", image_url: null }])}
          disabled={value.length >= MAX_PERFORMERS}
        >
          + Agregar personaje
        </button>
      </div>
    </div>
  );
}

export function ItemTools({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (step: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className={styles.itemTools}>
      <button type="button" className={styles.iconBtn} aria-label="Subir" disabled={index === 0} onClick={() => onMove(-1)}>
        ↑
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Bajar" disabled={index === count - 1} onClick={() => onMove(1)}>
        ↓
      </button>
      <button type="button" className={styles.iconBtn} aria-label="Quitar" onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}
