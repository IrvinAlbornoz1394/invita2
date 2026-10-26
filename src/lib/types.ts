import type { DEFAULT_TEXTS, DEFAULT_SECTIONS } from "./defaults";

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

export type LogoStyle = "badge" | "plain";

export type Theme = {
  id: string;
  name: string;
  colors: ThemeColors;
  title_font: string;
  logo_url: string | null;
  logo_style: LogoStyle;
  card_url: string | null;
  group_url: string | null;
  music_url: string | null;
  music_start: number;
  background: Partial<ThemeBackground> | null;
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
  theme_id: string | null;
  name_lines: string[];
  age: number | null;
  age_text: string | null;
  photo_url: string | null;
  event_at: string;
  timezone: string;
  event_label: string;
  venue_name: string | null;
  address: string | null;
  area: string | null;
  maps_url: string | null;
  message: string | null;
  whatsapp: string | null;
  show: Show;
  extras: Extra[];
  gallery: GalleryItem[];
  sections: Partial<Sections>;
  texts: Texts;
  updated_at: string;
};

export type InvitationWithTheme = Invitation & { theme: Theme | null };
