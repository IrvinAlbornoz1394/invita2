/*
 * Escena del mapa en «fecha y lugar»: el mapa se queda de fondo (sticky en CSS)
 * y se acerca apenas mientras la información pasa encima. Escribe el transform
 * directo en el mapa, en un solo requestAnimationFrame por scroll.
 */
import { reducedMotion } from "./effects";

const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function startMapFx(root: HTMLElement) {
  if (reducedMotion()) return () => {};
  const scenes = [...root.querySelectorAll<HTMLElement>(".place")]
    .map((place) => ({ place, map: place.querySelector<HTMLElement>(".place__map") }))
    .filter((s): s is { place: HTMLElement; map: HTMLElement } => Boolean(s.map));
  if (!scenes.length) return () => {};

  let raf = 0;
  function frame() {
    raf = 0;
    const vh = innerHeight;
    for (const { place, map } of scenes) {
      const r = place.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const q = clamp(-r.top / Math.max(1, r.height - vh));
      map.style.transform = `scale(${(1.14 - q * 0.14).toFixed(4)})`;
    }
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  frame();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("scroll", kick);
    removeEventListener("resize", kick);
  };
}
