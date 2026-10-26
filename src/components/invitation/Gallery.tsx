"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { GalleryItem } from "@/lib/types";
import { Icon } from "./icons";

export function Gallery({ items, name }: { items: GalleryItem[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const d = dialogRef.current!;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const go = (step: number) => setOpen((i) => (i === null ? i : (i + step + items.length) % items.length));

  return (
    <>
      <ul className="gallery">
        {items.map((item, i) => (
          <li key={item.url + i} data-reveal="zoom" style={{ "--rd": `${(i % 4) * 0.07}s` } as CSSProperties}>
            <button type="button" className="gallery__item" onClick={() => setOpen(i)} aria-label={`Ver foto ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`Foto ${i + 1} de ${name}`} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {open !== null && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={items[open].url} alt={`Foto ${open + 1} de ${name}`} />
            <button className="lightbox__btn lightbox__close" onClick={() => setOpen(null)} aria-label="Cerrar">
              <Icon name="close" />
            </button>
            {items.length > 1 && (
              <>
                <button className="lightbox__btn lightbox__prev" onClick={() => go(-1)} aria-label="Anterior">
                  <Icon name="prev" />
                </button>
                <button className="lightbox__btn lightbox__next" onClick={() => go(1)} aria-label="Siguiente">
                  <Icon name="next" />
                </button>
                <p className="lightbox__count">
                  {open + 1} / {items.length}
                </p>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
