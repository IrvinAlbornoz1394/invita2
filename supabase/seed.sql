-- Datos de ejemplo solo para desarrollo local (npx supabase db reset).
insert into public.invitations
  (slug, published, theme_id, name_lines, age, age_text, photo_url, event_at, timezone,
   address, area, message, show, extras, gallery, sections)
values
(
  'lucero-k3f9a2', true, '00000000-0000-4000-8000-000000000001',
  array['Lucero', 'Jeamileth'], 1, 'Mi primer añito', null,
  '2026-11-13 16:00:00-06', 'America/Merida',
  'Calle 105 #416, por 52 y 50', 'Colonia Dolores Otero, Mérida, Yucatán',
  'Ven a compartir sonrisas y momentos inolvidables conmigo. Prepara tus ganas de bailar, jugar y pasarla increíble.',
  '{"enabled": false, "performers": []}', '[]', '[]', '{}'
),
(
  'demo-x7p2m9', true, '00000000-0000-4000-8000-000000000001',
  array['Sofía'], 5, '¡Cumplo 5 años!', '/temas/bely-beto/personajes/personaje-3.jpg',
  '2026-12-12 17:00:00-06', 'America/Merida',
  'Salón Arcoíris, Calle 60 #500', 'Centro, Mérida, Yucatán',
  'Habrá juegos, música y muchas sorpresas. ¡No faltes!',
  '{
    "enabled": true, "time": "19:00", "title": "Show de Bely y Beto",
    "description": "Canciones, bailes y concursos con los personajes favoritos de Sofía.",
    "performers": [
      {"name": "Bely", "image_url": "/temas/bely-beto/personajes/personaje-8.jpg"},
      {"name": "Beto", "image_url": "/temas/bely-beto/personajes/personaje-6.jpg"}
    ]
  }',
  '[
    {"emoji": "🎡", "label": "Miniferia", "note": "Juegos mecánicos para los peques"},
    {"emoji": "🏰", "label": "Brincolines", "note": ""},
    {"emoji": "🏊", "label": "Alberca", "note": "Trae tu traje de baño"},
    {"emoji": "🎨", "label": "Pintacaritas", "note": ""},
    {"emoji": "🍭", "label": "Mesa de dulces", "note": ""},
    {"emoji": "🪅", "label": "Piñata", "note": ""}
  ]',
  '[
    {"url": "/temas/bely-beto/personajes/personaje-1.jpg"},
    {"url": "/temas/bely-beto/personajes/personaje-3.jpg"},
    {"url": "/temas/bely-beto/grupo.jpg"},
    {"url": "/temas/bely-beto/personajes/personaje-7.jpg"}
  ]',
  '{}'
);
