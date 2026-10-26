// Copia una invitación (con su tema y todos sus archivos) de un Supabase a otro;
// típicamente del local a producción.
// Uso: npm run invitation:copy -- samantha-2eurtf
//      (origen: .env.local · destino: .env.production.local; ambos con
//       NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY)
// Se puede correr varias veces: actualiza en vez de duplicar.
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "media";
const [slug, fromFile = ".env.local", toFile = ".env.production.local"] = process.argv.slice(2);
if (!slug) {
  console.error("Uso: npm run invitation:copy -- <slug> [env-origen] [env-destino]");
  process.exit(1);
}

function connect(file) {
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
  return { url, client, publicPrefix: `${url}/storage/v1/object/public/${BUCKET}/` };
}

const from = connect(fromFile);
const to = connect(toFile);
if (from.url === to.url) {
  console.error("Origen y destino son el mismo proyecto.");
  process.exit(1);
}

const { data: invitation, error } = await from.client.from("invitations").select("*").eq("slug", slug).maybeSingle();
if (error) throw error;
if (!invitation) {
  console.error(`No existe la invitación "${slug}" en ${fromFile}`);
  process.exit(1);
}
const theme = invitation.theme_id
  ? (await from.client.from("themes").select("*").eq("id", invitation.theme_id).single()).data
  : null;

/** Sube al destino cada archivo del bucket que aparezca en `row` y devuelve la fila con las URLs nuevas. */
async function moveFiles(row) {
  let json = JSON.stringify(row);
  const escaped = from.publicPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const paths = [...new Set([...json.matchAll(new RegExp(`${escaped}([^"\\s]+)`, "g"))].map((m) => m[1]))];
  for (const path of paths) {
    const { data: blob, error: downloadError } = await from.client.storage.from(BUCKET).download(decodeURI(path));
    if (downloadError) throw new Error(`No se pudo descargar ${path}: ${downloadError.message}`);
    const { error: uploadError } = await to.client.storage
      .from(BUCKET)
      .upload(decodeURI(path), blob, { contentType: blob.type, upsert: true });
    if (uploadError) throw new Error(`No se pudo subir ${path}: ${uploadError.message}`);
    console.log(`  archivo  ${path}`);
  }
  json = json.split(from.publicPrefix).join(to.publicPrefix);
  return JSON.parse(json);
}

/** Las fechas de creación/edición las pone la base de datos destino. */
const withoutTimestamps = ({ created_at, updated_at, ...row }) => (void created_at, void updated_at, row);

if (theme) {
  console.log(`Tema "${theme.name}"`);
  const { error: themeError } = await to.client.from("themes").upsert(withoutTimestamps(await moveFiles(theme)));
  if (themeError) throw themeError;
}

console.log(`Invitación "${slug}"`);
const { error: invitationError } = await to.client
  .from("invitations")
  .upsert(withoutTimestamps(await moveFiles(invitation)));
if (invitationError) throw invitationError;

console.log(`Listo: /${slug} copiada a ${to.url}${invitation.published ? "" : " (como borrador)"}`);
