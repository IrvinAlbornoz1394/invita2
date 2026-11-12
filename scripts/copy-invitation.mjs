// Copia una invitación (con su tema y todos sus archivos) de un Supabase a otro;
// típicamente del local a producción.
// Uso: npm run invitation:copy -- samantha-2eurtf
//      (origen: .env.local · destino: .env.production.local; ambos con
//       NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY)
// Se puede correr varias veces: actualiza en vez de duplicar.
import { assertDifferent, connect, moveFiles as move, withoutTimestamps } from "./lib/supabase-copy.mjs";

const [slug, fromFile = ".env.local", toFile = ".env.production.local"] = process.argv.slice(2);
if (!slug) {
  console.error("Uso: npm run invitation:copy -- <slug> [env-origen] [env-destino]");
  process.exit(1);
}

const from = connect(fromFile);
const to = connect(toFile);
assertDifferent(from, to);
const moveFiles = (row) => move(from, to, row);

const { data: invitation, error } = await from.client.from("invitations").select("*").eq("slug", slug).maybeSingle();
if (error) throw error;
if (!invitation) {
  console.error(`No existe la invitación "${slug}" en ${fromFile}`);
  process.exit(1);
}
const theme = invitation.theme_id
  ? (await from.client.from("themes").select("*").eq("id", invitation.theme_id).single()).data
  : null;

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

console.log(`Listo: /${slug} copiada a ${to.url}${invitation.published ? "" : " (inactiva)"}`);
