/* Efectos de la invitación: confeti en canvas, globos que suben y música. */

export type Fx = {
  burst: (x: number, y: number, count?: number) => void;
  rain: (count?: number) => void;
};

export const reducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- Confeti ---------------- */
type Part = {
  x: number; y: number; vx: number; vy: number;
  w: number; h: number; rot: number; vr: number;
  c: string; round: boolean; life: number;
};

export function createConfetti(cv: HTMLCanvasElement, colors: string[]) {
  const ctx = cv.getContext("2d")!;
  let parts: Part[] = [];
  let running = false;
  let W = 0;
  let H = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth;
    H = innerHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  const make = (x: number, y: number, vx: number, vy: number): Part => ({
    x, y, vx, vy,
    w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
    round: Math.random() < 0.3, life: 0,
  });

  function loop() {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => p.y < H + 30 && p.life < 600);
    for (const p of parts) {
      p.vy += 0.18; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)) + 2);
      ctx.restore();
    }
    if (parts.length) requestAnimationFrame(loop);
    else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }
  const kick = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  };

  return {
    burst(x: number, y: number, count = 80) {
      if (reducedMotion()) return;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 4 + Math.random() * 9;
        parts.push(make(x, y, Math.cos(a) * s, Math.sin(a) * s - 6));
      }
      kick();
    },
    rain(count = 80) {
      if (reducedMotion()) return;
      for (let i = 0; i < count; i++) {
        parts.push(make(Math.random() * W, -20 - Math.random() * H * 0.5, (Math.random() - 0.5) * 2, Math.random() * 2));
      }
      kick();
    },
    destroy() {
      removeEventListener("resize", resize);
      parts = [];
    },
  };
}

/** Confeti que sale del centro de un elemento. */
export function burstFrom(fx: Fx, el: Element, count = 24, yFactor = 1 / 3) {
  const r = el.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height * yFactor, count);
}

/* ---------------- Globos ---------------- */
type Later = (fn: () => void, ms: number) => void;

/** Temporizadores que se cancelan juntos al desmontar. */
function timerSet() {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later: Later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  return { later, clear: () => timers.forEach(clearTimeout) };
}

/**
 * Crea un globo «3D» (esfera con luz y sombra en CSS) que sube por `layer` y se
 * revienta al tocarlo. depth: < 0.9 queda al fondo (más tenue, chico y lento).
 */
function launchBalloon(
  layer: HTMLElement,
  { color, depth, left, dur, front }: { color: string; depth: number; left: number; dur: number; front: boolean },
  later: Later,
  onPop?: (x: number, y: number) => void
) {
  const b = document.createElement("div");
  b.className = `balloon${front ? " balloon--front" : ""}`;
  b.style.left = `${left}%`;
  b.style.setProperty("--c", color);
  b.style.setProperty("--z", depth.toFixed(2));
  b.style.width = `${Math.round(34 + depth * 30)}px`;
  b.style.animationDuration = `${dur.toFixed(1)}s`;
  b.style.zIndex = depth > 0.9 ? "1" : "0";
  b.innerHTML = '<span class="balloon__body"></span><span class="balloon__string"></span>';
  b.addEventListener("pointerdown", (e) => {
    if (b.classList.contains("is-popping")) return;
    e.stopPropagation();
    b.classList.add("is-popping");
    const r = b.querySelector(".balloon__body")!.getBoundingClientRect();
    onPop?.(r.left + r.width / 2, r.top + r.height / 2);
    navigator.vibrate?.(12);
    later(() => b.remove(), 650);
  });
  layer.appendChild(b);
  later(() => b.remove(), dur * 1000 + 500);
}

const pick = <T,>(list: T[]) => list[(Math.random() * list.length) | 0];

/**
 * Globos que suben por la portada. Cuatro de cada cinco salen por delante del
 * contenido, más grandes; el resto va detrás. Todos se revientan al tocarlos.
 */
export function startBalloons(back: HTMLElement, front: HTMLElement | null, colors: string[], onPop?: (x: number, y: number) => void) {
  if (reducedMotion()) return () => {};
  const { later, clear } = timerSet();
  let count = 0;

  function spawn() {
    // cuatro de cada cinco salen por delante
    const inFront = Boolean(front) && count++ % 5 !== 0;
    const depth = inFront ? 1.15 + Math.random() * 0.25 : 0.55 + Math.random() * 0.6;
    const dur = (13 + Math.random() * 7) / depth;
    launchBalloon(inFront ? front! : back, { color: pick(colors), depth, left: Math.random() * 90, dur, front: inFront }, later, onPop);
  }

  for (let i = 0; i < 4; i++) later(spawn, i * 500);
  const id = setInterval(() => {
    if (!document.hidden && scrollY < innerHeight) spawn();
  }, 3000);

  return () => {
    clearInterval(id);
    clear();
    back.replaceChildren();
    front?.replaceChildren();
  };
}

