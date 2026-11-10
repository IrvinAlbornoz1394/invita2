import type { CSSProperties } from "react";
import {
  DECOR_EXTRAS_TOP_WIDTH, DECOR_SECTIONS, DEFAULT_COLORS, DEFAULT_SECTIONS, DEFAULT_TEXTS, EVENT_TEXTS, eventType, INTRO_STYLES, isReligious,
  TITLE_FONT_KIND, TITLE_FONT_WIDTH, TITLE_FONTS, toEvent, type TitleFont,
} from "./defaults";
import { resolveBackground, textOn } from "./background";
import { clockLabel, longDate, shortDate, timeOf, utcToZoned, zonedToUtc } from "./dates";
import type { DecorKey, IntroStyle, InvitationWithTheme, Show, ShowImageSource, TextKey, ThemeDecor } from "./types";

export type Tone = "surface" | "secondary" | "accent" | "highlight";
export type BlockKey = "card" | "family" | "countdown" | "details" | "show" | "extras" | "gallery" | "message" | "rsvp";

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
  const fontKind = TITLE_FONT_KIND[font] ?? "fun";
  const type = eventType(inv.event_type);
  const defaults = EVENT_TEXTS[type];

  const nameLines = inv.name_lines.filter(Boolean);
  const fullName = nameLines.join(" ");
  const firstName = nameLines[0] ?? "";

  const fill = (s: string) => s.replaceAll("{nombre}", firstName).replaceAll("{edad}", inv.age == null ? "" : String(inv.age));
  const texts = Object.fromEntries(
    (Object.keys(DEFAULT_TEXTS) as TextKey[]).map((k) => [
      k,
      fill(inv.texts?.[k] || defaults[k] || (k === "introHint" ? INTRO_STYLES.find((s) => s.value === introStyle)!.hint : "")),
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
  // Por defecto, la imagen del show del tema; "custom" usa la propia (o ninguna)
  if (showImageSource(inv.show) === "theme") {
    show.image_url = theme?.show_url ?? null;
    show.image_style = theme?.show_style ?? "framed";
  }

  // Pin exacto si se conoce; si no, el lugar escrito. El nombre del lugar va
  // incluido: sin él, Google suele ubicar solo la colonia y no pone marcador.
  const mapQuery = [inv.venue_name, inv.address, inv.area].filter(Boolean).join(", ");
  const destination = inv.maps_destination || mapQuery;
  const q = encodeURIComponent(destination);

  // Ceremonia religiosa: tarjeta propia en «fecha y lugar» y la cuenta regresiva llega a ella
  const cer = inv.ceremony?.enabled ? inv.ceremony : null;
  const ceremonyAt = cer?.time ? zonedToUtc(utcToZoned(inv.event_at, inv.timezone).date, cer.time, inv.timezone).toISOString() : null;
  const ceremonyQuery = cer ? cer.destination || [cer.place, cer.address].filter(Boolean).join(", ") : "";
  const ceremony = cer && (cer.place || cer.address)
    ? {
        place: cer.place || cer.address || "",
        address: cer.place ? cer.address || null : null,
        timeLabel: cer.time ? clockLabel(cer.time) : null,
        mapsUrl: ceremonyQuery
          ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(ceremonyQuery)}&travelmode=driving`
          : null,
      }
    : null;
  const startsAt = ceremonyAt && ceremony && ceremonyAt < inv.event_at ? ceremonyAt : inv.event_at;

  const clean = (list: string[] | undefined) => (list ?? []).map((n) => n.trim()).filter(Boolean);
  const family = {
    parents: clean(inv.family?.parents),
    godparents: clean(inv.family?.godparents),
    parentsPhoto: inv.family?.parents_photo || null,
    godparentsPhoto: inv.family?.godparents_photo || null,
  };

  const visible: Record<BlockKey, boolean> = {
    card: sections.card,
    family: Boolean(family.parents.length || family.godparents.length || family.parentsPhoto || family.godparentsPhoto),
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
    "--f-ratio": TITLE_FONT_WIDTH[font] ?? 0.6,
    // Las caligráficas no sirven para botones ni cifras: ahí va una serif de apoyo
    ...(fontKind === "script" ? { "--f-label": "var(--font-cormorant), Georgia, serif" } : {}),
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
    /** Inicio real: la ceremonia si va antes de la recepción */
    startsAt,
    eventType: type,
    /** Bautizo y comunión: piezas serenas en vez de las de juguete */
    elegant: isReligious(type),
    eventLabel: inv.event_label,
    /** «al cumpleaños», «a la Primera Comunión» */
    toEvent: toEvent(inv.event_label),
    ceremony,
    family,
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
      fontKind,
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
 */
export function themeDecor(
  decor: ThemeDecor | null | undefined,
): Record<DecorKey, (string | null)[]> & { extras_top_width: number } {
  const out = { extras_top_width: decor?.extras_top_width ?? DECOR_EXTRAS_TOP_WIDTH } as Record<
    DecorKey,
    (string | null)[]
  > & { extras_top_width: number };
  for (const { key, slots } of DECOR_SECTIONS) {
    const urls = decor?.[key] ?? [];
    out[key] = slots.map((_, i) => urls[i] || null);
  }
  return out;
}

/** Invitaciones guardadas antes de existir la opción: con imagen propia, "custom"; sin ella, la del tema. */
export function showImageSource(show: Partial<Show> | null | undefined): ShowImageSource {
  return show?.image_source ?? (show?.image_url ? "custom" : "theme");
}
