# Invitaciones digitales

Invitaciones web animadas para fiestas infantiles, administrables desde un panel.
Next.js 16 + Supabase (base de datos, login y archivos). Se despliega en Vercel.

- **`/`**: landing pública.
- **`/<nombre>-<hash>`** (ej. `/lucero-k3f9a2`): invitación. Si el hash no existe o la invitación
  está en borrador, redirige a la landing.
- **`/admin`**: panel (solo administradores) para crear invitaciones y temas.

## Qué se puede administrar

**Invitación:** festejado (nombre en 1 a 3 renglones, edad, foto), fecha/hora/zona horaria,
lugar y mapa, tema, **show** (hora programada, nombre, descripción y personajes con foto,
todo opcional), **extras** (miniferia, brincolines, alberca, mesa de dulces… con catálogo de
atajos y extras propios), **galería**, mensaje, WhatsApp para confirmar, qué secciones se ven
y todos los textos (admiten `{nombre}` y `{edad}`).

**Tema** (set de personajes): 6 colores (los tonos oscuros se calculan solos), fondo (rayos,
degradado, lunares o imagen propia, con colores automáticos o elegidos), tipografía de
títulos, logo (con o sin recuadro), imagen de la tarjeta (los personajes; el texto va debajo), imagen de grupo y música
(con segundo de inicio). Cambiar un tema actualiza al instante todas las invitaciones que lo usan.

## Desarrollo local

Requiere Docker (para Supabase local) y Node 20+.

```bash
npm install
npm run db:start                     # levanta Supabase en los puertos 553xx
cp .env.example .env.local           # y pega las llaves que imprime el comando anterior
npm run admin:create -- tu@correo.com "una-contraseña"
npm run dev                          # http://localhost:3000
```

- Studio de Supabase: http://127.0.0.1:55323
- `npm run db:reset` borra todo y vuelve a cargar migraciones + `supabase/seed.sql`
  (Lucero y una invitación demo). Después hay que volver a crear el admin.

Los puertos de Supabase son 553xx (y no los 543xx por defecto) para no chocar con otros
proyectos Supabase locales.

## Despliegue

### 1. Supabase (producción)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Sube el esquema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref-del-proyecto>
   npx supabase db push              # tablas, políticas, bucket "media" y el tema Bely y Beto
   ```
3. En **Authentication → Sign In / Providers** desactiva **Allow new users to sign up**
   (solo entran los admins que crees tú; deja activado el proveedor Email).
4. Crea tu admin con las llaves de producción (Project Settings → API Keys):
   ```bash
   # .env.production.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY de producción
   node --env-file=.env.production.local scripts/create-admin.mjs tu@correo.com "contraseña"
   ```

### Pasar una invitación del local a producción

Copia la invitación, su tema y todos sus archivos (fotos, galería, música); se puede repetir
sin duplicar nada:

```bash
# .env.local = origen (local) · .env.production.local = destino
npm run invitation:copy -- samantha-2eurtf
```

### 2. Vercel

Importa el repo en [vercel.com/new](https://vercel.com/new) (framework: Next.js, sin cambiar
nada más) y agrega estas variables de entorno:

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | llave publicable (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | tu dominio, ej. `https://invitaciones.com` (para la vista previa en WhatsApp) |
| `NEXT_PUBLIC_CONTACT_WHATSAPP` | opcional: WhatsApp para cotizar desde la landing |
| `NEXT_PUBLIC_DEMO_SLUG` | opcional: invitación de ejemplo que enlaza la landing |

`SUPABASE_SECRET_KEY` **no** va en Vercel: solo la usa el script de crear admins.

Cada push a `main` se publica solo; otras ramas generan una URL de preview.

## Estructura

```
src/
├── app/
│   ├── page.tsx                  landing
│   ├── [slug]/page.tsx           invitación pública (cacheada; se refresca al guardar)
│   └── admin/                    panel: login, invitaciones, temas, vista previa
├── components/invitation/        la invitación: secciones, efectos, estilos
├── lib/
│   ├── defaults.ts               textos, secciones, catálogo de extras, tipografías, zonas horarias
│   ├── view.ts                   convierte una fila de la BD en lo que pinta la invitación
│   ├── schema.ts                 validación de lo que guarda el panel (zod)
│   └── data.ts / auth.ts         lectura cacheada y verificación de admin
└── proxy.ts                      refresca la sesión y protege /admin
supabase/
├── migrations/                   esquema, RLS, bucket y tema incluido
└── seed.sql                      datos de ejemplo (solo local)
public/temas/bely-beto/           recursos del tema incluido
legacy/                           la invitación estática original (solo referencia)
```

### Notas

- Las invitaciones se cachean (`"use cache"` + `cacheTag`); el panel las invalida con
  `updateTag` al guardar la invitación o su tema, así que los cambios se ven al instante.
- Las páginas de invitación llevan `noindex`: tienen direcciones particulares.
- Las fotos se reducen en el navegador (máx. 1600 px, WebP) antes de subirse.
