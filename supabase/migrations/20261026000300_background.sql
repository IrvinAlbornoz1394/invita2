-- Fondo de la portada, la intro y el pie:
--   { "style": "rays" | "gradient" | "dots" | "image", "from": "#hex", "to": "#hex", "image_url": "..." }
-- Los colores vacíos se calculan a partir de los colores del tema.
alter table public.themes
  add column background jsonb not null default '{}'::jsonb;
