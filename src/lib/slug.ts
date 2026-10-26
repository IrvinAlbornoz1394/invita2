import { randomInt } from "node:crypto";

// Sin 0/o, 1/l para que el hash se pueda dictar sin confusiones
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/, "");
}

/** "Lucero Jeamileth" → "lucero-k3f9a2" */
export function invitationSlug(name: string) {
  const hash = Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${slugify(name) || "fiesta"}-${hash}`;
}
