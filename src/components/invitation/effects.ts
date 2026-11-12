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

const pick = (colors: string[]) => colors[(Math.random() * colors.length) | 0];

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

/** Cada cuánto sube una tanda de globos después de la portada, y cuántos trae. */
const SKY_EVERY_MS = 9000;
const SKY_PER_WAVE = 3;

/**
 * Pasada la portada, cada tanto sube una tanda de pocos globos sobre toda la
 * invitación (capa fija). En la portada no, que ya tiene los suyos. Cada globo
 * va en su tercio del ancho para que no se amontonen; también se revientan.
 */
export function startSkyBalloons(layer: HTMLElement, colors: string[], onPop?: (x: number, y: number) => void) {
  if (reducedMotion()) return () => {};
  const { later, clear } = timerSet();
  let last = -Infinity;

  function wave() {
    last = Date.now();
    const lane = 100 / SKY_PER_WAVE;
    // Carriles en orden al azar, para que no siempre suba primero el de la izquierda
    const lanes = [...Array(SKY_PER_WAVE).keys()].sort(() => Math.random() - 0.5);
    lanes.forEach((l, i) =>
      later(() => {
        const depth = 0.95 + Math.random() * 0.25;
        const left = l * lane + Math.random() * (lane - 16);
        launchBalloon(layer, { color: pick(colors), depth, left, dur: 10 + Math.random() * 4, front: true }, later, onPop);
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

/**
 * Elementos que flotan en las portadas religiosas y se pueden tocar:
 *   bubble  burbujas de jabón que suben (bautizo: el agua)
 *   petal   pétalos que caen girando (primera comunión)
 * Algo más de la mitad pasa por delante del contenido.
 */
export type FloaterKind = "bubble" | "petal";

export function startFloaters(
  back: HTMLElement,
  front: HTMLElement | null,
  kind: FloaterKind,
  onPop?: (x: number, y: number) => void
) {
  if (reducedMotion()) return () => {};
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let count = 0;

  function later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  }

  function pop(el: HTMLElement, e: PointerEvent) {
    if (el.classList.contains("is-popping")) return;
    e.stopPropagation();
    el.classList.add("is-popping");
    const r = el.querySelector(".floater__body")!.getBoundingClientRect();
    onPop?.(r.left + r.width / 2, r.top + r.height / 2);
    navigator.vibrate?.(8);
    later(() => el.remove(), 700);
  }

  function spawn() {
    const inFront = Boolean(front) && count++ % 5 < 3;
    const el = document.createElement("div");
    el.className = `floater floater--${kind}${inFront ? " floater--front" : ""}`;
    const bubble = kind === "bubble";
    // Los de adelante, más grandes y un poco más rápidos
    const size = bubble ? (inFront ? 46 + Math.random() * 34 : 22 + Math.random() * 22) : inFront ? 20 + Math.random() * 10 : 13 + Math.random() * 7;
    const dur = (bubble ? 11 : 13) + Math.random() * 6 - (inFront ? 2 : 0);
    el.style.left = `${Math.random() * 92}%`;
    el.style.setProperty("--w", `${Math.round(size)}px`);
    el.style.setProperty("--sway", `${(Math.random() * 2 + 2.4).toFixed(1)}s`);
    el.style.setProperty("--tone", Math.random() < 0.5 ? "var(--c-highlight)" : "var(--c-accent)");
    el.style.animationDuration = `${dur.toFixed(1)}s`;
    el.innerHTML = '<span class="floater__body"></span>';
    el.addEventListener("pointerdown", (e) => pop(el, e));
    (inFront ? front! : back).appendChild(el);
    later(() => el.remove(), dur * 1000 + 500);
  }

  for (let i = 0; i < 5; i++) later(spawn, i * 450);
  const id = setInterval(() => {
    if (!document.hidden && scrollY < innerHeight) spawn();
  }, 2400);

  return () => {
    clearInterval(id);
    timers.forEach(clearTimeout);
    back.replaceChildren();
    front?.replaceChildren();
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
