-- Confirmación: si se pregunta cuántas personas asisten. Las invitaciones
-- existentes siguen preguntando, como hasta ahora.
alter table public.invitations
  add column rsvp_ask_people boolean not null default true;
