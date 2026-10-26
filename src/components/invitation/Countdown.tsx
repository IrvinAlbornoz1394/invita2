"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const UNITS = [
  { key: "d", label: "Días", tone: "primary" },
  { key: "h", label: "Horas", tone: "highlight" },
  { key: "m", label: "Minutos", tone: "accent" },
  { key: "s", label: "Segundos", tone: "surface" },
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
        <div key={u.key} className={`cd cd--${u.tone}`} data-reveal="up" style={{ "--rd": `${i * 0.1}s` } as CSSProperties}>
          <Num value={left ? left[u.key] : 0} />
          <span className="cd__lbl">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

function Num({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const txt = String(value).padStart(2, "0");

  useEffect(() => {
    const el = ref.current!;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  }, [txt]);

  return (
    <span ref={ref} className="cd__num">
      {txt}
    </span>
  );
}
