-- Estilo de la imagen del show del tema: con marco o sin marco (PNG sin fondo).
-- Las invitaciones con imagen personalizada siguen usando su show.image_style.
alter table public.themes
  add column show_style text not null default 'framed'
  check (show_style in ('framed', 'plain'));
