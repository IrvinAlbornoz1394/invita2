-- Tipos de evento: cumpleaños, bautizo y primera comunión.
-- Cada invitación tiene su tipo (textos de ejemplo, extras y datos propios);
-- cada tema puede marcarse para un tipo (null = sirve para cualquiera).

alter table public.invitations
  add column event_type text not null default 'cumpleanos'
  check (event_type in ('cumpleanos', 'bautizo', 'primera_comunion'));

alter table public.themes
  add column event_type text
  check (event_type is null or event_type in ('cumpleanos', 'bautizo', 'primera_comunion'));

-- Papás y padrinos: { "parents": ["…"], "godparents": ["…"] }
alter table public.invitations
  add column family jsonb not null default '{}'::jsonb
  check (jsonb_typeof(family) = 'object');

-- Ceremonia religiosa antes de la recepción:
-- { enabled, time: "12:00", place, address, maps_url, destination: "lat,lng" }
alter table public.invitations
  add column ceremony jsonb not null default '{"enabled": false}'::jsonb
  check (jsonb_typeof(ceremony) = 'object');

-- Temas iniciales para los eventos religiosos (sin ilustraciones: se agregan en el panel)
insert into public.themes (name, event_type, colors, title_font, background, intro)
values
(
  'Bautizo celeste', 'bautizo',
  '{"primary": "#4a7fb5", "secondary": "#8fb8de", "accent": "#c9a24d", "highlight": "#e9d9a6", "surface": "#f5f9fd", "ink": "#2c3e55"}',
  'greatvibes',
  '{"style": "gradient", "from": "#cfe3f5", "to": "#f7fbff", "image_url": null, "soften": 20}',
  '{"style": "envelope", "color": null, "image_url": null}'
),
(
  'Bautizo rosa', 'bautizo',
  '{"primary": "#c46b8a", "secondary": "#e8a9bd", "accent": "#c9a24d", "highlight": "#f1dcb0", "surface": "#fdf6f8", "ink": "#4f2f3c"}',
  'parisienne',
  '{"style": "gradient", "from": "#f6d6e1", "to": "#fff8fa", "image_url": null, "soften": 20}',
  '{"style": "envelope", "color": null, "image_url": null}'
),
(
  'Primera Comunión dorado', 'primera_comunion',
  '{"primary": "#a8842c", "secondary": "#6f8fa8", "accent": "#c9a24d", "highlight": "#efe2bb", "surface": "#fdfaf2", "ink": "#3d3423"}',
  'pinyon',
  '{"style": "gradient", "from": "#efe2bb", "to": "#fffdf6", "image_url": null, "soften": 20}',
  '{"style": "book", "color": null, "image_url": null}'
);
