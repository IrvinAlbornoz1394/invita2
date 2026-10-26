-- ============================================================================
-- Invitaciones: administradores, temas (personajes) e invitaciones.
-- La página pública solo lee invitaciones publicadas; todo lo demás es del admin.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins se ven a sí mismos"
  on public.admins for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Temas: personajes, colores, tipografía, imágenes y música
-- ---------------------------------------------------------------------------
create table public.themes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  colors jsonb not null default '{
    "primary": "#e8352b",
    "secondary": "#1675d1",
    "accent": "#ff8a00",
    "highlight": "#ffd93b",
    "surface": "#fff6dc",
    "ink": "#5a2d0c"
  }'::jsonb,
  title_font text not null default 'lilita',
  logo_url text,
  card_url text,
  -- Altura (en % de la tarjeta) donde empieza el texto sobre la ilustración
  card_text_top smallint not null default 60 check (card_text_top between 0 and 90),
  group_url text,
  music_url text,
  music_start smallint not null default 0 check (music_start >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger themes_updated_at
  before update on public.themes
  for each row execute function public.set_updated_at();

alter table public.themes enable row level security;

-- Los temas no tienen datos sensibles y la página pública los necesita
create policy "temas visibles para todos"
  on public.themes for select to anon, authenticated
  using (true);

create policy "admins crean temas"
  on public.themes for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins editan temas"
  on public.themes for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins borran temas"
  on public.themes for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Invitaciones
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  -- nombre + hash único, ej. "lucero-k3f9a2"
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  published boolean not null default false,
  theme_id uuid references public.themes (id) on delete set null,

  -- Festejado
  name_lines text[] not null check (cardinality(name_lines) between 1 and 3),
  age smallint check (age between 0 and 120),
  age_text text,
  photo_url text,

  -- Cuándo y dónde
  event_at timestamptz not null,
  timezone text not null default 'America/Merida',
  event_label text not null default 'cumpleaños',
  venue_name text,
  address text,
  area text,
  maps_url text,

  -- Contenido
  message text,
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  -- { enabled, time: "19:00", title, description, performers: [{ name, image_url }] }
  show jsonb not null default '{"enabled": false, "performers": []}'::jsonb,
  -- [{ emoji, label, note }]
  extras jsonb not null default '[]'::jsonb check (jsonb_typeof(extras) = 'array'),
  -- [{ url }]
  gallery jsonb not null default '[]'::jsonb check (jsonb_typeof(gallery) = 'array'),
  -- Secciones que se muestran: { card, countdown, details, message, rsvp }
  sections jsonb not null default '{}'::jsonb,
  -- Textos que sustituyen a los predeterminados (títulos, frases, botones)
  texts jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_theme_id_idx on public.invitations (theme_id);
create index invitations_event_at_idx on public.invitations (event_at desc);

create trigger invitations_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

alter table public.invitations enable row level security;

create policy "invitaciones publicadas visibles para todos"
  on public.invitations for select to anon, authenticated
  using (published or (select public.is_admin()));

create policy "admins crean invitaciones"
  on public.invitations for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins editan invitaciones"
  on public.invitations for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins borran invitaciones"
  on public.invitations for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Archivos (fotos, ilustraciones, música): lectura pública, escritura admin
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
);

create policy "admins suben archivos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "admins reemplazan archivos"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "admins borran archivos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
