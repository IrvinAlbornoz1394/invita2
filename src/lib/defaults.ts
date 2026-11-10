import type { ThemeColors } from "./types";

/** Tipos de evento. Cada uno trae sus textos, extras y datos de ejemplo. */
export const EVENT_TYPES = {
  cumpleanos: { label: "Cumpleaños", eventLabel: "cumpleaños", emoji: "🎂", sample: "¡Feliz cumpleaños!" },
  bautizo: { label: "Bautizo", eventLabel: "bautizo", emoji: "🕊️", sample: "Mi bautizo" },
  primera_comunion: { label: "Primera Comunión", eventLabel: "Primera Comunión", emoji: "🕯️", sample: "Mi Primera Comunión" },
} as const;

export type EventType = keyof typeof EVENT_TYPES;

export const EVENT_TYPE_KEYS = Object.keys(EVENT_TYPES) as [EventType, ...EventType[]];

export function eventType(value: string | null | undefined): EventType {
  return value && value in EVENT_TYPES ? (value as EventType) : "cumpleanos";
}

/** Eventos religiosos: llevan ceremonia, papás y padrinos. */
export const isReligious = (type: EventType) => type !== "cumpleanos";

/** «al cumpleaños», «a la Primera Comunión»: artículo según el nombre del evento */
export function toEvent(label: string) {
  return /(a|ión)$/i.test(label.trim()) ? `a la ${label}` : `al ${label}`;
}

/** Textos predeterminados (cumpleaños). {nombre} y {edad} se reemplazan al mostrar. */
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
  familyTitle: "Con el cariño de mi familia",
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
  familyTitle: "Título de papás y padrinos",
  messageTitle: "Título del mensaje",
  messageClosing: "Cierre del mensaje",
  rsvpTitle: "Título de confirmación",
  footer: "Pie de página",
};

type Texts = Record<keyof typeof DEFAULT_TEXTS, string>;

/** Textos de ejemplo de cada tipo de evento: la voz es la del festejado, más serena en los religiosos. */
export const EVENT_TEXTS: Record<EventType, Texts> = {
  cumpleanos: DEFAULT_TEXTS,
  bautizo: {
    ...DEFAULT_TEXTS,
    introKicker: "{nombre} tiene una noticia muy especial",
    heroPill: "Te invito a mi bautizo",
    cardKicker: "Acompáñame a recibir el sacramento del Bautismo",
    countdownTitle: "Falta poco para mi bautizo",
    countdownDone: "¡Hoy es mi bautizo!",
    detailsTitle: "Aparta la fecha",
    extrasTitle: "Celebremos juntos",
    galleryTitle: "Mis primeros recuerdos",
    familyTitle: "Con el amor de mi familia",
    messageTitle: "Un día de bendición",
    messageClosing: "Te esperamos con cariño",
    rsvpTitle: "¿Me acompañas?",
    footer: "Hecho con mucho amor para celebrar mi bautizo",
  },
  primera_comunion: {
    ...DEFAULT_TEXTS,
    introKicker: "{nombre} quiere compartir contigo un día especial",
    heroPill: "Te invito a mi Primera Comunión",
    cardKicker: "Recibiré a Jesús por primera vez y quiero que estés conmigo",
    countdownTitle: "Falta poco para mi Primera Comunión",
    countdownDone: "¡Hoy es mi Primera Comunión!",
    detailsTitle: "Aparta la fecha",
    extrasTitle: "Celebremos juntos",
    galleryTitle: "Mis recuerdos",
    familyTitle: "Me acompañan",
    messageTitle: "Un día para dar gracias",
    messageClosing: "Te espero con cariño",
    rsvpTitle: "¿Me acompañas?",
    footer: "Hecho con mucho cariño para celebrar mi Primera Comunión",
  },
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
  sniglet: "Sniglet · tierna, bebés",
  moonrocks: "Rubik Moonrocks · dinosaurios, mundo jurásico",
  bangers: "Bangers · cómic, superhéroes",
  bungee: "Bungee · retro, arcade",
  pixel: "Press Start 2P · videojuegos pixel",
  audiowide: "Audiowide · velocidad, carreras",
  orbitron: "Orbitron · espacio, robots",
  monoton: "Monoton · neón ochentero",
  pacifico: "Pacifico · retro, playa",
  rye: "Rye · vaqueros, viejo oeste",
  cinzel: "Cinzel Decorative · princesas, castillos",
  creepster: "Creepster · monstruos, Halloween",
  greatvibes: "Great Vibes · caligrafía, bautizo",
  parisienne: "Parisienne · caligrafía suave",
  pinyon: "Pinyon Script · caligrafía clásica, comunión",
  alexbrush: "Alex Brush · pincel elegante",
  dancing: "Dancing Script · manuscrita alegre",
  cormorant: "Cormorant Garamond · serif clásica",
  playfair: "Playfair Display · serif elegante",
  cinzelclassic: "Cinzel · romana, solemne",
  marcellus: "Marcellus · romana suave",
} as const;

