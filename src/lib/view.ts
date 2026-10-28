import type { CSSProperties } from "react";
import { DECOR_SECTIONS, DEFAULT_COLORS, DEFAULT_SECTIONS, DEFAULT_TEXTS, INTRO_STYLES, TITLE_FONTS, type TitleFont } from "./defaults";
import { resolveBackground, textOn } from "./background";
import { clockLabel, longDate, shortDate, timeOf } from "./dates";
import type { DecorKey, IntroStyle, InvitationWithTheme, Show, TextKey, ThemeDecor } from "./types";

export type Tone = "surface" | "secondary" | "accent" | "highlight";
export type BlockKey = "card" | "countdown" | "details" | "show" | "extras" | "gallery" | "message" | "rsvp";

/** Todo lo que la página pública necesita, ya calculado. Es serializable. */
export type InvitationView = ReturnType<typeof buildView>;

const COLORED_TONES: Tone[] = ["secondary", "accent", "highlight"];

export function buildView(inv: InvitationWithTheme) {
  const theme = inv.theme;
  const colors = { ...DEFAULT_COLORS, ...theme?.colors };
  const bg = resolveBackground(colors, theme?.background);
  const introImage = theme?.intro?.image_url || null;
  const introStyle: IntroStyle =
    INTRO_STYLES.find((s) => s.value === theme?.intro?.style && (s.value !== "image" || introImage))?.value ?? "gift";
  const font = (theme && theme.title_font in TITLE_FONTS ? theme.title_font : "lilita") as TitleFont;

  const nameLines = inv.name_lines.filter(Boolean);
  const fullName = nameLines.join(" ");
  const firstName = nameLines[0] ?? "";

  const fill = (s: string) => s.replaceAll("{nombre}", firstName).replaceAll("{edad}", inv.age == null ? "" : String(inv.age));
  const texts = Object.fromEntries(
    (Object.keys(DEFAULT_TEXTS) as TextKey[]).map((k) => [
      k,
      fill(inv.texts?.[k] || DEFAULT_TEXTS[k] || (k === "introHint" ? INTRO_STYLES.find((s) => s.value === introStyle)!.hint : "")),
    ])
  ) as Record<TextKey, string>;

  const sections = { ...DEFAULT_SECTIONS, ...inv.sections };
  const show: Show = {
    enabled: false,
    time: null,
    title: "",
    description: "",
    image_url: null,
    image_style: "framed",
    // La columna es jsonb: puede venir incompleta
    ...(inv.show as Partial<Show> | null),
    performers: (inv.show?.performers ?? []).filter((p) => p.name || p.image_url),
  };

  // Pin exacto si se conoce; si no, el lugar escrito. El nombre del lugar va
  // incluido: sin él, Google suele ubicar solo la colonia y no pone marcador.
  const mapQuery = [inv.venue_name, inv.address, inv.area].filter(Boolean).join(", ");
  const destination = inv.maps_destination || mapQuery;
  const q = encodeURIComponent(destination);

  const visible: Record<BlockKey, boolean> = {
    card: sections.card,
    countdown: sections.countdown,
    details: sections.details,
    show: show.enabled,
    extras: inv.extras.length > 0,
    gallery: inv.gallery.length > 0,
    message: sections.message,
    rsvp: sections.rsvp,
  };

  // Alterna fondo claro con colores del tema, y cada sección sabe el color de
  // la anterior para pintar el borde festoneado.
  const order = (Object.keys(visible) as BlockKey[]).filter((k) => visible[k]);
  let colored = 0;
  const blocks = order.map((key, i) => ({
    key,
    tone: (i % 2 === 0 ? "surface" : COLORED_TONES[colored++ % COLORED_TONES.length]) as Tone,
  }));
  const blocksWithPrev = blocks.map((b, i) => ({ ...b, prev: i === 0 ? null : blocks[i - 1].tone }));

  // Elementos flotantes del tema, por espacio
  const decor = themeDecor(theme?.decor);

  const style = {
    "--c-primary": colors.primary,
    "--c-secondary": colors.secondary,
    "--c-accent": colors.accent,
    "--c-highlight": colors.highlight,
    "--c-surface": colors.surface,
    "--c-ink": colors.ink,
    "--on-primary": textOn(colors.primary, colors.ink),
    "--on-secondary": textOn(colors.secondary, colors.ink),
    "--on-accent": textOn(colors.accent, colors.ink),
    "--bg-a": bg.from,
    "--balloon": theme?.intro?.color || colors.primary,
    "--bg-b": bg.to,
    "--bg-soften": bg.soften / 100,
    "--bg-img": bg.imageUrl ? `url("${encodeURI(bg.imageUrl)}")` : "none",
    "--f-title": `var(--font-${font}), var(--font-lilita), system-ui, sans-serif`,
  } as CSSProperties;

  return {
    slug: inv.slug,
    published: inv.published,
    nameLines,
    fullName,
    firstName,
    age: inv.age,
    ageText: inv.age_text,
    photoUrl: inv.photo_url,
    eventAt: inv.event_at,
    eventLabel: inv.event_label,
    longDate: longDate(inv.event_at, inv.timezone),
    shortDate: shortDate(inv.event_at, inv.timezone),
    time: timeOf(inv.event_at, inv.timezone),
    venueName: inv.venue_name,
    address: inv.address,
    area: inv.area,
    place: [inv.venue_name, inv.address, inv.area].filter(Boolean).join(", "),
    mapsUrl: destination
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
      : null,
    mapEmbed: destination ? `https://maps.google.com/maps?q=${q}&z=16&output=embed` : null,
    message: inv.message,
    // 10 dígitos = número mexicano sin lada de país: wa.me necesita el 52
    whatsapp: inv.whatsapp?.length === 10 ? `52${inv.whatsapp}` : inv.whatsapp,
    show: { ...show, timeLabel: show.time ? clockLabel(show.time) : null },
    extras: inv.extras,
    gallery: inv.gallery,
    texts,
    blocks: blocksWithPrev,
    decor,
    colors,
    style,
    theme: {
      name: theme?.name ?? "",
      logoUrl: theme?.logo_url ?? null,
      bgStyle: bg.style,
      introStyle,
      introImage,
      logoStyle: theme?.logo_style ?? "badge",
      cardUrl: theme?.card_url ?? null,
      groupUrl: theme?.group_url ?? null,
      musicUrl: theme?.music_url ?? null,
      musicStart: theme?.music_start ?? 0,
    },
  };
}

/**
 * Espacios de imágenes del tema por sección (null = vacío).
 * Antes "Lo que te espera" tenía 3; la tercera ahora va sobre "Mis recuerdos".
 */
export function themeDecor(decor: ThemeDecor | null | undefined): Record<DecorKey, (string | null)[]> {
  const out = {} as Record<DecorKey, (string | null)[]>;
  for (const { key, slots } of DECOR_SECTIONS) {
    const urls = key === "gallery" && !decor?.gallery ? [decor?.extras?.[2] ?? null] : (decor?.[key] ?? []);
    out[key] = slots.map((_, i) => urls[i] || null);
  }
  return out;
}
