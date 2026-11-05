"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { BlockKey, InvitationView } from "@/lib/view";
import { calendarStamp } from "@/lib/dates";
import { burstFrom, createConfetti, createMusic, startBalloons, type Fx } from "./effects";
import { Icon, type IconName } from "./icons";
import { Countdown } from "./Countdown";
import { Gallery } from "./Gallery";
import { Rsvp } from "./Rsvp";
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

/** Inclinación leve de cada letra del nombre: juguetón, pero legible */
const ROT = [-3, 2, -2, 3, -2, 1, -3, 2, -1];

export function Invitation({ view, preview = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<ReturnType<typeof createConfetti> | null>(null);
  const musicRef = useRef<ReturnType<typeof createMusic> | null>(null);

  const [opening, setOpening] = useState(false);
  const [started, setStarted] = useState(false);
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

  // Bloquea el scroll mientras la sorpresa está cerrada
  useEffect(() => {
    document.documentElement.classList.toggle("inv-locked", !started);
    return () => document.documentElement.classList.remove("inv-locked");
  }, [started]);

  // Al abrir: globos en la portada
  useEffect(() => {
    if (!started) return;
    return startBalloons(balloonsRef.current!, palette);
  }, [started, palette]);

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

  function openGift(e: React.MouseEvent<HTMLButtonElement>) {
    if (opening) return;
    setOpening(true);
    const m = musicRef.current;
    m?.play().then(() => setPlaying(m.playing));
    burstFrom(fx, e.currentTarget, theme.introStyle === "gift" ? 160 : 220, theme.introStyle === "balloon" ? 0.32 : 0.5);
    setTimeout(() => {
      setStarted(true);
      setTimeout(() => fx.rain(90), 900);
    }, OPEN_DELAY[theme.introStyle]);
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
  // Las secciones con diseño original conservan su franja de color
  const bands = view.blocks.map((b) => (CLASSIC.has(b.key) && b.tone !== "surface" ? b.tone : null));

  return (
    <div ref={rootRef} className={`inv${started ? " is-started" : ""}${showDock ? " has-dock" : ""}`} style={view.style}>
      {preview && !view.published && <div className="preview-flag">Vista previa · borrador sin publicar</div>}

      {/* ===================== Apertura sorpresa ===================== */}
      <div className={`intro${started ? " is-gone" : ""}`} aria-hidden={started}>
        <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
        <div className="intro__inner">
          <p className="intro__kicker">{view.texts.introKicker}</p>
          <Opener view={view} opening={opening} onOpen={openGift} />
          <p className="intro__hint">{view.texts.introHint}</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="confetti" aria-hidden="true" />

      <main>
        {/* ===================== Portada ===================== */}
        <header className="hero" id="inicio">
          <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
          <div className="balloons" ref={balloonsRef} aria-hidden="true" />

          <div className="hero__inner">
            {theme.logoUrl && (
              <div className={`logo-badge logo-badge--${theme.logoStyle} pop`} style={{ "--d": ".1s" } as CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={theme.logoUrl} alt={theme.name} />
              </div>
            )}

            <Title lines={view.nameLines} label={view.fullName} onTap={(x, y) => fx.burst(x, y, 60)} />

            {view.ageText && (
              <p className="age pop" style={{ "--d": ".9s" } as CSSProperties}>
                {view.ageText}
              </p>
            )}

            {view.photoUrl && (
              <div className="portrait pop" style={{ "--d": "1.05s" } as CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={view.photoUrl} alt={view.firstName} />
                {view.age != null && <span className="portrait__age">{view.age}</span>}
              </div>
            )}

            <p className="summary pop" style={{ "--d": "1.2s" } as CSSProperties}>
              {view.shortDate} · {view.time}
            </p>
          </div>
        </header>

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

/* ---------------- Nombre: cada letra cae en su lugar al abrir ---------------- */
function Title({ lines, label, onTap }: { lines: string[]; label: string; onTap: (x: number, y: number) => void }) {
  let n = 0;
  return (
    <h1 className="title" aria-label={label} onClick={(e) => onTap(e.clientX, e.clientY)}>
      {lines.map((word, w) => (
        <span key={w} className="word" aria-hidden="true" style={{ "--len": Math.max(word.length, 5) } as CSSProperties}>
          {[...word].map((ch, c) => {
            const i = n++;
            return (
              <span
                key={c}
                className="ch"
                style={{ "--d": `${0.35 + i * 0.05}s`, "--r": `${ROT[i % ROT.length]}deg` } as CSSProperties}
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
    case "countdown":
      return (
        <>
          <h2 className="heading" data-reveal="up">
            {view.texts.countdownTitle}
          </h2>
          <Countdown target={view.eventAt} doneText={view.texts.countdownDone} />
        </>
      );
    case "details":
      return <Details view={view} decor={view.decor.details.filter((u) => u !== null)} />;
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

/* ---------------- Apertura: regalo, globo o imagen del tema ---------------- */
/** ms entre el toque y la portada: el globo revienta rápido; el regalo se toma su tiempo */
const OPEN_DELAY = { gift: 1100, balloon: 650, image: 800 } as const;

function Opener({
  view,
  opening,
  onOpen,
}: {
  view: InvitationView;
  opening: boolean;
  onOpen: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const { introStyle, introImage } = view.theme;
  const open = opening ? " is-open" : "";

  if (introStyle === "balloon")
    return (
      <button className={`pop-balloon${open}`} onClick={onOpen} aria-label="Reventar el globo y abrir la invitación">
        <svg viewBox="0 0 120 220" aria-hidden="true">
          <defs>
            <radialGradient id="inv-balloon" cx="38%" cy="30%" r="75%">
              <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--balloon) 55%, #fff)" }} />
              <stop offset=".55" style={{ stopColor: "var(--balloon)" }} />
              <stop offset="1" style={{ stopColor: "color-mix(in srgb, var(--balloon) 70%, #000)" }} />
            </radialGradient>
          </defs>
          <path className="pop-balloon__string" d="M60 146 C 48 166, 72 182, 58 218" />
          <g className="pop-balloon__body">
            <path d="M60 4 C 26 4 6 32 6 64 C 6 100 38 132 60 138 C 82 132 114 100 114 64 C 114 32 94 4 60 4 Z" fill="url(#inv-balloon)" />
            <path d="M52 146 L68 146 L60 136 Z" fill="var(--balloon)" />
            <ellipse cx="38" cy="38" rx="11" ry="19" transform="rotate(-25 38 38)" fill="#fff" opacity=".55" />
          </g>
        </svg>
      </button>
    );

  if (introStyle === "image" && introImage)
    return (
      <button className={`pop-image${open}`} onClick={onOpen} aria-label="Abrir invitación">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={introImage} alt="" />
      </button>
    );

  return (
    <button className={`gift${open}`} onClick={onOpen} aria-label="Abrir invitación">
      <span className="gift__lid">
        <span className="gift__bow" />
      </span>
      <span className="gift__box" />
    </button>
  );
}

/* ---------------- Tarjeta del tema, con inclinación leve ---------------- */
function Card({ view }: { view: InvitationView }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(view.theme.cardUrl);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const card = ref.current!;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  }
  function leave() {
    const card = ref.current!;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }

  return (
    <div ref={ref} className={`card${hasImage ? "" : " card--plain"}`} data-reveal onPointerMove={move} onPointerLeave={leave}>
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
        <p className="card__time">A partir de las {view.time}</p>
      </div>
    </div>
  );
}

/* ---------------- Fecha, hora y lugar ---------------- */
/** decor: imágenes del tema; cada una acompaña a una de las tres tarjetas, en zigzag */
function Details({ view, decor }: { view: InvitationView; decor: string[] }) {
  const placeValue = view.venueName || view.address;
  const placeSub = view.venueName ? [view.address, view.area].filter(Boolean).join(", ") : view.area;
  const cards: { tone: string; icon: IconName; label: string; value: string; sub?: string | null }[] = [
    { tone: "primary", icon: "calendar", label: "Fecha", value: view.longDate },
    { tone: "secondary", icon: "clock", label: "Hora", value: `A partir de las ${view.time}` },
    ...(placeValue ? [{ tone: "accent", icon: "pin" as const, label: "Lugar", value: placeValue, sub: placeSub }] : []),
  ];

  function addToCalendar() {
    const start = new Date(view.eventAt);
    const end = new Date(start.getTime() + 5 * 36e5);
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
    <>
      <h2 className="heading" data-reveal="up">
        {view.texts.detailsTitle}
      </h2>
      <div className="details">
        {cards.map((c, i) => {
          const img = decor[i];
          // con imagen se alternan: imagen a la izquierda, luego a la derecha…
          const imgSide = i % 2 === 0 ? "left" : "right";
          return (
            <div key={c.label} className={`detail${img ? ` detail--img detail--img-${imgSide}` : ""}`}>
              {img && (
                <span className="detail__img" data-reveal={imgSide} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" loading="lazy" />
                </span>
              )}
              <article className={`info info--${c.tone}`} data-reveal={img ? (imgSide === "left" ? "right" : "left") : "up"}>
                <span className="info__icon">
                  <Icon name={c.icon} />
                </span>
                <p className="info__label">{c.label}</p>
                <p className="info__value">{c.value}</p>
                {c.sub && <p className="info__sub">{c.sub}</p>}
              </article>
            </div>
          );
        })}
      </div>

      {view.mapEmbed && (
        <div className="map" data-reveal="zoom">
          <iframe src={view.mapEmbed} title="Mapa del lugar" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      )}

      <div className="btn-row" data-reveal="up">
        {view.mapsUrl && (
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
    </>
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
      {show.image_url && (
        <div className={`show-img show-img--${show.image_style ?? "framed"}`} data-reveal="zoom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={show.image_url} alt={show.title || ""} loading="lazy" />
        </div>
      )}
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