export type TitleFont = keyof typeof TITLE_FONTS;

/** Ancho medio de una letra (en em) de cada fuente: el nombre se achica para caber en pantalla. */
export const TITLE_FONT_WIDTH: Partial<Record<TitleFont, number>> = {
  sniglet: 0.64,
  bangers: 0.42,
  bungee: 0.73,
  pixel: 1.02,
  monoton: 0.73,
  pacifico: 0.52,
  rye: 0.62,
  cinzel: 0.7,
  creepster: 0.47,
  greatvibes: 0.44,
  parisienne: 0.52,
  pinyon: 0.56,
  alexbrush: 0.44,
  dancing: 0.5,
  cormorant: 0.5,
  playfair: 0.6,
  cinzelclassic: 0.78,
  marcellus: 0.62,
};

/**
 * Fuentes finas: no aguantan el volumen de juguete (contorno grueso, canto) ni
 * botones o números chicos. «script» se escribe de corrido (sin separar letras)
 * y usa una serif de apoyo para botones, cifras y etiquetas.
 */
export const TITLE_FONT_KIND: Partial<Record<TitleFont, "script" | "serif">> = {
  greatvibes: "script",
  parisienne: "script",
  pinyon: "script",
  alexbrush: "script",
  dancing: "script",
  cormorant: "serif",
  playfair: "serif",
  cinzelclassic: "serif",
  marcellus: "serif",
  cinzel: "serif",
};

/** Fuentes recomendadas por tipo de evento (van primero en el selector del tema). */
export const EVENT_FONTS: Record<EventType, TitleFont[]> = {
  cumpleanos: ["lilita", "luckiest", "titan", "chewy", "fredoka", "bubblegum", "sniglet"],
  bautizo: ["greatvibes", "parisienne", "alexbrush", "dancing", "cormorant", "playfair", "marcellus", "sniglet"],
  primera_comunion: ["pinyon", "greatvibes", "alexbrush", "cinzelclassic", "cormorant", "playfair", "marcellus"],
};

