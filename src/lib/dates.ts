/**
 * Fechas siempre en la zona horaria del evento, para que el servidor y cualquier
 * teléfono (esté donde esté) muestren lo mismo.
 */

function zoneParts(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** Diferencia en ms entre la hora local de la zona y UTC en ese instante. */
function zoneOffset(ts: number, timeZone: string) {
  const p = zoneParts(ts, timeZone);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ts / 1000) * 1000;
}

/** "2026-11-13" + "16:00" en America/Merida → instante UTC. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, m - 1, d, h, mi);
  let ts = asUtc - zoneOffset(asUtc, timeZone);
  // Segundo ajuste por si el primer cálculo cruzó un cambio de horario
  const second = zoneOffset(ts, timeZone);
  if (asUtc - second !== ts) ts = asUtc - second;
  return new Date(ts);
}

/** Instante → { date: "YYYY-MM-DD", time: "HH:MM" } en la zona indicada. */
export function utcToZoned(iso: string, timeZone: string) {
  const p = zoneParts(new Date(iso).getTime(), timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Viernes, 13 de noviembre de 2026" */
export function longDate(iso: string, timeZone: string) {
  return capitalize(
    new Date(iso).toLocaleDateString("es-MX", { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" })
  );
}

/** "13 de noviembre de 2026" */
export function shortDate(iso: string, timeZone: string) {
  return new Date(iso).toLocaleDateString("es-MX", { timeZone, day: "numeric", month: "long", year: "numeric" });
}

/** "4:00 p. m." */
export function timeOf(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { timeZone, hour: "numeric", minute: "2-digit" });
}

/** "19:00" → "7:00 p. m." */
export function clockLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("es-MX", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Formato UTC para calendarios: 20261113T220000Z */
export function calendarStamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
