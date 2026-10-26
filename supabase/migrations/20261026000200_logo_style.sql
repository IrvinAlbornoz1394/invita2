-- Cómo se muestra el logo en la portada:
--   badge: recuadro con borde blanco y fondo (para logos con fondo propio)
--   plain: el logo tal cual, sin recortar (para PNG con transparencia)
alter table public.themes
  add column logo_style text not null default 'badge'
  check (logo_style in ('badge', 'plain'));
