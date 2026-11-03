-- Imagen del show del tema: la invitación la usa por defecto
-- (show.image_source = "theme") o carga la suya (show.image_source = "custom",
-- con show.image_url, que puede quedar vacía para no mostrar imagen).
alter table public.themes
  add column show_url text;

-- Las invitaciones que ya tenían imagen propia la conservan
update public.invitations
  set show = show || '{"image_source": "custom"}'::jsonb
  where coalesce(show->>'image_url', '') <> '';
