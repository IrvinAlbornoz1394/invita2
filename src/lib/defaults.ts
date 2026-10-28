import type { ThemeColors } from "./types";

/** Textos predeterminados. {nombre} y {edad} se reemplazan al mostrar. */
export const DEFAULT_TEXTS = {
  introKicker: "{nombre} tiene una sorpresa para ti",
  /** Vacío = según la apertura del tema (ver INTRO_HINTS) */
  introHint: "",
  heroPill: "¡Estás invitado!",
  cardKicker: "¡Ven a celebrar conmigo!",
  countdownTitle: "¡Ya casi es mi fiesta!",
  countdownDone: "¡Hoy es el gran día!",
  detailsTitle: "¡Aparta la fecha!",
  showTitle: "¡Habrá show!",
  extrasTitle: "¡Lo que te espera!",
  galleryTitle: "Mis recuerdos",
  messageTitle: "¡La diversión nos espera!",
  messageClosing: "¡Te esperamos!",
  rsvpTitle: "¿Vienes a mi fiesta?",
  footer: "Hecho con mucho cariño para celebrar mi fiesta",
};

export const TEXT_LABELS: Record<keyof typeof DEFAULT_TEXTS, string> = {
  introKicker: "Pantalla de entrada",
  introHint: "Indicación para abrir",
  heroPill: "Etiqueta de portada",
  cardKicker: "Frase de la tarjeta",
  countdownTitle: "Título de cuenta regresiva",
  countdownDone: "Al llegar el día",
  detailsTitle: "Título de fecha y lugar",
  showTitle: "Título del show",
  extrasTitle: "Título de extras",
  galleryTitle: "Título de galería",
  messageTitle: "Título del mensaje",
  messageClosing: "Cierre del mensaje",
  rsvpTitle: "Título de confirmación",
  footer: "Pie de página",
};

/** Secciones que se pueden ocultar. Show, extras y galería se muestran si tienen contenido. */
export const DEFAULT_SECTIONS = {
  card: true,
  countdown: true,
  details: true,
  message: true,
  rsvp: true,
};

export const SECTION_LABELS: Record<keyof typeof DEFAULT_SECTIONS, string> = {
  card: "Tarjeta de invitación",
  countdown: "Cuenta regresiva",
  details: "Fecha, lugar y mapa",
  message: "Mensaje",
  rsvp: "Confirmación por WhatsApp",
};

export const DEFAULT_COLORS: ThemeColors = {
  primary: "#e8352b",
  secondary: "#1675d1",
  accent: "#ff8a00",
  highlight: "#ffd93b",
  surface: "#fff6dc",
  ink: "#5a2d0c",
};

export const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: "Principal (títulos, botones)",
  secondary: "Secundario",
  accent: "Acento",
  highlight: "Resaltado",
  surface: "Fondo claro",
  ink: "Texto",
};

/** Tipografías de título disponibles; se cargan en el layout raíz. */
export const TITLE_FONTS = {
  lilita: "Lilita One",
  luckiest: "Luckiest Guy",
  titan: "Titan One",
  chewy: "Chewy",
  fredoka: "Fredoka",
  bubblegum: "Bubblegum Sans",
} as const;

export type TitleFont = keyof typeof TITLE_FONTS;

/** Atajos para la sección de extras; cada uno se puede editar después de agregarlo. */
export const EXTRAS_CATALOG = [
  { emoji: "🎡", label: "Miniferia" },
  { emoji: "🏰", label: "Brincolines" },
  { emoji: "🏊", label: "Alberca" },
  { emoji: "🎨", label: "Pintacaritas" },
  { emoji: "🍭", label: "Mesa de dulces" },
  { emoji: "🪅", label: "Piñata" },
  { emoji: "🎂", label: "Pastel" },
  { emoji: "🌮", label: "Taquiza" },
  { emoji: "🍿", label: "Palomitas" },
  { emoji: "🍬", label: "Algodón de azúcar" },
  { emoji: "🎩", label: "Show de magia" },
  { emoji: "🤡", label: "Payasito" },
  { emoji: "🎈", label: "Globoflexia" },
  { emoji: "🫧", label: "Burbujas gigantes" },
  { emoji: "📸", label: "Cabina de fotos" },
  { emoji: "🎧", label: "DJ" },
  { emoji: "🎤", label: "Karaoke" },
  { emoji: "💦", label: "Inflable acuático" },
  { emoji: "🧸", label: "Área de bebés" },
  { emoji: "🎮", label: "Videojuegos" },
];

