// Crea (o promueve) un administrador del panel.
// Uso: npm run admin:create -- correo@ejemplo.com "contraseña"
//      (para producción: node --env-file=.env.production.local scripts/create-admin.mjs ...)
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!email || !password) {
  console.error('Uso: npm run admin:create -- correo@ejemplo.com "contraseña"');
  process.exit(1);
}
if (!url || !secret) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en el archivo de entorno.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

let userId;
const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
if (created?.user) {
  userId = created.user.id;
  console.log(`Usuario creado: ${email}`);
} else if (error?.code === "email_exists") {
  // Ya existe: busca su id y actualiza la contraseña
  for (let page = 1; !userId; page++) {
    const { data, error: listError } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) throw listError;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
    if (data.users.length < 200) break;
  }
  if (!userId) throw new Error(`No se encontró el usuario ${email}`);
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
  if (updateError) throw updateError;
  console.log(`El usuario ya existía; contraseña actualizada: ${email}`);
} else {
  throw error;
}

const { error: adminError } = await supabase.from("admins").upsert({ user_id: userId });
if (adminError) throw adminError;
console.log("Listo: ya puede entrar en /admin");
