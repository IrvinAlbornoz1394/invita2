import type { BackgroundStyle, ThemeBackground, ThemeColors } from "./types";

/** Velo blanco por defecto (%) */
export const DEFAULT_SOFTEN = 35;

export const BACKGROUND_STYLES: { value: BackgroundStyle; label: string }[] = [
  { value: "rays", label: "Rayos" },
  { value: "gradient", label: "Degradado" },
  { value: "dots", label: "Lunares" },
  { value: "image", label: "Imagen propia" },
];

/** Mezcla dos colores #rrggbb; t = proporción de `a`. */
export function mixHex(a: string, b: string, t: number) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    "#" +
    [0, 1, 2]
      .map((i) => Math.round(ch(a, i) * t + ch(b, i) * (1 - t)).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** Luminancia relativa (WCAG) de un color #rrggbb. */
function luminance(hex: string) {
  const [r, g, b] = [0, 1, 2].map((i) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Color de texto legible sobre `bg`: blanco, salvo que el fondo sea tan claro que
 * el texto oscuro del tema contraste mejor.
 */
export function textOn(bg: string, dark: string) {
  const l = luminance(bg);
  const vsWhite = 1.05 / (l + 0.05);
  const vsDark = (Math.max(l, luminance(dark)) + 0.05) / (Math.min(l, luminance(dark)) + 0.05);
  // Se favorece el blanco (va con el estilo de los botones) mientras siga siendo
  // legible en texto grande y grueso: azules o rojos medios lo llevan; amarillos,
  // naranjas claros y pasteles, el texto oscuro
  return vsWhite >= 2.6 || vsWhite >= vsDark ? "#ffffff" : dark;
}

/** Colores sugeridos del fondo cuando el tema no fija los suyos. */
export function autoBackground(colors: ThemeColors) {
  return { from: colors.accent, to: mixHex(colors.accent, colors.highlight, 0.55) };
}

/** Fondo final: completa colores vacíos y descarta "imagen" si no hay imagen. */
export function resolveBackground(colors: ThemeColors, bg: Partial<ThemeBackground> | null | undefined) {
  const auto = autoBackground(colors);
  const imageUrl = bg?.image_url || null;
  const style: BackgroundStyle =
    bg?.style && BACKGROUND_STYLES.some((s) => s.value === bg.style) && (bg.style !== "image" || imageUrl)
      ? bg.style
      : "rays";
  const soften = Math.min(80, Math.max(0, bg?.soften ?? DEFAULT_SOFTEN));
  return { style, from: bg?.from || auto.from, to: bg?.to || auto.to, imageUrl, soften };
}
