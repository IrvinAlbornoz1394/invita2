// Utilidades para copiar filas y sus archivos de un Supabase a otro.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";

export const BUCKET = "media";

/** Cliente con la llave secreta del proyecto descrito en un archivo .env. */
export function connect(file) {
  let env;
  try {
    env = parseEnv(readFileSync(file, "utf8"));
  } catch {
    console.error(`No se pudo leer ${file}`);
    process.exit(1);
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error(`Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en ${file}`);
    process.exit(1);
  }
  const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return { file, url, client, publicPrefix: `${url}/storage/v1/object/public/${BUCKET}/` };
}

/** Sale si origen y destino son el mismo proyecto. */
export function assertDifferent(from, to) {
  if (from.url === to.url) {
    console.error("Origen y destino son el mismo proyecto.");
    process.exit(1);
  }
}

/** Rutas del bucket que aparecen en una fila del origen. */
export function filePaths(from, row) {
  const json = JSON.stringify(row);
  const escaped = from.publicPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...new Set([...json.matchAll(new RegExp(`${escaped}([^"\\s]+)`, "g"))].map((m) => m[1]))];
}

/** Sube al destino cada archivo del bucket que aparezca en `row` y devuelve la fila con las URLs nuevas. */
export async function moveFiles(from, to, row) {
  for (const path of filePaths(from, row)) {
    const { data: blob, error: downloadError } = await from.client.storage.from(BUCKET).download(decodeURI(path));
    if (downloadError) throw new Error(`No se pudo descargar ${path}: ${downloadError.message}`);
    const { error: uploadError } = await to.client.storage
      .from(BUCKET)
      .upload(decodeURI(path), blob, { contentType: blob.type, upsert: true });
    if (uploadError) throw new Error(`No se pudo subir ${path}: ${uploadError.message}`);
    console.log(`  archivo  ${path}`);
  }
  return JSON.parse(JSON.stringify(row).split(from.publicPrefix).join(to.publicPrefix));
}

/** Las fechas de creación/edición las pone la base de datos destino. */
export const withoutTimestamps = ({ created_at, updated_at, ...row }) => (void created_at, void updated_at, row);
