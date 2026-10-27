-- Coordenadas exactas del lugar ("lat,lng"), sacadas del enlace de Google Maps al
-- guardar. Con ellas "Cómo llegar" traza la ruta al pin exacto; si faltan, se usa
-- la dirección escrita.
alter table public.invitations add column maps_destination text;
