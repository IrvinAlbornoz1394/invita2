"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import type { BlockKey, InvitationView } from "@/lib/view";
import { calendarStamp } from "@/lib/dates";
import { burstFrom, createConfetti, createMusic, reducedMotion, startBalloons, stars, type Fx } from "./effects";
import { Icon, type IconName } from "./icons";
import { Countdown } from "./Countdown";
import { Gallery } from "./Gallery";
import { Rsvp } from "./Rsvp";
import { Opener, OPENERS } from "./Openers";
import { startMapFx } from "./mapfx";
import { Logo } from "@/components/brand/icons";
import { PartyScene, type PartySceneClasses } from "@/components/brand/PartyScene";
import "./invitation.css";

const SCENE_CLASSES: PartySceneClasses = {
  scene: "credit__scene",
  strings: "credit__strings",
  popA: "credit__pop-a",
  popB: "credit__pop-b",
  flame: "credit__flame",
  dotA: "credit__dot-a",
  dotB: "credit__dot-b",
  ribbon: "credit__ribbon",
};

type Props = { view: InvitationView; preview?: boolean };

/** Secciones que conservan el diseño original (pedido del cliente) */
const CLASSIC = new Set<BlockKey>(["countdown", "details", "show", "extras", "rsvp"]);

/** Esferas brillantes que flotan en la portada a distintas profundidades (fijas: SSR y cliente coinciden) */
const ORBS = stars(7).map((o, i) => ({ ...o, tone: ["primary", "secondary", "highlight", "accent"][i % 4], depth: 0.5 + (i % 3) * 0.3 }));

/** Inclinación leve de cada letra del nombre: juguetón, pero legible */
const ROT = [-3, 2, -2, 3, -2, 1, -3, 2, -1];

