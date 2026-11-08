/*
 * Aperturas de la invitación (se elige una por tema en el panel):
 *   gift      regalo en 3D: la tapa sale volando
 *   balloon   globo 3D que se revienta
 *   book      libro que se abre y entramos a su página
 *   envelope  sobre: se rompe el sello, sale la carta y entramos en ella
 *   curtain   telón de teatro que se abre sobre la invitación
 *   image     imagen propia del tema
 * Todo es CSS 3D; aquí solo va el marcado. Los tiempos están en OPENERS.
 */
import type { CSSProperties } from "react";
import type { IntroStyle } from "@/lib/types";

/**
 * Cómo se abre cada una (ms desde el toque):
 *   start  arranca la portada (entradas del nombre, globos…)
 *   gone   desaparece la apertura
 *   iris   la portada nace en un círculo desde el objeto (si no, se funde o se entra por zoom)
 *   zoom   cuándo empieza el acercamiento a la página / carta
 */
export const OPENERS: Record<IntroStyle, { start: number; gone: number; iris?: boolean; zoom?: number; confetti: number }> = {
  gift: { start: 1100, gone: 1100, iris: true, confetti: 0 },
  balloon: { start: 520, gone: 520, iris: true, confetti: 0 },
  image: { start: 800, gone: 800, iris: true, confetti: 0 },
  book: { start: 1900, gone: 1900, zoom: 1250, confetti: 450 },
  envelope: { start: 1850, gone: 1850, zoom: 1150, confetti: 300 },
  curtain: { start: 250, gone: 1350, confetti: 500 },
};

export type OpenerContent = {
  name: string;
  label: string;
  logo: string | null;
  art: string | null;
  image: string | null;
  invited: string;
};

export function Opener({ style, open, c }: { style: IntroStyle; open: boolean; c: OpenerContent }) {
  const o = open ? " is-open" : "";
  switch (style) {
    case "balloon":
      return (
        <span className={`balloon3d${o}`} aria-hidden="true">
          <span className="balloon3d__float">
            <span className="balloon3d__ball">
              <span className="balloon3d__shine" />
            </span>
            <span className="balloon3d__knot" />
            <svg className="balloon3d__string" viewBox="0 0 40 120">
              <path d="M20 0 C 6 30, 34 60, 18 90 S 22 115, 20 120" />
            </svg>
          </span>
          <span className="balloon3d__flash" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <span key={i} className="balloon3d__shred" style={{ "--a": `${i * 45 + 12}deg` } as CSSProperties} />
          ))}
        </span>
      );

    case "image":
      return (
        <span className={`opener-image${o}`} aria-hidden="true">
          {c.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" />
          )}
        </span>
      );

    case "book":
      return (
        <span className={`book${o}`} aria-hidden="true">
          <span className="book__body">
            <span className="book__back" />
            <span className="book__block">
              <span className="book__first">
                <span className="book__once">{c.invited}</span>
                <span className="book__first-name">{c.name}</span>
              </span>
            </span>
            <span className="book__edge book__edge--right" />
            <span className="book__edge book__edge--top" />
            <span className="book__edge book__edge--bottom" />
            <span className="book__leaf" style={{ "--ld": ".2s" } as CSSProperties} />
            <span className="book__leaf" style={{ "--ld": ".3s" } as CSSProperties} />
            <span className="book__leaf" style={{ "--ld": ".36s" } as CSSProperties} />
            <span className="book__cover">
              <span className="book__front">
                <span className="book__frame">
                  <span className="book__kicker">{c.label}</span>
                  {c.art && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="book__art" src={c.art} alt="" />
                  )}
                  <span className="book__title">{c.name}</span>
                </span>
              </span>
              <span className="book__inside" />
            </span>
          </span>
          <span className="book__shadow" />
        </span>
      );

    case "envelope":
      return (
        <span className={`env3d${o}`} aria-hidden="true">
          <span className="env3d__float">
            <span className="env3d__back" />
            <span className="env3d__letter">
              <span className="env3d__invited">{c.invited}</span>
              {c.art && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="env3d__art" src={c.art} alt="" />
              )}
              <span className="env3d__name">{c.name}</span>
            </span>
            <span className="env3d__pocket" />
            <span className="env3d__flap">
              <span className="env3d__seal">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logo} alt="" />
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z" />
                  </svg>
                )}
              </span>
            </span>
          </span>
          <span className="env3d__shadow" />
        </span>
      );

    case "curtain":
      // El telón ocupa toda la pantalla; el botón real es la apertura completa
      return (
        <span className={`drape${o}`} aria-hidden="true">
          <span className="drape__curtain drape__curtain--l" />
          <span className="drape__curtain drape__curtain--r" />
          <span className="drape__valance" />
        </span>
      );

    default:
      return (
        <span className={`gift3d${o}`} aria-hidden="true">
          <span className="gift3d__shadow" />
          <span className="gift3d__light" />
          <span className="gift3d__float">
            <span className="gift3d__scene">
              <span className="g-face g-front" />
              <span className="g-face g-back" />
              <span className="g-face g-right" />
              <span className="g-face g-left" />
              <span className="g-face g-bottom" />
              <span className="g-face g-inside" />
              <span className="gift3d__lid">
                <span className="g-lid g-lid--front" />
                <span className="g-lid g-lid--back" />
                <span className="g-lid g-lid--right" />
                <span className="g-lid g-lid--left" />
                <span className="g-lid-top" />
                <span className="g-bow" />
                <span className="g-bow g-bow--cross" />
              </span>
            </span>
          </span>
        </span>
      );
  }
}