export const TIMEZONES = [
  { id: "America/Merida", label: "Mérida" },
  { id: "America/Cancun", label: "Cancún / Quintana Roo" },
  { id: "America/Mexico_City", label: "Centro (CDMX, Guadalajara)" },
  { id: "America/Monterrey", label: "Monterrey" },
  { id: "America/Chihuahua", label: "Chihuahua" },
  { id: "America/Mazatlan", label: "Pacífico (Mazatlán, La Paz)" },
  { id: "America/Hermosillo", label: "Sonora" },
  { id: "America/Tijuana", label: "Tijuana" },
];

/**
 * Contenido de ejemplo con el que nace cada invitación nueva: el panel lo muestra
 * ya escrito para solo ajustarlo (o borrarlo). Los personajes del show y la galería
 * dependen del tema, así que empiezan vacíos.
 */
export const DEMO_INVITATION = {
  event_label: "cumpleaños",
  venue_name: "Salón Arcoíris",
  address: "Calle 60 #500, por 61 y 63",
  area: "Centro, Mérida, Yucatán",
  message: "Ven a compartir sonrisas y momentos inolvidables conmigo. ¡Habrá juegos, música y muchas sorpresas!",
  show: {
    enabled: true,
    time: "19:00",
    title: "¡Show sorpresa!",
    description: "Canciones, bailes y concursos con mis personajes favoritos.",
    performers: [],
    image_url: null,
    image_style: "framed" as const,
  },
  extras: [
    { emoji: "🎡", label: "Miniferia", note: "Juegos para los peques" },
    { emoji: "🏰", label: "Brincolines", note: "" },
    { emoji: "🎨", label: "Pintacaritas", note: "" },
    { emoji: "🍭", label: "Mesa de dulces", note: "" },
    { emoji: "🪅", label: "Piñata", note: "" },
  ],
};

/** Frase de la cinta según la edad: "Mi primer añito", "¡Cumplo 5 años!"… */
export function ageRibbon(age: number | null) {
  if (age === null) return "¡Es mi cumpleaños!";
  return age === 1 ? "Mi primer añito" : `¡Cumplo ${age} años!`;
}

/** Formas de abrir la invitación, con su indicación por defecto. */
export const INTRO_STYLES = [
  { value: "gift", label: "Regalo", hint: "Toca el regalo" },
  { value: "balloon", label: "Globo que se revienta", hint: "¡Revienta el globo!" },
  { value: "image", label: "Imagen propia", hint: "Toca para abrir" },
] as const;

/** Secciones que aceptan elementos flotantes del tema y dónde va cada espacio. */
export const DECOR_SECTIONS = [
  {
    key: "details",
    label: "¡Aparta la fecha!",
    hint: "En zigzag junto a cada tarjeta (fecha, hora y lugar)",
    slots: ["Junto a la fecha", "Junto a la hora", "Junto al lugar"],
  },
  {
    key: "extras",
    label: "¡Lo que te espera!",
    hint: "Una debajo del título y otra debajo de todos los elementos",
    slots: ["Debajo del título", "Debajo de los elementos"],
  },
  { key: "gallery", label: "Mis recuerdos", hint: "Arriba del título de la galería", slots: ["Sobre el título"] },
] as const;

export const DECOR_MAX = 3;
