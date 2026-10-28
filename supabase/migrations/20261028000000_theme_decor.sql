-- Elementos flotantes por sección (2 a 3 imágenes PNG sin fondo):
--   { "details": ["url", ...], "extras": ["url", ...] }
-- "Aparta la fecha" los pone a la izquierda y "Lo que te espera" a la derecha.
alter table public.themes
  add column decor jsonb not null default '{}'::jsonb;
