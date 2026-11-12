// Copia todos los temas (con sus archivos) de un Supabase a otro;
// típicamente de producción al local.
// Uso: npm run themes:copy                 (origen: .env.production.local · destino: .env.local)
//      npm run themes:copy -- --dry-run    (solo muestra qué haría)
//      npm run themes:copy -- [env-origen] [env-destino]
// Se puede correr varias veces: actualiza por id en vez de duplicar. Si en el
// destino ya hay un tema con el mismo nombre pero otro id, no lo toca y avisa.
import { assertDifferent, connect, filePaths, moveFiles, withoutTimestamps } from "./lib/supabase-copy.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const [fromFile = ".env.production.local", toFile = ".env.local"] = args.filter((a) => !a.startsWith("--"));

const from = connect(fromFile);
const to = connect(toFile);
assertDifferent(from, to);

// Los borrados no se copian
const { data: themes, error } = await from.client.from("themes").select("*").eq("is_deleted", false).order("name");
if (error) throw error;
const { data: existing, error: existingError } = await to.client.from("themes").select("id, name");
if (existingError) throw existingError;
const byId = new Set(existing.map((t) => t.id));
const byName = new Map(existing.map((t) => [t.name.trim().toLowerCase(), t.id]));

console.log(`${themes.length} temas en ${from.url} → ${to.url}${dryRun ? " (simulación)" : ""}\n`);

let copied = 0;
const skipped = [];
for (const theme of themes) {
  const sameName = byName.get(theme.name.trim().toLowerCase());
  if (!byId.has(theme.id) && sameName) {
    skipped.push(theme.name);
    console.log(`Omitido  "${theme.name}": en el destino ya existe con otro id (${sameName})`);
    continue;
  }
  const action = byId.has(theme.id) ? "Actualiza" : "Crea";
  console.log(`${action} "${theme.name}" · ${filePaths(from, theme).length} archivos`);
  if (dryRun) continue;
  const { error: upsertError } = await to.client.from("themes").upsert(withoutTimestamps(await moveFiles(from, to, theme)));
  if (upsertError) throw new Error(`"${theme.name}": ${upsertError.message}`);
  copied++;
}

console.log(
  dryRun
    ? "\nSimulación: no se cambió nada."
    : `\nListo: ${copied} temas copiados${skipped.length ? `, ${skipped.length} omitidos por nombre repetido` : ""}.`
);
