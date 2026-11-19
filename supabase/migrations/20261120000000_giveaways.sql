-- Giveaways: un enlace público (no está en la landing) donde la gente se
-- registra para ganar una invitación. A los ganadores el panel les genera una
-- solicitud normal para que llenen los datos completos de su evento.

create table public.giveaways (
  id uuid primary key default gen_random_uuid(),
  -- Va en el enlace: /sorteo/<token>
  token text not null unique check (token ~ '^[a-z0-9]{8,32}$'),
  name text not null check (char_length(name) between 1 and 120),
  -- Cuántas invitaciones se regalan
  winners smallint not null default 10 check (winners between 1 and 500),
  -- Día en que se anuncian los ganadores; el registro cierra al empezar ese día
  announce_on date not null,
  closes_at timestamptz not null,
  -- Mensaje que se copia para mandarlo; {enlace} se reemplaza por el enlace
  message text not null default '' check (char_length(message) <= 2000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger giveaways_updated_at
  before update on public.giveaways
  for each row execute function public.set_updated_at();

create table public.giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references public.giveaways (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (phone ~ '^[0-9]{8,15}$'),
  facebook_name text not null check (char_length(facebook_name) between 1 and 120),
  event_type text not null check (event_type in ('cumpleanos', 'bautizo', 'primera_comunion', 'posada')),
  theme_id uuid references public.themes (id) on delete set null,
  custom_theme text check (custom_theme is null or char_length(custom_theme) <= 120),
  -- Fecha aproximada del evento, si ya la tienen
  event_date date,
  -- participando · ganador (ya tiene solicitud) · descartado (no cumplió)
  status text not null default 'participando' check (status in ('participando', 'ganador', 'descartado')),
  request_id uuid references public.invitation_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Una vez por WhatsApp en cada giveaway
  unique (giveaway_id, phone)
);

create index giveaway_entries_giveaway_idx on public.giveaway_entries (giveaway_id, created_at);

alter table public.giveaways enable row level security;
alter table public.giveaway_entries enable row level security;

create policy "admins manejan giveaways"
  on public.giveaways for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins manejan participantes"
  on public.giveaway_entries for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- La solicitud de un ganador nace con lo que eligió al registrarse (personaje,
-- fecha); el formulario lo muestra ya puesto. `data` sigue siendo solo lo que
-- manda el cliente.
alter table public.invitation_requests
  add column preset jsonb check (preset is null or jsonb_typeof(preset) = 'object');

create or replace function public.request_by_token(p_token text)
returns table (id uuid, event_type text, client_name text, state text, expires_at timestamptz, data jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.event_type,
    r.client_name,
    case when r.status = 'pendiente' and r.expires_at <= now() then 'vencida' else r.status end,
    r.expires_at,
    case when r.status = 'pendiente' and r.expires_at > now() then coalesce(r.data, r.preset) end
  from public.invitation_requests r
  where r.token = p_token;
$$;

-- ---------------------------------------------------------------------------
-- Registro público
-- ---------------------------------------------------------------------------

create function public.giveaway_by_token(p_token text)
returns table (id uuid, name text, announce_on date, open boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.announce_on, g.is_active and g.closes_at > now()
  from public.giveaways g
  where g.token = p_token;
$$;

-- 'ok' · 'duplicado' (ese WhatsApp ya participa) · 'cerrado'
create function public.enter_giveaway(p_token text, p_entry jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_giveaway uuid;
begin
  if p_entry is null or jsonb_typeof(p_entry) <> 'object' then
    raise exception 'Datos no válidos';
  end if;

  select g.id into v_giveaway
  from public.giveaways g
  where g.token = p_token and g.is_active and g.closes_at > now();
  if v_giveaway is null then
    return 'cerrado';
  end if;

  insert into public.giveaway_entries (giveaway_id, name, phone, facebook_name, event_type, theme_id, custom_theme, event_date)
  values (
    v_giveaway,
    p_entry->>'name',
    p_entry->>'phone',
    p_entry->>'facebook_name',
    p_entry->>'event_type',
    nullif(p_entry->>'theme_id', '')::uuid,
    nullif(p_entry->>'custom_theme', ''),
    nullif(p_entry->>'event_date', '')::date
  )
  on conflict (giveaway_id, phone) do nothing;

  return case when found then 'ok' else 'duplicado' end;
end;
$$;

revoke execute on function public.giveaway_by_token(text) from public;
revoke execute on function public.enter_giveaway(text, jsonb) from public;
grant execute on function public.giveaway_by_token(text) to anon, authenticated;
grant execute on function public.enter_giveaway(text, jsonb) to anon, authenticated;
