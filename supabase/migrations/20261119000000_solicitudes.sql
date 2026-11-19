-- Solicitudes: el panel genera un enlace con token y vigencia para un cliente
-- (nombre, teléfono y tipo de evento fijos) y el cliente llena desde ahí los
-- datos de su evento. Lo que manda se guarda en `data`; al aprobarla, el panel
-- crea la invitación (sin publicar) para terminar de configurarla y publicarla.
--
-- El cliente nunca toca las tablas: solo las funciones de abajo, que buscan la
-- solicitud por su token.

create table public.invitation_requests (
  id uuid primary key default gen_random_uuid(),
  -- Va en el enlace: /solicitud/<tipo>/<token>. Al azar, 192 bits.
  token text not null unique check (char_length(token) >= 32),
  event_type text not null check (event_type in ('cumpleanos', 'bautizo', 'primera_comunion', 'posada')),
  client_name text not null check (char_length(client_name) between 1 and 120),
  client_phone text not null check (client_phone ~ '^[0-9]{8,15}$'),
  -- pendiente: enlace enviado · recibida: el cliente ya mandó sus datos
  -- aprobada: ya tiene invitación · rechazada: no sigue (se puede renovar el enlace)
  status text not null default 'pendiente' check (status in ('pendiente', 'recibida', 'aprobada', 'rechazada')),
  expires_at timestamptz not null,
  -- Lo que llenó el cliente (se valida en el servidor antes de guardarlo y al aprobar)
  data jsonb check (data is null or jsonb_typeof(data) = 'object'),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  invitation_id uuid references public.invitations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitation_requests_created_at_idx on public.invitation_requests (created_at desc);

create trigger invitation_requests_updated_at
  before update on public.invitation_requests
  for each row execute function public.set_updated_at();

alter table public.invitation_requests enable row level security;

create policy "admins ven solicitudes"
  on public.invitation_requests for select to authenticated
  using ((select public.is_admin()));

create policy "admins crean solicitudes"
  on public.invitation_requests for insert to authenticated
  with check ((select public.is_admin()));

create policy "admins editan solicitudes"
  on public.invitation_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "admins borran solicitudes"
  on public.invitation_requests for delete to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Formulario público
-- ---------------------------------------------------------------------------

-- Lo justo para mostrar el formulario. `state` ya trae «vencida» calculado; los
-- datos anteriores solo vuelven si el enlace sigue abierto (enlace renovado).
create function public.request_by_token(p_token text)
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
    case when r.status = 'pendiente' and r.expires_at > now() then r.data end
  from public.invitation_requests r
  where r.token = p_token;
$$;

-- Guarda lo que mandó el cliente si el enlace sigue abierto; después ya no se
-- puede cambiar. Devuelve false si el enlace venció, ya se usó o no existe.
create function public.submit_request(p_token text, p_data jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 20000 then
    raise exception 'Datos no válidos';
  end if;

  update public.invitation_requests
    set data = p_data, status = 'recibida', submitted_at = now()
    where token = p_token and status = 'pendiente' and expires_at > now();
  return found;
end;
$$;

-- Fotos del cliente: solo en solicitudes/<id de su solicitud>/ y mientras el
-- enlace esté abierto. El id solo lo conoce quien tiene el token.
create function public.request_accepts_uploads(p_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.invitation_requests r
    where r.id::text = p_id and r.status = 'pendiente' and r.expires_at > now()
  );
$$;

revoke execute on function public.request_by_token(text) from public;
revoke execute on function public.submit_request(text, jsonb) from public;
revoke execute on function public.request_accepts_uploads(text) from public;
grant execute on function public.request_by_token(text) to anon, authenticated;
grant execute on function public.submit_request(text, jsonb) to anon, authenticated;
grant execute on function public.request_accepts_uploads(text) to anon, authenticated;

create policy "clientes suben fotos a su solicitud abierta"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'solicitudes'
    and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
    and public.request_accepts_uploads((storage.foldername(name))[2])
  );
