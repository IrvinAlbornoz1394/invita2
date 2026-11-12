-- Tema de bautizo «Globos aerostáticos»: tonos azul cielo con un toque dorado
-- (la canasta y el sol). Sin ilustraciones: se agregan desde el panel.
-- Id fijo para que la migración se pueda volver a correr sin duplicarlo.

insert into public.themes (id, name, event_type, colors, title_font, background, intro)
values (
  '00000000-0000-4000-8000-000000000101',
  'Bautizo globos aerostáticos',
  'bautizo',
  '{"primary": "#3b82c4", "secondary": "#9ccbee", "accent": "#e9b04f", "highlight": "#fbe3a6", "surface": "#f3f9ff", "ink": "#21405f"}',
  'alexbrush',
  '{"style": "gradient", "from": "#a9d5f5", "to": "#f5faff", "image_url": null, "soften": 15}',
  '{"style": "balloon", "color": "#7fbbe8", "image_url": null}'
)
on conflict (id) do nothing;