export function Invitation({ view, preview = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<HTMLDivElement>(null);
  const balloonsFrontRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<ReturnType<typeof createConfetti> | null>(null);
  const musicRef = useRef<ReturnType<typeof createMusic> | null>(null);

  const [opening, setOpening] = useState(false);
  const [zooming, setZooming] = useState(false);
  const [started, setStarted] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);

  const { colors, theme } = view;
  const palette = useMemo(
    () => [colors.primary, colors.secondary, colors.highlight, colors.accent, "#ffffff"],
    [colors]
  );

  const fx = useMemo<Fx>(
    () => ({
      burst: (x, y, n) => confettiRef.current?.burst(x, y, n),
      rain: (n) => confettiRef.current?.rain(n),
    }),
    []
  );

  const say = useCallback((text: string) => setToast({ text, id: Date.now() }), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  // Confeti
  useEffect(() => {
    const c = createConfetti(canvasRef.current!, palette);
    confettiRef.current = c;
    return () => c.destroy();
  }, [palette]);

  // Música: se pausa al salir de la pestaña y se reanuda al volver
  useEffect(() => {
    if (!theme.musicUrl) return;
    const m = createMusic(theme.musicUrl, theme.musicStart);
    musicRef.current = m;
    let resume = false;
    const onVisibility = () => {
      if (document.hidden) {
        resume = m.playing;
        if (resume) m.pause();
      } else if (resume) m.play().then(() => setPlaying(m.playing));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      m.destroy();
      musicRef.current = null;
    };
  }, [theme.musicUrl, theme.musicStart]);

  // Bloquea el scroll mientras la apertura está en pantalla
  useEffect(() => {
    document.documentElement.classList.toggle("inv-locked", !introGone);
    return () => document.documentElement.classList.remove("inv-locked");
  }, [introGone]);

  // El mapa de «fecha y lugar» se acerca apenas mientras la información pasa encima
  useEffect(() => startMapFx(rootRef.current!), []);

  // Al abrir: globos en la portada
  // (los eventos religiosos tienen su propia portada, sin globos)
  useEffect(() => {
    if (!started || !balloonsRef.current) return;
    return startBalloons(balloonsRef.current, balloonsFrontRef.current, palette, (x, y) => fx.burst(x, y, 36));
  }, [started, palette, fx]);

  // Entradas al hacer scroll
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
    );
    rootRef.current!.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function openIntro(e: React.MouseEvent<HTMLButtonElement>) {
    if (opening) return;
    setOpening(true);
    const m = musicRef.current;
    m?.play().then(() => setPlaying(m.playing));

    const style = theme.introStyle;
    const t = OPENERS[style];
    const target = (e.currentTarget.querySelector(".opener-target") as HTMLElement | null) ?? e.currentTarget;
    const r = target.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const burst = () =>
      style === "curtain" ? fx.rain(140) : fx.burst(cx, cy, style === "balloon" ? 240 : 170);
    setTimeout(burst, t.confetti);

    // Acercamiento a la página del libro o a la carta: se mide dónde quedó
    if (t.zoom != null) {
      setTimeout(() => {
        const root = rootRef.current!;
        const page = root.querySelector<HTMLElement>(style === "book" ? ".book__first" : ".env3d__letter");
        const intro = root.querySelector<HTMLElement>(".intro")!;
        const inner = root.querySelector<HTMLElement>(".intro__inner") ?? intro;
        const pr = page?.getBoundingClientRect();
        const ir = inner.getBoundingClientRect();
        // la carta asoma solo por arriba del sobre: se entra por su parte visible
        const fy = style === "envelope" ? 0.28 : 0.5;
        const px = pr ? pr.left + pr.width / 2 : cx;
        const py = pr ? pr.top + pr.height * fy : cy;
        // transform-origin es relativo a la caja que se escala, no a la pantalla
        intro.style.setProperty("--zx", `${px - ir.left}px`);
        intro.style.setProperty("--zy", `${py - ir.top}px`);
        // y además se lleva el objetivo al centro: así la cámara entra derecho a la hoja
        intro.style.setProperty("--zdx", `${innerWidth / 2 - px}px`);
        intro.style.setProperty("--zdy", `${innerHeight / 2 - py}px`);
        // la escala justa para que la hoja (no el objeto entero) llene la pantalla
        const visibleH = pr ? (style === "envelope" ? pr.height * 0.56 : pr.height) : 100;
        const fill = pr ? Math.max(innerWidth / pr.width, innerHeight / visibleH) * 1.15 : 9;
        intro.style.setProperty("--zs", String(Math.min(14, Math.max(3, fill))));
        setZooming(true);
      }, reducedMotion() ? 0 : t.zoom);
    }

    if (t.iris) {
      setTimeout(() => reveal(cx, cy), t.start);
    } else {
      setTimeout(() => setStarted(true), reducedMotion() ? 0 : t.start);
      setTimeout(() => setIntroGone(true), reducedMotion() ? 0 : t.gone);
    }
    setTimeout(() => fx.rain(90), Math.max(t.start, t.gone) + 900);
  }

  /** La portada aparece en un círculo que crece desde el objeto (View Transitions; sin soporte, fundido) */
  function reveal(x: number, y: number) {
    const html = document.documentElement;
    const show = () => {
      setStarted(true);
      setIntroGone(true);
    };
    if (!document.startViewTransition || reducedMotion()) {
      show();
      return;
    }
    html.style.setProperty("--iris-x", `${x}px`);
    html.style.setProperty("--iris-y", `${y}px`);
    html.classList.add("inv-iris");
    const vt = document.startViewTransition(() => flushSync(show));
    vt.finished.finally(() => html.classList.remove("inv-iris"));
  }

  function toggleMusic() {
    const m = musicRef.current;
    if (!m) return;
    if (m.playing) {
      m.pause();
      setPlaying(false);
    } else m.play().then(() => setPlaying(m.playing));
  }

  const showDock = started && Boolean(theme.musicUrl);
  const style = theme.introStyle;
  const curtain = style === "curtain";
  const openerContent = {
    name: view.firstName,
    label: `Mi ${view.eventLabel}`,
    logo: theme.logoUrl,
    art: theme.cardUrl || theme.logoUrl,
    image: theme.introImage,
    invited: view.texts.heroPill,
  };
  // Las secciones con diseño original conservan su franja de color
  const bands = view.blocks.map((b) => (CLASSIC.has(b.key) && b.tone !== "surface" ? b.tone : null));

  return (
    <div
      ref={rootRef}
      className={`inv inv--${theme.fontKind} inv--${view.eventType}${view.elegant ? " inv--elegant" : ""}${started ? " is-started" : ""}${showDock ? " has-dock" : ""}`}
      style={view.style}
    >
      {preview && !view.published && <div className="preview-flag">Vista previa · borrador sin publicar</div>}

      {/* ===================== Apertura (se elige en el tema) ===================== */}
      <div
        className={`intro intro--${style}${opening ? " is-opening" : ""}${zooming ? " is-zooming" : ""}${introGone ? " is-gone" : ""}`}
        aria-hidden={introGone}
      >
        {!curtain && <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />}
        {curtain ? (
          <button className="intro__curtain" onClick={openIntro} aria-label="Abrir el telón y ver la invitación">
            <Opener style={style} open={opening} c={openerContent} />
            <span className="intro__plaque">
              <span className="intro__kicker">{view.texts.introKicker}</span>
              <span className="intro__hint">{view.texts.introHint}</span>
            </span>
          </button>
        ) : (
          <div className="intro__inner">
            <p className="intro__kicker">{view.texts.introKicker}</p>
            <button className="opener" onClick={openIntro} aria-label="Abrir la invitación">
              <span className="opener-target">
                <Opener style={style} open={opening} c={openerContent} />
              </span>
            </button>
            <p className="intro__hint">{view.texts.introHint}</p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
      {started && <div className="progress" aria-hidden="true" />}

      <main>
        {/* ===================== Portada ===================== */}
        {view.elegant ? (
          <SacredHero view={view} />
        ) : (
          <header className="hero" id="inicio">
            <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
            <div className="hero__glow" aria-hidden="true" />
            <div className="orbs" aria-hidden="true">
              {ORBS.map((o, i) => (
                <span
                  key={i}
                  className={`orb orb--${o.tone}`}
                  style={
                    {
                      left: `${o.left}%`,
                      top: `${o.top}%`,
                      "--s": `${Math.round(o.size * 1.6 * o.depth)}px`,
                      "--z": o.depth,
                      "--d": `${o.delay}s`,
                      "--t": `${o.duration * 2.4}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="balloons" ref={balloonsRef} aria-hidden="true" />

            <div className="hero__inner">
              {theme.logoUrl && (
                <div className={`logo-badge logo-badge--${theme.logoStyle} pop`} style={{ "--d": ".1s" } as CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={theme.logoUrl} alt={theme.name} />
                </div>
              )}

              <Title
                lines={view.nameLines}
                label={view.fullName}
                whole={theme.fontKind === "script"}
              />

              {view.ageText && (
                <p className="age pop" style={{ "--d": ".9s" } as CSSProperties}>
                  {view.ageText}
                </p>
              )}

              {view.photoUrl && (
                <Portrait url={view.photoUrl} alt={view.firstName} age={view.age} />
              )}

              <p className="summary pop" style={{ "--d": "1.2s" } as CSSProperties}>
                {view.shortDate} · {view.time}
              </p>
            </div>
            {/* Algunos globos pasan por delante del nombre y la foto */}
            <div className="balloons balloons--front" ref={balloonsFrontRef} aria-hidden="true" />
          </header>
        )}

        {/* ===================== Hoja con el contenido ===================== */}
        <div className="sheet">
          <span className="sheet__grip" aria-hidden="true" />

          {view.blocks.map(({ key }, i) => {
            const band = bands[i];
            const prev = i > 0 ? bands[i - 1] : null;
            // Borde festoneado arriba cuando cambia el color respecto a la sección anterior
            const edge = band || prev ? `var(--tone-${prev ?? "sheet"})` : null;
            return (
              <section
                key={key}
                id={key}
                className={`section section--${key}${CLASSIC.has(key) ? " classic" : ""}${band ? ` band tone-${band}` : ""}${edge ? " has-edge" : ""}`}
                style={edge ? ({ "--prev": edge } as CSSProperties) : undefined}
              >
                <Block name={key} view={view} fx={fx} say={say} />
              </section>
            );
          })}

          <footer
            className={`footer${bands.at(-1) ? " has-edge" : ""}`}
            style={bands.at(-1) ? ({ "--prev": `var(--tone-${bands.at(-1)})` } as CSSProperties) : undefined}
          >
            <p className="footer__name">{view.fullName}</p>
            <p className="footer__text">{view.texts.footer}</p>
            <a className="footer__top" href="#inicio">
              Volver al inicio
            </a>
            <Credit kid={view.fullName} />
          </footer>
        </div>
      </main>

      {/* ===================== Barra inferior ===================== */}
      {showDock && (
        <nav className="dock" aria-label="Música">
          {theme.musicUrl && (
            <button
              type="button"
              className={`dock__music${playing ? " is-playing" : ""}`}
              onClick={toggleMusic}
              aria-label={playing ? "Pausar música" : "Reproducir música"}
              aria-pressed={playing}
            >
              <Icon name="music" />
              <span className="dock__eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          )}
        </nav>
      )}

      <div className={`toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
        {toast?.text}
      </div>
    </div>
  );
}

/* ======================================================================
   Portadas de bautizo y primera comunión: cada una con su propia escena
   ====================================================================== */

/** Destellos fijos (SSR y cliente coinciden) */
const GLINTS = stars(9).map((g, i) => ({ ...g, depth: 0.5 + (i % 3) * 0.25 }));

function SacredHero({ view }: { view: InvitationView }) {
  const { theme } = view;
  const communion = view.eventType === "primera_comunion";
  return (
    <header className={`hero hero--sacred hero--${view.eventType}`} id="inicio">
      <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />
      {communion ? <span className="sacred__rays" aria-hidden="true" /> : <Clouds />}
      <div className="glints" aria-hidden="true">
        {GLINTS.map((g, i) => (
          <span
            key={i}
            className={communion ? "glint glint--star" : "glint glint--bokeh"}
            style={
              {
                left: `${g.left}%`,
                top: `${g.top}%`,
                "--s": `${Math.round(g.size * (communion ? 0.7 : 2.2) * g.depth)}px`,
                "--d": `${g.delay}s`,
                "--t": `${g.duration * 2}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="hero__inner sacred">
        {theme.logoUrl ? (
          <div className={`sacred__logo sacred__logo--${theme.logoStyle} pop`} style={{ "--d": ".1s" } as CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={theme.logoUrl} alt={theme.name} />
          </div>
        ) : (
          communion && <Chalice />
        )}

        {view.ageText && (
          <p className="sacred__kicker pop" style={{ "--d": ".25s" } as CSSProperties}>
            {view.ageText}
          </p>
        )}

        <Title lines={view.nameLines} label={view.fullName} whole={theme.fontKind === "script"} calm />

        <span className="sacred__rule pop" style={{ "--d": ".9s" } as CSSProperties} aria-hidden="true">
          <i />
          <b />
          <i />
        </span>

        {view.photoUrl && (
          <div className={`sacred__photo sacred__photo--${view.eventType} pop`} style={{ "--d": "1.05s" } as CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={view.photoUrl} alt={view.firstName} />
          </div>
        )}

        <p className="sacred__date pop" style={{ "--d": "1.2s" } as CSSProperties}>
          <span>{view.longDate}</span>
          <small>{view.ceremony?.timeLabel ? `Ceremonia · ${view.ceremony.timeLabel}` : view.time}</small>
        </p>
      </div>
    </header>
  );
}

/** Nubes suaves al pie de la portada del bautizo (tres capas que se mecen) */
function Clouds() {
  return (
    <span className="clouds" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <svg key={i} className={`clouds__layer clouds__layer--${i}`} viewBox="0 0 400 80" preserveAspectRatio="none">
          <path d="M0 80V52c18-14 40-16 58-4 10-20 40-26 60-8 14-18 46-20 62 0 16-22 52-22 66 0 14-14 40-14 54 2 16-16 46-14 58 4 14-8 30-6 42 4v30z" />
        </svg>
      ))}
    </span>
  );
}

/** Cáliz con la hostia y rayos (primera comunión sin logo en el tema) */
function Chalice() {
  return (
    <svg className="chalice pop" viewBox="0 -10 64 82" aria-hidden="true" style={{ "--d": ".1s" } as CSSProperties}>
      <g className="chalice__rays">
        {[-60, -30, 0, 30, 60].map((a) => (
          <line key={a} x1="32" y1="4" x2="32" y2="-6" transform={`rotate(${a} 32 18)`} />
        ))}
      </g>
      <circle className="chalice__host" cx="32" cy="18" r="9" />
      <path className="chalice__host-cross" d="M32 13v10M27 18h10" />
      <path className="chalice__cup" d="M14 30h36c0 12-7 20-18 20S14 42 14 30z" />
      <path className="chalice__stem" d="M32 50v10M22 66c0-4 4-6 10-6s10 2 10 6z" />
    </svg>
  );
}

/**
 * Foto del festejado en 3D: se inclina hacia el dedo o el puntero y sus capas
 * se separan en profundidad (halo atrás, filete, foto, brillo y sello al frente).
 * Sin tocarla, se mece apenas. El «pop» de entrada va en el contenedor de
 * afuera para no pisar el transform de la inclinación.
 */
function Portrait({ url, alt, age }: { url: string; alt: string; age: number | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useTilt(ref, 16);
  return (
    <div className="portrait pop" style={{ "--d": "1.05s" } as CSSProperties}>
      <div ref={ref} className="portrait__tilt" {...tilt}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} />
        <span className="portrait__shine" aria-hidden="true" />
        {age != null && <span className="portrait__age">{age}</span>}
      </div>
    </div>
  );
}

/* ---------------- Nombre: cada letra cae en su lugar al abrir ---------------- */
function Title({
  lines,
  label,
  whole,
  calm = false,
}: {
  lines: string[];
  label: string;
  /** Sin inclinación de letras (portadas religiosas) */
  calm?: boolean;
  /** Caligráficas: la palabra entera cae junta para no romper los enlaces entre letras */
  whole: boolean;
}) {
  let n = 0;
  return (
    <h1 className="title" aria-label={label}>
      {lines.map((word, w) => (
        <span key={w} className="word" aria-hidden="true" style={{ "--len": Math.max(word.length, 5) } as CSSProperties}>
          {(whole ? [word] : [...word]).map((ch, c) => {
            const i = n++;
            return (
              <span
                key={c}
                className="ch"
                style={{ "--d": `${0.35 + i * (whole ? 0.18 : 0.05)}s`, "--r": `${whole || calm ? 0 : ROT[i % ROT.length]}deg` } as CSSProperties}
              >
                {ch === " " ? " " : ch}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

/** Título de sección con el estilo nuevo (recuerdos y mensaje). */
function Heading({ text }: { text: string }) {
  return (
    <div className="heading-row" data-reveal>
      <h2 className="heading">{text}</h2>
    </div>
  );
}

/** Imagen del tema que flota en un espacio fijo de la sección. */
function DecorImg({ url, className = "", style }: { url: string | null; className?: string; style?: CSSProperties }) {
  if (!url) return null;
  return (
    <span className={`decor-img ${className}`} style={style} data-reveal="zoom" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" />
    </span>
  );
}

/** WhatsApp de invita2 (solo dígitos con lada, ej. 5219991234567); sin él solo se muestra la marca */
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP?.replace(/\D/g, "") || null;

/** «999 123 4567»: los últimos 10 dígitos, como se lee un número en México */
function phoneLabel(digits: string) {
  const n = digits.slice(-10);
  return n.length === 10 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : digits;
}

/** Logotipo de WhatsApp (relleno), para que el botón se reconozca de un vistazo */
function WhatsAppLogo() {
  return (
    <svg className="credit__logo" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Créditos de invita2: franja de cierre con silueta de fiesta, sin quitarle protagonismo al festejado */
function Credit({ kid }: { kid: string }) {
  const text = `¡Hola! Vi la invitación de ${kid} y quiero una para mi fiesta.`;
  return (
    <div className="credit">
      <PartyScene classes={SCENE_CLASSES} />
      <div className="credit__band">
        <p className="credit__by">Invitación hecha con cariño por</p>
        <a className="credit__brand" href="/" target="_blank" rel="noopener">
          <Logo className="credit__brand-logo" />
        </a>
        <div className="credit__actions">
          {CONTACT && (
            <a
              className="credit__wa"
              href={`https://wa.me/${CONTACT}?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener"
            >
              <WhatsAppLogo />
              <span className="credit__wa-text">
                <small>¿Quieres una? Escríbenos</small>
                <strong>{phoneLabel(CONTACT)}</strong>
              </span>
            </a>
          )}
          <a className="credit__web" href="/" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
            </svg>
            Ver más invitaciones
          </a>
        </div>
      </div>
    </div>
  );
}

type BlockProps = { name: BlockKey; view: InvitationView; fx: Fx; say: (t: string) => void };

function Block({ name, view, fx, say }: BlockProps) {
  switch (name) {
    case "card":
      return <Card view={view} />;
    case "family":
      return <FamilyBlock view={view} />;
    case "countdown":
      return (
        <>
          <h2 className="heading" data-reveal="up">
            {view.texts.countdownTitle}
          </h2>
          <Countdown target={view.startsAt} doneText={view.texts.countdownDone} />
        </>
      );
    case "details":
      return <Details view={view} decor={view.decor.details} />;
    case "show":
      return <ShowBlock view={view} fx={fx} say={say} />;
    case "extras":
      return <Extras view={view} fx={fx} />;
    case "gallery":
      return (
        <>
          <Heading text={view.texts.galleryTitle} />
          <Gallery items={view.gallery} name={view.firstName} />
        </>
      );
    case "message":
      return (
        <>
          <Heading text={view.texts.messageTitle} />
          <div className="panel message" data-reveal>
            {view.message && <p className="message__text">{view.message}</p>}
            {view.theme.groupUrl && (
              <div className="message__group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={view.theme.groupUrl} alt="" loading="lazy" />
              </div>
            )}
            <p className="message__closing">
              <Icon name="heart" />
              {view.texts.messageClosing}
            </p>
          </div>
        </>
      );
    case "rsvp":
      return (
        <>
          <h2 className="heading" data-reveal="up">
            {view.texts.rsvpTitle}
          </h2>
          <Rsvp view={view} fx={fx} />
        </>
      );
  }
}

/* ---------------- Papás y padrinos (bautizo, primera comunión) ---------------- */
function FamilyBlock({ view }: { view: InvitationView }) {
  const { family } = view;
  const groups = [
    { label: "Mis papás", names: family.parents, photo: family.parentsPhoto },
    { label: family.godparents.length === 1 ? "Mi padrino" : "Mis padrinos", names: family.godparents, photo: family.godparentsPhoto },
  ].filter((g) => g.names.length > 0 || g.photo);

  return (
    <>
      <Heading text={view.texts.familyTitle} />
      <div className="family">
        {groups.map((g) => (
          <div key={g.label} className={`panel family__group${g.photo ? " has-photo" : ""}`} data-reveal="up">
            {g.photo && (
              <span className="family__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.photo} alt={g.names.length ? g.names.join(" y ") : g.label} loading="lazy" />
              </span>
            )}
            <p className="family__label">{g.label}</p>
            {g.names.length > 0 && (
              <ul className="family__names">
                {g.names.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- Tarjeta del tema, con inclinación leve ---------------- */
function Card({ view }: { view: InvitationView }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(view.theme.cardUrl);

  const tilt = useTilt(ref, 10);

  return (
    <div ref={ref} className={`card tilt${hasImage ? "" : " card--plain"}`} data-reveal {...tilt}>
      <span className="tilt__glare" aria-hidden="true" />
      <div className="card__art">
        <div className={`sunburst sunburst--${view.theme.bgStyle}`} aria-hidden="true" />
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.theme.cardUrl!} alt="" />
        )}
      </div>
      <div className="card__text">
        <p className="card__kicker">{view.texts.cardKicker}</p>
        <p className="card__name">{view.firstName}</p>
        <p className="card__date">{view.longDate}</p>
        <p className="card__time">
          {view.ceremony?.timeLabel ? `Ceremonia a las ${view.ceremony.timeLabel}` : `A partir de las ${view.time}`}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Fecha, hora y lugar ---------------- */
/** decor: imágenes del tema; cada una acompaña a una de las tres tarjetas, en zigzag */
function Details({ view, decor }: { view: InvitationView; decor: (string | null)[] }) {
  const placeValue = view.venueName || view.address;
  const placeSub = view.venueName ? [view.address, view.area].filter(Boolean).join(", ") : view.area;
  type InfoCard = { tone: string; icon: IconName; label: string; value: string; sub?: string | null; href?: string | null };
  const cer = view.ceremony;
  // Con ceremonia: fecha, ceremonia y recepción (cada una con su hora y su ruta)
  const cards: InfoCard[] = cer
    ? [
        { tone: "primary", icon: "calendar", label: "Fecha", value: view.longDate },
        {
          tone: "secondary",
          icon: "church",
          label: cer.timeLabel ? `Ceremonia · ${cer.timeLabel}` : "Ceremonia",
          value: cer.place,
          sub: cer.address,
          href: cer.mapsUrl,
        },
        {
          tone: "accent",
          icon: "pin",
          label: `Recepción · ${view.time}`,
          value: placeValue || "Por confirmar",
          sub: placeSub,
          href: view.mapsUrl,
        },
      ]
    : [
        { tone: "primary", icon: "calendar", label: "Fecha", value: view.longDate },
        { tone: "secondary", icon: "clock", label: "Hora", value: `A partir de las ${view.time}` },
        ...(placeValue ? [{ tone: "accent", icon: "pin" as const, label: "Lugar", value: placeValue, sub: placeSub }] : []),
      ];

  function addToCalendar() {
    const start = new Date(view.startsAt);
    const end = new Date(new Date(view.eventAt).getTime() + 5 * 36e5);
    const title = `${view.eventLabel.charAt(0).toUpperCase()}${view.eventLabel.slice(1)} de ${view.fullName}`;
    const apple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);

    if (!apple) {
      window.open(
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
          `&text=${encodeURIComponent(title)}&dates=${calendarStamp(start)}/${calendarStamp(end)}` +
          `&location=${encodeURIComponent(view.place)}`,
        "_blank"
      );
      return;
    }
    const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion//ES", "BEGIN:VEVENT",
      `UID:${view.slug}@invitacion`, `DTSTAMP:${calendarStamp(new Date())}`,
      `DTSTART:${calendarStamp(start)}`, `DTEND:${calendarStamp(end)}`,
      `SUMMARY:${esc(title)}`, `LOCATION:${esc(view.place)}`,
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(title)}`, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${view.slug}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className={`place${view.mapEmbed ? "" : " place--nomap"}${cer ? " place--ceremony" : ""}`}>
      {/* El mapa ocupa la pantalla y se queda fijo; la información pasa encima */}
      <div className="place__map" data-l="map">
        {view.mapEmbed ? (
          <iframe src={view.mapEmbed} title="Mapa del lugar" loading="lazy" referrerPolicy="no-referrer-when-downgrade" tabIndex={-1} />
        ) : (
          <div className={`sunburst sunburst--${view.theme.bgStyle}`} aria-hidden="true" />
        )}
        <span className="place__veil" aria-hidden="true" />
        {view.mapEmbed && (
          <span className="place__pin" aria-hidden="true">
            <span className="place__pin-head">
              <Icon name="pin" />
            </span>
            <span className="place__pin-pulse" />
          </span>
        )}
      </div>

      <div className="place__content">
        <h2 className="heading place__title" data-reveal="up">
          {view.texts.detailsTitle}
        </h2>

        <div className="place__cards">
          {cards.map((c, i) => (
            <article key={c.label} className={`glass glass--${c.tone}`} data-reveal={i % 2 ? "right" : "left"}>
              {decor[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={`glass__decor glass__decor--${i % 2 ? "left" : "right"}`} src={decor[i]} alt="" loading="lazy" />
              )}
              <span className="glass__icon">
                <Icon name={c.icon} />
              </span>
              <span className="glass__txt">
                <small>{c.label}</small>
                <strong>{c.value}</strong>
                {c.sub && <em>{c.sub}</em>}
                {c.href && (
                  <a className="glass__link" href={c.href} target="_blank" rel="noopener">
                    <Icon name="navigate" />
                    Cómo llegar
                  </a>
                )}
              </span>
            </article>
          ))}
        </div>

        {/* Acciones fijas al pie mientras el mapa está en pantalla */}
        <div className="place__actions">
          {view.mapsUrl && !cer && (
            <a className="btn btn--primary" href={view.mapsUrl} target="_blank" rel="noopener">
              <Icon name="navigate" />
              Cómo llegar
            </a>
          )}
          <button className="btn btn--secondary" type="button" onClick={addToCalendar}>
            <Icon name="calendarAdd" />
            Agendar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Inclinación 3D con brillo ---------------- */
/**
 * Inclina el elemento hacia el puntero y mueve un brillo encima. Con el dedo
 * también responde mientras se arrastra, y al soltar vuelve a su lugar.
 * Escribe el transform directo en el elemento (no variables heredadas).
 */
function useTilt(ref: React.RefObject<HTMLElement | null>, max = 8) {
  const frame = useRef(0);
  function set(e: React.PointerEvent) {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.classList.add("is-tilting");
      el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) scale(1.02)`;
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
    });
  }
  function reset() {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.classList.remove("is-tilting");
    el.style.transform = "";
  }
  return { onPointerMove: set, onPointerDown: set, onPointerLeave: reset, onPointerUp: reset, onPointerCancel: reset };
}

function ShowImage({ url, alt, framed }: { url: string; alt: string; framed: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useTilt(ref, 12);
  return (
    <div ref={ref} className={`show-img show-img--${framed ? "framed" : "plain"}${framed ? " tilt" : ""}`} data-reveal="zoom" {...tilt}>
      {framed && <span className="tilt__glare" aria-hidden="true" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} loading="lazy" />
    </div>
  );
}

/* ---------------- Show ---------------- */
function ShowBlock({ view, fx, say }: { view: InvitationView; fx: Fx; say: (t: string) => void }) {
  const { show } = view;

  function jump(e: React.MouseEvent<HTMLButtonElement>, name: string) {
    const b = e.currentTarget;
    b.classList.remove("is-jumping");
    void b.offsetWidth;
    b.classList.add("is-jumping");
    burstFrom(fx, b, 24);
    say(name ? `¡${name} te espera en el show!` : "¡Nos vemos en el show!");
  }

  return (
    <>
      <h2 className="heading" data-reveal="up">
        {view.texts.showTitle}
      </h2>
      {show.timeLabel && (
        <p className="show-time" data-reveal="zoom">
          <Icon name="clock" />
          <span className="show-time__txt">
            <small>Show programado a las</small>
            <strong>{show.timeLabel}</strong>
          </span>
        </p>
      )}
      {show.image_url && <ShowImage url={show.image_url} alt={show.title || ""} framed={(show.image_style ?? "framed") === "framed"} />}
      {show.title && (
        <p className="show-name" data-reveal="up">
          {show.title}
        </p>
      )}
      {show.description && (
        <p className="lead" data-reveal="up">
          {show.description}
        </p>
      )}
      {show.image_url && show.performers.length > 0 && (
        <div className={`performers performers--${Math.min(show.performers.length, 4)}`}>
          {show.performers.map((p, i) => (
            <button
              key={i}
              type="button"
              className="performer"
              data-reveal="zoom"
              style={{ "--i": i, "--rd": `${i * 0.08}s` } as CSSProperties}
              onClick={(e) => jump(e, p.name)}
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" loading="lazy" />
              ) : (
                <span className="performer__blank">
                  <Icon name="star" />
                </span>
              )}
              {p.name && <span className="performer__name">{p.name}</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------- Extras (miniferia, brincolines, mesa de dulces…) ---------------- */
function Extras({ view, fx }: { view: InvitationView; fx: Fx }) {
  function wiggle(e: React.MouseEvent<HTMLButtonElement>) {
    const b = e.currentTarget;
    b.classList.remove("is-wiggling");
    void b.offsetWidth;
    b.classList.add("is-wiggling");
    burstFrom(fx, b, 18, 0.35);
  }

  // El mismo ancho para la imagen de arriba y la de abajo
  const width = { "--w": view.decor.extras_top_width / 100 } as CSSProperties;

  return (
    <>
      <h2 className="heading" data-reveal="up">
        {view.texts.extrasTitle}
      </h2>
      <DecorImg url={view.decor.extras[0]} className="decor-img--wide" style={width} />
      <ul className="extras">
        {view.extras.map((x, i) => (
          <li key={i} data-reveal="zoom" style={{ "--rd": `${(i % 6) * 0.06}s` } as CSSProperties}>
            <button type="button" className={`extra extra--${i % 4}`} onClick={wiggle}>
              <span className="extra__emoji" aria-hidden="true">
                {x.emoji || "✨"}
              </span>
              <span className="extra__label">{x.label}</span>
              {x.note && <span className="extra__note">{x.note}</span>}
            </button>
          </li>
        ))}
      </ul>
      <DecorImg url={view.decor.extras[1]} className="decor-img--wide decor-img--bottom" style={width} />
    </>
  );
}
