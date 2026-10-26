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
export function startBalloons(box: HTMLElement, colors: string[]) {
  if (reducedMotion()) return () => {};
  const timers = new Set<ReturnType<typeof setTimeout>>();

  function spawn() {
    const c = colors[(Math.random() * colors.length) | 0];
    const b = document.createElement("div");
    b.className = "balloon";
    const dur = 13 + Math.random() * 7;
    Object.assign(b.style, {
      left: `${Math.random() * 90}%`,
      width: `${40 + Math.random() * 26}px`,
      animationDuration: `${dur}s`,
    });
    b.innerHTML = `<svg viewBox="0 0 60 110" aria-hidden="true">
      <path d="M30 62 C30 80 22 88 30 108" stroke="#8a6a4a" stroke-width="1.5" fill="none"/>
      <ellipse cx="30" cy="30" rx="24" ry="29" fill="${c}"/>
      <path d="M26 58 L34 58 L30 64 Z" fill="${c}"/>
      <ellipse cx="21" cy="19" rx="5" ry="9" fill="#fff" opacity=".45" transform="rotate(-20 21 19)"/>
    </svg>`;
    box.appendChild(b);
    const t = setTimeout(() => {
      b.remove();
      timers.delete(t);
    }, dur * 1000);
    timers.add(t);
  }

  for (let i = 0; i < 4; i++) {
    const t = setTimeout(spawn, i * 500);
    timers.add(t);
  }
  const id = setInterval(() => {
    if (!document.hidden && scrollY < innerHeight) spawn();
  }, 3000);

  return () => {
    clearInterval(id);
    timers.forEach(clearTimeout);
    box.replaceChildren();
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