/**
 * Elementos que flotan y se pueden tocar (los globos de fiesta van aparte):
 *   bubble  burbujas de jabón que suben (bautizo: el agua)
 *   petal   pétalos que caen girando (primera comunión)
 *   hotair  globos aerostáticos que suben despacio, meciéndose
 */
export type FloaterKind = "bubble" | "petal" | "hotair";

/** Globo aerostático: gajos de colores, cuerdas y canasta. Los colores salen de --h1/--h2. */
const HOTAIR_SVG =
  '<svg viewBox="0 0 60 86" aria-hidden="true">' +
  '<path style="fill:var(--h1)" d="M30 2C14 2 3 14 3 29c0 13 9 21 16 29h22c7-8 16-16 16-29C57 14 46 2 30 2Z"/>' +
  '<path style="fill:var(--h2)" d="M30 2c-8 0-13 12-13 27 0 13 4 21 7 29h12c3-8 7-16 7-29C43 14 38 2 30 2Z"/>' +
  '<path style="fill:var(--h1)" d="M30 2c-3 0-5 12-5 27 0 13 2 21 3 29h4c1-8 3-16 3-29C35 14 33 2 30 2Z"/>' +
  '<path fill="#fff" opacity=".28" d="M17 9c-6 5-9 12-9 20 0 4 1 8 3 11-1-11 2-22 6-31Z"/>' +
  '<path fill="#000" opacity=".1" d="M45 9c6 5 9 12 9 20 0 10-7 18-13 29h-4c5-11 11-20 11-31 0-7-1-13-3-18Z"/>' +
  '<rect x="18.5" y="56" width="23" height="4" rx="2" style="fill:var(--c-accent)"/>' +
  '<path d="M20 60l4.5 12M40 60l-4.5 12M27 60l-.5 12M33 60l.5 12" stroke="currentColor" stroke-width=".9" opacity=".55"/>' +
  '<rect x="23" y="72" width="14" height="11" rx="2.5" style="fill:color-mix(in srgb,var(--c-accent) 70%,#6b4a24)"/>' +
  '<path d="M23 76.5h14" stroke="#000" stroke-width=".8" opacity=".18"/>' +
  "</svg>";

/** Combinaciones de gajos de los globos aerostáticos, con los colores del tema. */
const HOTAIR_TONES: [string, string][] = [
  ["var(--c-primary)", "var(--c-surface)"],
  ["var(--c-secondary)", "var(--c-primary)"],
  ["var(--c-highlight)", "var(--c-secondary)"],
  ["var(--c-accent)", "var(--c-surface)"],
];

/**
 * Crea un elemento flotante en `layer`. Al tocarlo: la burbuja se revienta, el
 * pétalo sale volando y el globo aerostático se eleva y se aleja.
 */
function launchFloater(
  layer: HTMLElement,
  kind: FloaterKind,
  { front, left, dur }: { front: boolean; left: number; dur?: number },
  later: Later,
  onPop?: (x: number, y: number) => void
) {
  const el = document.createElement("div");
  el.className = `floater floater--${kind}${front ? " floater--front" : ""}`;
  // Los de adelante, más grandes y un poco más rápidos
  const size =
    kind === "bubble"
      ? front ? 46 + Math.random() * 34 : 22 + Math.random() * 22
      : kind === "hotair"
        ? front ? 52 + Math.random() * 26 : 28 + Math.random() * 16
        : front ? 20 + Math.random() * 10 : 13 + Math.random() * 7;
  const time = dur ?? (kind === "hotair" ? 19 + Math.random() * 7 : (kind === "bubble" ? 11 : 13) + Math.random() * 6) - (front ? 2 : 0);
  el.style.left = `${left}%`;
  el.style.setProperty("--w", `${Math.round(size)}px`);
  el.style.setProperty("--sway", `${(Math.random() * 2 + (kind === "hotair" ? 3.4 : 2.4)).toFixed(1)}s`);
  el.style.setProperty("--tone", Math.random() < 0.5 ? "var(--c-highlight)" : "var(--c-accent)");
  if (kind === "hotair") {
    const [h1, h2] = pick(HOTAIR_TONES);
    el.style.setProperty("--h1", h1);
    el.style.setProperty("--h2", h2);
  }
  el.style.animationDuration = `${time.toFixed(1)}s`;
  el.innerHTML = `<span class="floater__body">${kind === "hotair" ? HOTAIR_SVG : ""}</span>`;
  el.addEventListener("pointerdown", (e) => {
    if (el.classList.contains("is-popping")) return;
    e.stopPropagation();
    el.classList.add("is-popping");
    const r = el.querySelector(".floater__body")!.getBoundingClientRect();
    onPop?.(r.left + r.width / 2, r.top + r.height / 2);
    navigator.vibrate?.(8);
    later(() => el.remove(), kind === "hotair" ? 1300 : 700);
  });
  layer.appendChild(el);
  later(() => el.remove(), time * 1000 + 500);
}

