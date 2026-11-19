-- Nuevo tipo de evento: posada. Invita una familia o un grupo (sin edad, sin
-- ceremonia ni padrinos), con papel picado, piñata de estrella y nieve.

alter table public.invitations drop constraint invitations_event_type_check;
alter table public.invitations add constraint invitations_event_type_check
  check (event_type in ('cumpleanos', 'bautizo', 'primera_comunion', 'posada'));

alter table public.themes drop constraint themes_event_type_check;
alter table public.themes add constraint themes_event_type_check
  check (event_type is null or event_type in ('cumpleanos', 'bautizo', 'primera_comunion', 'posada'));

-- Tema «Posada navideña»: rojo, verde pino y dorado, rayos verdes, regalo 3D
-- para abrir y copos de nieve que siguen cayendo. Sin ilustraciones: se
-- agregan desde el panel. Id fijo para poder volver a correr la migración.
insert into public.themes (id, name, slug, event_type, colors, title_font, background, intro, effects)
values (
  '00000000-0000-4000-8000-000000000102',
  'Posada navideña',
  'posada-navidena',
  'posada',
  '{"primary": "#c8282e", "secondary": "#1d7a50", "accent": "#d99a2b", "highlight": "#f6d06a", "surface": "#fff7ec", "ink": "#4a2016"}',
  'christmas',
  '{"style": "rays", "from": "#1d7a50", "to": "#24895c", "image_url": null, "soften": 8}',
  '{"style": "gift", "color": "#c8282e", "image_url": null}',
  '{"floaters": "snow", "keep": true}'
)
on conflict (id) do nothing;