/** Atajos para la sección de extras; cada uno se puede editar después de agregarlo. */
const PARTY_EXTRAS = [
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

const CELEBRATION_EXTRAS = [
  { emoji: "🍽️", label: "Comida" },
  { emoji: "🌮", label: "Taquiza" },
  { emoji: "🎂", label: "Pastel" },
  { emoji: "🍰", label: "Mesa de postres" },
  { emoji: "🥂", label: "Brindis" },
  { emoji: "🍹", label: "Bebidas" },
  { emoji: "🎶", label: "Música en vivo" },
  { emoji: "🎺", label: "Mariachi" },
  { emoji: "🎧", label: "DJ" },
  { emoji: "📸", label: "Cabina de fotos" },
  { emoji: "🎁", label: "Recuerdito" },
  { emoji: "🍭", label: "Mesa de dulces" },
  { emoji: "🏰", label: "Brincolines" },
  { emoji: "🎨", label: "Pintacaritas" },
  { emoji: "🧸", label: "Área de bebés" },
  { emoji: "👔", label: "Código de vestimenta" },
];

export const EXTRAS_CATALOG: Record<EventType, { emoji: string; label: string }[]> = {
  cumpleanos: PARTY_EXTRAS,
  bautizo: CELEBRATION_EXTRAS,
  primera_comunion: CELEBRATION_EXTRAS,
};

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

const NO_SHOW = {
  enabled: false,
  time: null,
  title: "",
  description: "",
  performers: [],
  image_source: "theme" as const,
  image_url: null,
  image_style: "framed" as const,
};

/**
 * Contenido de ejemplo con el que nace cada invitación nueva: el panel lo muestra
 * ya escrito para solo ajustarlo (o borrarlo). Los personajes del show y la galería
 * dependen del tema, así que empiezan vacíos.
 */
export const DEMO_INVITATIONS = {
  cumpleanos: {
    event_type: "cumpleanos" as EventType,
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
      image_source: "theme" as const,
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
    family: {},
    ceremony: { enabled: false },
  },
  bautizo: {
    event_type: "bautizo" as EventType,
    event_label: "bautizo",
    venue_name: "Jardín Los Olivos",
    address: "Calle 21 #300, por 18 y 20",
    area: "García Ginerés, Mérida, Yucatán",
    message:
      "Con mucha alegría, mis papás y mis padrinos te invitan a acompañarme a recibir el sacramento del Bautismo y a celebrar después con nosotros.",
    show: NO_SHOW,
    extras: [
      { emoji: "🍽️", label: "Comida", note: "Al terminar la ceremonia" },
      { emoji: "🎂", label: "Pastel", note: "" },
      { emoji: "🍰", label: "Mesa de postres", note: "" },
      { emoji: "🧸", label: "Área de bebés", note: "" },
    ],
    family: { parents: ["Ana López", "Carlos Pérez"], godparents: ["Laura Gómez", "Jorge Ruiz"] },
    ceremony: { enabled: true, time: null, place: "Parroquia de San Juan", address: "Calle 62 #500, Centro, Mérida", maps_url: null },
  },
  primera_comunion: {
    event_type: "primera_comunion" as EventType,
    event_label: "Primera Comunión",
    venue_name: "Jardín Los Olivos",
    address: "Calle 21 #300, por 18 y 20",
    area: "García Ginerés, Mérida, Yucatán",
    message:
      "Este día recibiré a Jesús en mi corazón por primera vez. Me hará muy feliz que me acompañes en la misa y en la celebración.",
    show: NO_SHOW,
    extras: [
      { emoji: "🍽️", label: "Comida", note: "Al terminar la misa" },
      { emoji: "🎂", label: "Pastel", note: "" },
      { emoji: "🍭", label: "Mesa de dulces", note: "" },
      { emoji: "🏰", label: "Brincolines", note: "Para los niños" },
    ],
    family: { parents: ["Ana López", "Carlos Pérez"], godparents: ["Laura Gómez", "Jorge Ruiz"] },
    ceremony: { enabled: true, time: null, place: "Parroquia de San Juan", address: "Calle 62 #500, Centro, Mérida", maps_url: null },
  },
} satisfies Record<EventType, object>;

/** Horas que la recepción va después de la ceremonia en una invitación nueva */
export const RECEPTION_AFTER_HOURS = 2;

/** Frase de la cinta: "Mi primer añito", "¡Cumplo 5 años!", "Mi bautizo"… */
export function ageRibbon(age: number | null, type: EventType = "cumpleanos") {
  if (type === "bautizo") return "Mi bautizo";
  if (type === "primera_comunion") return "Mi Primera Comunión";
  if (age === null) return "¡Es mi cumpleaños!";
  return age === 1 ? "Mi primer añito" : `¡Cumplo ${age} años!`;
}

/** Formas de abrir la invitación, con su indicación por defecto. */
export const INTRO_STYLES = [
  { value: "gift", label: "Regalo 3D", hint: "Toca el regalo" },
  { value: "balloon", label: "Globo 3D que se revienta", hint: "¡Revienta el globo!" },
  { value: "book", label: "Libro que se abre", hint: "Toca el libro para abrirlo" },
  { value: "envelope", label: "Sobre con carta", hint: "Toca el sobre para abrirlo" },
  { value: "curtain", label: "Telón de teatro", hint: "Toca para abrir el telón" },
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
] as const;

export const DECOR_MAX = 3;

/** Ancho por defecto (en % de la sección) de las imágenes de "Lo que te espera" */
export const DECOR_EXTRAS_TOP_WIDTH = 100;
