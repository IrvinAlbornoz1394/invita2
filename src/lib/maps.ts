import "server-only";

/** Hosts de enlaces cortos de Google Maps que redirigen al enlace completo. */
const SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

/**
 * Busca coordenadas en un enlace de Google Maps. Prefiere el pin del lugar
 * (!3d…!4d…) sobre el centro de la vista (@lat,lng).
 */
export function coordsFromUrl(url: string) {
  const n = String.raw`(-?\d{1,3}\.\d+)`;
  const match =
    url.match(new RegExp(String.raw`!3d${n}!4d${n}`)) ??
    url.match(new RegExp(String.raw`[?&](?:q|query|destination|ll)=${n},(?:%20|\+)?${n}`)) ??
    url.match(new RegExp(String.raw`@${n},${n}`));
  return match ? `${match[1]},${match[2]}` : null;
}

/** Coordenadas del enlace; los enlaces cortos se siguen una vez para leer el completo. */
export async function resolveMapsDestination(url: string | null) {
  if (!url) return null;
  const direct = coordsFromUrl(url);
  if (direct) return direct;
  try {
    if (!SHORT_HOSTS.has(new URL(url).hostname)) return null;
    const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    const location = res.headers.get("location");
    return location ? coordsFromUrl(decodeURIComponent(location)) : null;
  } catch {
    // Sin red o enlace raro: se usará la dirección escrita
    return null;
  }
}
