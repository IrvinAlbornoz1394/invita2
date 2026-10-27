-- Cómo se abre la invitación:
--   { "style": "gift" | "balloon" | "image", "color": "#hex", "image_url": "..." }
-- gift = regalo (por defecto) · balloon = globo que se revienta · image = imagen propia
-- que flota y estalla al tocarla (placa, huevo de dinosaurio, logo…)
alter table public.themes
  add column intro jsonb not null default '{}'::jsonb;

-- La imagen del show (show.image_url / show.image_style) vive en el jsonb de la
-- invitación; no requiere cambios de esquema.
