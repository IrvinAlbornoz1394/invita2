import type { DEFAULT_TEXTS, DEFAULT_SECTIONS, DECOR_SECTIONS, EventType, FloaterKind } from "./defaults";

export type { EventType, FloaterKind };

export type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  highlight: string;
  surface: string;
  ink: string;
};

export type BackgroundStyle = "rays" | "gradient" | "dots" | "image";

export type ThemeBackground = {
  style: BackgroundStyle;
  /** null = se calcula de los colores del tema */
  from: string | null;
  to: string | null;
  image_url: string | null;
  /** 0–80: cuánto se aclara el fondo con un velo blanco */
  soften: number;
};

export type IntroStyle = "gift" | "balloon" | "book" | "envelope" | "curtain" | "image";

export type ThemeIntro = {
  style: IntroStyle;
  /** Color del globo; null = color principal del tema */
  color: string | null;
  image_url: string | null;
};

/** Elementos flotantes del tema; null = lo de siempre según el tipo de evento. */
export type ThemeEffects = {
  floaters?: FloaterKind | null;
  /** Si siguen saliendo por toda la invitación después de la portada */
  keep?: boolean | null;
};

/**
 * Apertura y elementos de la invitación: "theme" usa los del tema; "custom",
 * los suyos propios.
 */
export type InvitationEffects = {
  source: "theme" | "custom";
  intro?: Exclude<IntroStyle, "image">;
  floaters?: FloaterKind;
  keep?: boolean;
};

export type DecorKey = (typeof DECOR_SECTIONS)[number]["key"];

/** Imágenes flotantes por sección, por espacio (null = espacio vacío) */
export type ThemeDecor = Partial<Record<DecorKey, (string | null)[]>> & {
  /** % del ancho de la sección que ocupa la imagen bajo el título de "Lo que te espera" */
  extras_top_width?: number;
};

export type ImageStyle = "framed" | "plain";

/** De dónde sale la imagen del show: la del tema o una propia de la invitación. */
export type ShowImageSource = "theme" | "custom";

/** De dónde sale el show completo (nombre, descripción, personajes e imagen): del tema o propio. */
export type ShowSource = "theme" | "custom";

/** Show que trae el tema; la imagen va aparte en show_url / show_style. */
export type ThemeShow = { title?: string; description?: string; performers?: Performer[] };

export type LogoStyle = "badge" | "plain";

export type Theme = {
  id: string;
  name: string;
  /** Dirección corta de la demo: /demo/<slug> */
  slug: string;
  /** false = no se ofrece para invitaciones nuevas ni en la landing; las que ya lo usan lo conservan */
  is_active?: boolean;
  /** Borrado lógico: no aparece en el panel */
  is_deleted?: boolean;
  /** Para qué evento es el tema; null = cualquiera */
  event_type?: EventType | null;
  colors: ThemeColors;
  title_font: string;
  logo_url: string | null;
  logo_style: LogoStyle;
  card_url: string | null;
  group_url: string | null;
  show_url: string | null;
  show_style?: ImageStyle;
  show?: ThemeShow | null;
  /** Aparece en la landing antes de «Ver todos» */
  featured?: boolean;
  music_url: string | null;
  music_start: number;
  background: Partial<ThemeBackground> | null;
  intro: Partial<ThemeIntro> | null;
  decor: ThemeDecor | null;
  effects?: ThemeEffects | null;
  updated_at?: string;
};

export type Performer = { name: string; image_url: string | null };

export type Show = {
  enabled: boolean;
  /** Hora local "HH:MM" */
  time: string | null;
  title: string;
  description: string;
  performers: Performer[];
  /** "theme" = usa el show del tema; "custom" = el de la invitación */
  source?: ShowSource;
  image_source?: ShowImageSource;
  image_url?: string | null;
  image_style?: ImageStyle;
};

/** Papás y padrinos (eventos religiosos), un nombre por renglón */
export type Family = { parents?: string[]; godparents?: string[]; parents_photo?: string | null; godparents_photo?: string | null };

/** Ceremonia religiosa antes de la recepción */
export type Ceremony = {
  enabled: boolean;
  /** Hora local "HH:MM" */
  time?: string | null;
  place?: string | null;
  address?: string | null;
  maps_url?: string | null;
  /** "lat,lng" sacado de maps_url al guardar */
  destination?: string | null;
};

export type Extra = { emoji: string; label: string; note: string };

export type GalleryItem = { url: string };

export type TextKey = keyof typeof DEFAULT_TEXTS;
export type Texts = Partial<Record<TextKey, string>>;

export type SectionKey = keyof typeof DEFAULT_SECTIONS;
export type Sections = Record<SectionKey, boolean>;

export type Invitation = {
  id: string;
  slug: string;
  published: boolean;
  /** false = el enlace deja de funcionar aunque esté publicada */
  is_active: boolean;
  /** Borrado lógico: no aparece en el panel ni en la página pública */
  is_deleted: boolean;
  theme_id: string | null;
  name_lines: string[];
  age: number | null;
  age_text: string | null;
  photo_url: string | null;
  event_at: string;
  timezone: string;
  event_type?: EventType;
  event_label: string;
  venue_name: string | null;
  address: string | null;
  area: string | null;
  maps_url: string | null;
  /** "lat,lng" sacado de maps_url al guardar */
  maps_destination?: string | null;
  message: string | null;
  whatsapp: string | null;
  /** Si la confirmación pregunta cuántas personas asisten */
  rsvp_ask_people: boolean;
  show: Show;
  extras: Extra[];
  gallery: GalleryItem[];
  family?: Family | null;
  ceremony?: Ceremony | null;
  sections: Partial<Sections>;
  texts: Texts;
  /** Apertura y elementos flotantes: los del tema o propios */
  effects?: InvitationEffects | null;
  updated_at: string;
};

export type InvitationWithTheme = Invitation & { theme: Theme | null };
