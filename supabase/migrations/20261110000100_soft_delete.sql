-- Borrado lógico y activación.
--   invitations.is_active  : false = el enlace deja de funcionar (aunque esté publicada)
--   invitations.is_deleted : true  = ya no aparece en el panel ni en la página pública
--   themes.is_active       : false = no se ofrece para invitaciones nuevas ni en la landing/demo;
--                            las invitaciones que ya lo usan lo conservan
--   themes.is_deleted      : true  = ya no aparece en el panel; las invitaciones que lo usan lo conservan
-- Nada se borra de verdad: se puede recuperar cambiando el campo en la base.

alter table public.invitations
  add column is_active boolean not null default true,
  add column is_deleted boolean not null default false,
  add column deleted_at timestamptz;

alter table public.themes
  add column is_active boolean not null default true,
  add column is_deleted boolean not null default false,
  add column deleted_at timestamptz;

-- La página pública solo ve invitaciones publicadas, activas y no borradas
drop policy "invitaciones publicadas visibles para todos" on public.invitations;

create policy "invitaciones publicadas visibles para todos"
  on public.invitations for select to anon, authenticated
  using ((published and is_active and not is_deleted) or (select public.is_admin()));

-- El panel lista solo las no borradas, por fecha
create index invitations_live_event_at_idx on public.invitations (event_at) where not is_deleted;
