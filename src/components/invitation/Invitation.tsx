"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BlockKey, InvitationView, Tone } from "@/lib/view";
import { calendarStamp } from "@/lib/dates";
import { burstFrom, createConfetti, createMusic, startBalloons, stars, type Fx } from "./effects";
import { Icon, type IconName } from "./icons";
import { Countdown } from "./Countdown";
import { Gallery } from "./Gallery";
import { Rsvp } from "./Rsvp";
import "./invitation.css";

type Props = { view: InvitationView; preview?: boolean };

const ROT = [-7, 5, -4, 6, -5, 3, -6, 4, -3];
const LIFT = [0, -0.05, 0.03, -0.04, 0.02, -0.06, 0.03, -0.02, 0.04];
const STARS = stars(16);

export function Invitation({ view, preview = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<ReturnType<typeof createConfetti> | null>(null);
  const musicRef = useRef<ReturnType<typeof createMusic> | null>(null);

  const [opening, setOpening] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [away, setAway] = useState(false);
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);

  const { colors, theme } = view;
  const palette = useMemo(
    () => [colors.primary, colors.secondary, colors.highlight, colors.accent, "#ffffff", "#ff6fa5"],
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

  // Bloquea el scroll mientras el regalo está cerrado
  useEffect(() => {
    document.documentElement.classList.toggle("inv-locked", !started);
    return () => document.documentElement.classList.remove("inv-locked");
  }, [started]);

  // Al abrir: globos y botón para bajar
  useEffect(() => {
    if (!started) return;
    const stop = startBalloons(balloonsRef.current!, palette);
    const onScroll = () => setAway(scrollY > 60);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      stop();
      removeEventListener("scroll", onScroll);
    };
  }, [started, palette]);

  // Animaciones al hacer scroll
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -30px 0px" }
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

  const lastTone = view.blocks.at(-1)?.tone ?? "surface";

  return (
    <div ref={rootRef} className={`inv${started ? " is-started" : ""}`} style={view.style}>
      {preview && !view.published && <div className="preview-flag">Vista previa · borrador sin publicar</div>}

      {/* ===================== Intro: regalo sorpresa ===================== */}
      <div className={`intro${started ? " is-gone" : ""}`} aria-hidden={started}>
        <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
        <div className="intro__inner">
          <p className="intro__kicker">{view.texts.introKicker}</p>
          <Opener view={view} opening={opening} onOpen={openGift} />
          <p className="intro__hint">{view.texts.introHint}</p>
        </div>
      </div>

      <canvas ref={canvasRef} className="confetti" aria-hidden="true" />

      {started && theme.musicUrl && (
        <button
          className={`music${playing ? " is-playing" : ""}`}
          onClick={toggleMusic}
          aria-label={playing ? "Pausar música" : "Reproducir música"}
          aria-pressed={playing}
        >
          <Icon name="music" />
          <span className="music__eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>
      )}

      {started && view.blocks.length > 0 && (
        <a className={`scroll-cue${away ? " is-away" : ""}`} href={`#${view.blocks[0].key}`} aria-label="Ver más">
          <Icon name="down" />
        </a>
      )}

      <main>
        {/* ===================== Portada ===================== */}
        <header className="hero" id="inicio">
          <div className={`sunburst sunburst--${theme.bgStyle}`} aria-hidden="true" />
          <div className="stars" aria-hidden="true">
            {STARS.map((s, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                className="star"
                style={{
                  width: s.size,
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  animationDelay: `${s.delay}s`,
                  animationDuration: `${s.duration}s`,
                }}
              >
                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6z" />
              </svg>
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

            <p className="pill pop" style={{ "--d": ".3s" } as CSSProperties}>
              {view.texts.heroPill}
            </p>

            {view.ageText && (
              <div className="ribbon pop" style={{ "--d": ".5s" } as CSSProperties}>
                <span>{view.ageText}</span>
              </div>
            )}

            <Title lines={view.nameLines} label={view.fullName} onTap={(x, y) => fx.burst(x, y, 60)} />

            {view.photoUrl && (
              <div className="portrait pop" style={{ "--d": "1.3s" } as CSSProperties}>
                <div className="portrait__ring" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={view.photoUrl} alt={view.firstName} />
                {view.age != null && <span className="portrait__age">{view.age}</span>}
              </div>
            )}

            <p className="date-chip pop" style={{ "--d": "1.6s" } as CSSProperties}>
              {view.shortDate} · {view.time}
            </p>
          </div>

          <svg className="cloud-edge" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120V60c60-40 140-40 200 0 50-50 150-55 210-5 60-55 170-55 230 0 55-45 150-45 210 0 60-50 160-50 220 0 60-45 140-45 200 5 50-40 120-40 170 0V120z" />
          </svg>
        </header>

        {view.blocks.map(({ key, tone, prev }) => (
          <Section key={key} id={key} tone={tone} prev={prev}>
            <Block name={key} view={view} fx={fx} say={say} />
          </Section>
        ))}

        <footer className="footer" style={{ "--prev": `var(--tone-${lastTone})` } as CSSProperties}>
          <svg className="cloud-edge cloud-edge--top" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 0v60c60 40 140 40 200 0 50 50 150 55 210 5 60 55 170 55 230 0 55 45 150 45 210 0 60 50 160 50 220 0 60 45 140 45 200-5 50 40 120 40 170 0V0z" />
          </svg>
          <p className="footer__name">{view.fullName}</p>
          <p>{view.texts.footer}</p>
          <a className="btn btn--ghost" href="#inicio">
            Volver al inicio
          </a>
        </footer>
      </main>

      <div className={`toast${toast ? " is-on" : ""}`} role="status" aria-live="polite">
        {toast?.text}
      </div>
    </div>
  );
}

/* ---------------- Título: cada letra con giro y altura distintos ---------------- */
function Title({ lines, label, onTap }: { lines: string[]; label: string; onTap: (x: number, y: number) => void }) {
  let n = 0;
  return (
    <h1 className="title" aria-label={label} onClick={(e) => onTap(e.clientX, e.clientY)}>
      {lines.map((word, w) => (
        <span key={w} className="word" aria-hidden="true" style={{ "--len": Math.max(word.length, 5) } as CSSProperties}>
          {[...word].map((ch, c) => {
            const i = n++;
            return (
              <span key={c} className="ch" style={{ "--d": `${0.7 + i * 0.07}s` } as CSSProperties}>
                <span
                  className="ch__in"
                  data-ch={ch}
                  style={{ "--r": `${ROT[i % ROT.length]}deg`, "--y": `${LIFT[i % LIFT.length]}em`, "--i": i } as CSSProperties}
                >
                  {ch === " " ? " " : ch}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function Section({ id, tone, prev, children }: { id: string; tone: Tone; prev: Tone | null; children: ReactNode }) {
  return (
    <section
      id={id}
      className={`section tone-${tone}${prev ? " has-prev" : ""}`}
      style={prev ? ({ "--prev": `var(--tone-${prev})` } as CSSProperties) : undefined}
    >
      {children}
    </section>
  );
}

/** Imagen del tema que flota en un espacio fijo de la sección. */
function DecorImg({ url, className = "" }: { url: string | null; className?: string }) {
  if (!url) return null;
  return (
    <span className={`decor-img ${className}`} data-reveal="zoom" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" />
    </span>
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
          <DecorImg url={view.decor.gallery[0]} className="decor-img--top" />
          <h2 className="heading" data-reveal="up">
            {view.texts.galleryTitle}
          </h2>
          <Gallery items={view.gallery} name={view.firstName} />
        </>
      );
    case "message":
      return (
        <>
          <h2 className="heading" data-reveal="up">
            {view.texts.messageTitle}
          </h2>
          {view.message && (
            <p className="lead lead--big" data-reveal="up">
              {view.message}
            </p>
          )}
          {view.theme.groupUrl && (
            <div className="group" data-reveal="zoom">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={view.theme.groupUrl} alt="" loading="lazy" />
            </div>
          )}
          <p className="love" data-reveal="zoom">
            <Icon name="heart" />
            {view.texts.messageClosing}
          </p>
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

/* ---------------- Tarjeta con inclinación 3D ---------------- */
function Card({ view }: { view: InvitationView }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasImage = Boolean(view.theme.cardUrl);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const card = ref.current!;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    card.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
  }
  function leave() {
    const card = ref.current!;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "30%");
  }

  return (
    <div
      ref={ref}
      className={`card3d${hasImage ? "" : " card3d--plain"}`}
      data-reveal="zoom"
      onPointerMove={move}
      onPointerLeave={leave}
    >
      <div className="card3d__art">
        <div className={`sunburst sunburst--${view.theme.bgStyle}`} aria-hidden="true" />
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view.theme.cardUrl!} alt="" />
        )}
      </div>
      <div className="card3d__text">
        <p className="card3d__kicker">{view.texts.cardKicker}</p>
        <p className="card3d__name">{view.firstName}</p>
        <p className="card3d__date">{view.longDate}</p>
        <p className="card3d__time">A partir de las {view.time}</p>
      </div>
      <span className="card3d__shine" aria-hidden="true" />
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
      {show.performers.length > 0 && (
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

  return (
    <>
      <h2 className="heading" data-reveal="up">
        {view.texts.extrasTitle}
      </h2>
      <DecorImg url={view.decor.extras[0]} className="decor-img--wide" />
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
      <DecorImg url={view.decor.extras[1]} className="decor-img--wide decor-img--bottom" />
    </>
  );
}
