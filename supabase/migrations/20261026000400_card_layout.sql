-- La tarjeta ahora pone la imagen arriba y el texto debajo (sin encimarse), así
-- que ya no hace falta saber dónde empezaba el espacio libre de la imagen.
alter table public.themes drop column card_text_top;

-- Bely y Beto: la imagen sin el espacio vacío de abajo
update public.themes
  set card_url = '/temas/bely-beto/tarjeta-personajes.jpg'
  where card_url = '/temas/bely-beto/tarjeta.jpg';