/**
 * Elementos que flotan en la portada. Algo más de la mitad pasa por delante
 * del contenido. Los globos aerostáticos, más grandes, salen menos seguido.
 */
export function startFloaters(
  back: HTMLElement,
  front: HTMLElement | null,
  kind: FloaterKind,
  onPop?: (x: number, y: number) => void
) {
  if (reducedMotion()) return () => {};
  const { later, clear } = timerSet();
  let count = 0;
  const first = kind === "hotair" ? 3 : 5;

  const spawn = () => {
    const inFront = Boolean(front) && count++ % 5 < 3;
    launchFloater(inFront ? front! : back, kind, { front: inFront, left: Math.random() * (kind === "hotair" ? 84 : 92) }, later, onPop);
  };

  for (let i = 0; i < first; i++) later(spawn, i * (kind === "hotair" ? 900 : 450));
  const id = setInterval(() => {
    if (!document.hidden && scrollY < innerHeight) spawn();
  }, kind === "hotair" ? 3600 : 2400);

  return () => {
    clearInterval(id);
    clear();
    back.replaceChildren();
    front?.replaceChildren();
  };
}

/** Cada cuánto sale una tanda después de la portada. */
const SKY_EVERY_MS = 9000;

/**
 * Pasada la portada, cada tanto sale una tanda de pocos elementos sobre toda la
 * invitación (capa fija). En la portada no, que ya tiene los suyos. Cada uno va
 * en su carril del ancho para que no se amontonen; también se tocan.
 */
export function startSky(
  layer: HTMLElement,
  kind: FloaterKind | "balloon",
  colors: string[],
  onPop?: (x: number, y: number) => void
) {
  if (reducedMotion()) return () => {};
  const { later, clear } = timerSet();
  let last = -Infinity;
  // Los globos aerostáticos son grandes: dos por tanda
  const perWave = kind === "hotair" ? 2 : 3;

  function wave() {
    last = Date.now();
    const lane = 100 / perWave;
    // Carriles en orden al azar, para que no siempre salga primero el de la izquierda
    const lanes = [...Array(perWave).keys()].sort(() => Math.random() - 0.5);
    lanes.forEach((l, i) =>
      later(() => {
        const left = l * lane + Math.random() * (lane - 16);
        if (kind === "balloon") {
          const depth = 0.95 + Math.random() * 0.25;
          launchBalloon(layer, { color: pick(colors), depth, left, dur: 10 + Math.random() * 4, front: true }, later, onPop);
        } else {
          const dur = kind === "hotair" ? 15 + Math.random() * 5 : 10 + Math.random() * 4;
          launchFloater(layer, kind, { front: true, left, dur }, later, onPop);
        }
      }, i * 700)
    );
  }

  // La primera tanda sale en cuanto se deja la portada; luego, una cada SKY_EVERY_MS
  const id = setInterval(() => {
    if (!document.hidden && scrollY > innerHeight * 0.85 && Date.now() - last >= SKY_EVERY_MS) wave();
  }, 500);

  return () => {
    clearInterval(id);
    clear();
    layer.replaceChildren();
  };
}

/* ---------------- Música (empieza en el segundo indicado y repite desde ahí) ---------------- */
export function createMusic(src: string, start: number) {
  const audio = new Audio(`${src}#t=${start}`);
  audio.preload = "auto";
  let playing = false;
  let fadeId: ReturnType<typeof setInterval> | undefined;

  const toStart = () => {
    if (audio.currentTime < start) audio.currentTime = start;
  };
  audio.addEventListener("loadedmetadata", toStart);
  audio.addEventListener("playing", toStart);
  audio.addEventListener("ended", () => {
    audio.currentTime = start;
    audio.play();
  });

  function fadeIn() {
    clearInterval(fadeId);
    audio.volume = 0;
    fadeId = setInterval(() => {
      audio.volume = Math.min(0.85, audio.volume + 0.05);
      if (audio.volume >= 0.85) clearInterval(fadeId);
    }, 80);
  }

  return {
    get playing() {
      return playing;
    },
    play() {
      playing = true;
      if (audio.readyState >= 1) toStart();
      return audio
        .play()
        .then(fadeIn)
        .catch(() => {
          playing = false;
        });
    },
    pause() {
      playing = false;
      audio.pause();
    },
    destroy() {
      clearInterval(fadeId);
      audio.pause();
      audio.src = "";
    },
  };
}

/* ---------------- Estrellas del hero (posiciones fijas para que SSR y cliente coincidan) ---------------- */
export function stars(count: number) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, () => ({
    size: 12 + rnd() * 22,
    left: rnd() * 96,
    top: rnd() * 85,
    delay: rnd() * 2.4,
    duration: 1.8 + rnd() * 1.6,
  }));
}
