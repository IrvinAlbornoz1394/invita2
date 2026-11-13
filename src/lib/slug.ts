import { randomInt } from "node:crypto";
import { slugify } from "./slugify";

export { slugify };

// Sin 0/o, 1/l para que el hash se pueda dictar sin confusiones
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** Sufijo al azar para que un slug nuevo no choque con otro */
export function randomHash(length = 6) {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/** "Lucero Jeamileth" → "lucero-k3f9a2" */
export function invitationSlug(name: string) {
  return `${slugify(name) || "fiesta"}-${randomHash()}`;
}
