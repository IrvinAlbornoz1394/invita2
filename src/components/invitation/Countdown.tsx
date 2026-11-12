"use client";

import { useEffect, useState, type CSSProperties } from "react";

const UNITS = [
  { key: "d", label: "Días", tone: "primary" },
  { key: "h", label: "Horas", tone: "secondary" },
  { key: "m", label: "Minutos", tone: "accent" },
  { key: "s", label: "Segundos", tone: "highlight" },
] as const;

type Left = Record<(typeof UNITS)[number]["key"], number>;

function remaining(target: number): Left | null {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 864e5),
    h: Math.floor((diff / 36e5) % 24),
    m: Math.floor((diff / 6e4) % 60),
    s: Math.floor((diff / 1e3) % 60),
  };
}

export function Countdown({ target, doneText }: { target: string; doneText: string }) {
  const t = new Date(target).getTime();
  // En el servidor se pinta en ceros; el reloj arranca al hidratar
  const [left, setLeft] = useState<Left | null | undefined>(undefined);

  useEffect(() => {
    const tick = () => setLeft(remaining(t));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [t]);

  if (left === null) return <p className="countdown__done">{doneText}</p>;

  return (
    <div className="countdown">
      {UNITS.map((u, i) => (
        <div key={u.key} className={`cd cd--${u.tone}`} data-reveal="up" style={{ "--rd": `${i * 0.08}s` } as CSSProperties}>
          <Flip value={String(left ? left[u.key] : 0).padStart(2, "0")} />
          <span className="cd__lbl">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Tarjeta que se voltea como un reloj de paletas: la mitad de arriba del número
 * anterior cae y descubre el nuevo. Cada capa ocupa la tarjeta completa y se
 * recorta a su mitad, así el pliegue queda justo en el centro.
 */
function Flip({ value }: { value: string }) {
  const [pair, setPair] = useState({ from: value, to: value, n: 0 });
  // Se ajusta durante el render (patrón de React para «valor anterior»)
  if (pair.to !== value) setPair({ from: pair.to, to: value, n: pair.n + 1 });

  const { from, to, n } = pair;
  return (
    <span className="flip" aria-label={to} role="img">
      <span className="flip__half flip__half--top" aria-hidden="true">{to}</span>
      <span className="flip__half flip__half--bottom" aria-hidden="true">{n ? from : to}</span>
      {n > 0 && (
        <span key={n} className="flip__fold" aria-hidden="true">
          <span className="flip__half flip__half--top flip__leaf-out">{from}</span>
          {/* Al terminar, la mitad fija también pasa al número nuevo: si el navegador
              pinta la fija encima de la hoja (misma profundidad 3D), no se queda el viejo */}
          <span
            className="flip__half flip__half--bottom flip__leaf-in"
            onAnimationEnd={() => setPair((p) => (p.n === n ? { ...p, from: p.to } : p))}
          >
            {to}
          </span>
        </span>
      )}
    </span>
  );
}
