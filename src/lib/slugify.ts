/** "Bautizo globos aerostáticos" → "bautizo-globos-aerostaticos" (sirve en el navegador y en el servidor). */
export function slugify(text: string, max = 24) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");
}

/** Largo máximo de la dirección de la demo de un tema */
export const THEME_SLUG_MAX = 48;
