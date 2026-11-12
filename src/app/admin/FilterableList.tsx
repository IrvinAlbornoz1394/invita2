"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./admin.module.css";

export type FilterItem = {
  key: string;
  /** Texto donde busca el filtro por nombre (nombre, enlace, tema…) */
  search: string;
  /** Etiquetas a las que pertenece (una fila puede estar en varias) */
  tags: string[];
  /** Opción del selector a la que pertenece (p. ej. el tipo de evento) */
  kind?: string;
  /** La fila ya armada en el servidor */
  node: ReactNode;
};

export type FilterTag = { value: string; label: string };

/** Selector opcional además de las etiquetas (p. ej. tipo de evento). Va en la URL como ?tipo=… */
export type FilterSelect = { label: string; allLabel: string; options: FilterTag[] };

/** Sin acentos ni mayúsculas: «Sofía» se encuentra con «sofia». */
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * Lista con búsqueda por nombre y etiquetas de estado. El filtro vive en la URL
 * (?q=…&ver=…) para que al volver de editar se conserve.
 */
export function FilterableList({
  items,
  tags,
  allLabel,
  placeholder,
  className,
  select,
}: {
  select?: FilterSelect;
  items: FilterItem[];
  tags: FilterTag[];
  /** «Todas» o «Todos» */
  allLabel: string;
  placeholder: string;
  className: string;
}) {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [tag, setTag] = useState(() => {
    const t = params.get("ver");
    return tags.some((x) => x.value === t) ? t! : "";
  });
  const [kind, setKind] = useState(() => {
    const k = params.get("tipo");
    return select?.options.some((o) => o.value === k) ? k! : "";
  });
  const input = useRef<HTMLInputElement>(null);

  // Guarda el filtro en la URL sin recargar ni llenar el historial
  useEffect(() => {
    const url = new URL(location.href);
    if (query.trim()) url.searchParams.set("q", query.trim());
    else url.searchParams.delete("q");
    if (tag) url.searchParams.set("ver", tag);
    else url.searchParams.delete("ver");
    if (kind) url.searchParams.set("tipo", kind);
    else url.searchParams.delete("tipo");
    history.replaceState(history.state, "", url);
  }, [query, tag, kind]);

  // «/» enfoca la búsqueda (como en GitHub), salvo que ya se esté escribiendo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key !== "/" || el.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = (i: FilterItem) => {
    const text = normalize(i.search);
    return words.every((w) => text.includes(w));
  };
  // Los conteos respetan lo demás: las etiquetas cuentan con la búsqueda y el
  // selector; el selector, con la búsqueda y la etiqueta
  const searched = items.filter(matches);
  const found = kind ? searched.filter((i) => i.kind === kind) : searched;
  const kindCount = (value: string) =>
    searched.filter((i) => (!value || i.kind === value) && (!tag || i.tags.includes(tag))).length;
  const shown = tag ? found.filter((i) => i.tags.includes(tag)) : found;
  const count = (value: string) => found.filter((i) => i.tags.includes(value)).length;
  const filtered = Boolean(words.length || tag || kind);

  return (
    <>
      <div className={styles.filters}>
        <label className={styles.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            ref={input}
            className={styles.input}
            type="search"
            value={query}
            placeholder={placeholder}
            aria-label={placeholder}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {select && (
          <select className={`${styles.select} ${styles.filterSelect}`} value={kind} aria-label={select.label} onChange={(e) => setKind(e.target.value)}>
            {[{ value: "", label: select.allLabel }, ...select.options].map((o) => (
              <option key={o.value} value={o.value}>
                {o.label} ({kindCount(o.value)})
              </option>
            ))}
          </select>
        )}
        <div className={styles.tags} role="group" aria-label="Filtrar por estado">
          {[{ value: "", label: allLabel }, ...tags].map((t) => {
            const n = t.value ? count(t.value) : found.length;
            return (
              <button
                key={t.value}
                type="button"
                className={styles.tag}
                aria-pressed={tag === t.value}
                onClick={() => setTag(t.value)}
              >
                {t.label}
                <span className={styles.tagCount}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length ? (
        <div className={className}>{shown.map((i) => <div key={i.key} className={styles.filterItem}>{i.node}</div>)}</div>
      ) : (
        <div className={styles.empty}>
          <p>Nada coincide con este filtro.</p>
          {filtered && (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSmall}`}
              onClick={() => {
                setQuery("");
                setTag("");
                setKind("");
              }}
            >
              Quitar filtros
            </button>
          )}
        </div>
      )}
    </>
  );
}
