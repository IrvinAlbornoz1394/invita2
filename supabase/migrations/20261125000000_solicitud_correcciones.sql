-- Pedir correcciones: el panel vuelve a abrir el formulario de una solicitud ya
-- recibida (con enlace nuevo y vigencia corta, p. ej. 24 h) y le deja al
-- cliente una nota con lo que hay que corregir. El cliente ve lo que ya había
-- llenado y lo vuelve a mandar; al enviarlo, el enlace se cierra otra vez.

alter table public.invitation_requests
  add column correction_note text check (correction_note is null or char_length(correction_note) <= 600);

-- Cambia lo que devuelve: hay que borrarla y crearla de nuevo
drop function public.request_by_token(text);

create function public.request_by_token(p_token text)
returns table (id uuid, event_type text, client_name text, state text, expires_at timestamptz, data jsonb, correction_note text)
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
    case when r.status = 'pendiente' and r.expires_at > now() then coalesce(r.data, r.preset) end,
    case when r.status = 'pendiente' and r.expires_at > now() then r.correction_note end
  from public.invitation_requests r
  where r.token = p_token;
$$;

revoke execute on function public.request_by_token(text) from public;
grant execute on function public.request_by_token(text) to anon, authenticated;
