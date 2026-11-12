"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import styles from "./admin.module.css";

const GAP = 10;
const EDGE = 8;

/**
 * Confirmación en burbuja junto al botón, al estilo del Popconfirm de Ant Design.
 * Usa la capa superior del navegador (popover), así no la recortan las tarjetas;
 * se cierra al tocar fuera o con Esc. El disparador recibe `open` y decide cuándo
 * pedir confirmación (p. ej. un interruptor solo al apagarlo).
 */
export function Popconfirm({
  title,
  description,
  okText = "Sí",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  children,
}: {
  title: string;
  description?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  children: (open: () => void) => ReactNode;
}) {
  const anchor = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const ok = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function place() {
    const a = anchor.current!.getBoundingClientRect();
    const el = pop.current!;
    // Tamaño real, sin la escala de la animación de entrada
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    // Arriba como en Ant; abajo si no cabe
    const above = a.top - height - GAP >= EDGE;
    const top = above ? a.top - height - GAP : a.bottom + GAP;
    const center = a.left + a.width / 2;
    const left = Math.min(Math.max(center - width / 2, EDGE), innerWidth - width - EDGE);
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.setProperty("--arrow", `${center - left}px`);
    el.dataset.placement = above ? "top" : "bottom";
  }

  // Abrir solo pide abrir; el efecto la muestra y la acomoda (las refs no se tocan al pintar)
  const [request, setRequest] = useState(0);
  const open = () => setRequest((n) => n + 1);
  useEffect(() => {
    const el = pop.current;
    if (!request || !el) return;
    el.showPopover();
    place();
    ok.current?.focus();
  }, [request]);

  const close = () => pop.current?.hidePopover();

  // Si se mueve la página, se cierra (como Ant cuando el disparador sale de vista)
  useEffect(() => {
    const el = pop.current!;
    const onToggle = (e: Event) => {
      const opened = (e as ToggleEvent).newState === "open";
      if (opened) {
        addEventListener("scroll", close, { capture: true, passive: true, once: true });
        addEventListener("resize", close, { once: true });
      } else {
        removeEventListener("scroll", close, { capture: true });
        removeEventListener("resize", close);
      }
    };
    el.addEventListener("toggle", onToggle);
    return () => {
      el.removeEventListener("toggle", onToggle);
      removeEventListener("scroll", close, { capture: true });
      removeEventListener("resize", close);
    };
  }, []);

  return (
    <span ref={anchor} className={styles.popAnchor}>
      {children(open)}
      {/* Solo <span>: puede quedar dentro de un <p> (la fila de la lista) */}
      <span ref={pop} popover="auto" role="alertdialog" aria-labelledby={titleId} className={styles.pop}>
        <span className={styles.popBody}>
          <span className={styles.popIcon} aria-hidden="true">
            !
          </span>
          <span>
            <span id={titleId} className={styles.popTitle}>
              {title}
            </span>
            {description && <span className={styles.popText}>{description}</span>}
          </span>
        </span>
        <span className={styles.popButtons}>
          <button type="button" className={styles.popBtn} onClick={close}>
            {cancelText}
          </button>
          <button
            ref={ok}
            type="button"
            className={`${styles.popBtn} ${danger ? styles.popBtnDanger : styles.popBtnPrimary}`}
            onClick={() => {
              close();
              onConfirm();
            }}
          >
            {okText}
          </button>
        </span>
      </span>
    </span>
  );
}
