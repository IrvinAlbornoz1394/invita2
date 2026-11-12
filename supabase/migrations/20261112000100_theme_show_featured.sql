-- Show del tema y temas destacados en la landing.
--
--   themes.show      : { title, description, performers: [{ name, image_url }] }.
--                      La imagen sigue en show_url / show_style. Las invitaciones
--                      con show.source = "theme" usan todo el show del tema; con
--                      "custom", el suyo.
--   themes.featured  : true = aparece en la landing antes de «Ver todos».

alter table public.themes
  add column show jsonb not null default '{}'::jsonb check (jsonb_typeof(show) = 'object'),
  add column featured boolean not null default false;

-- Las invitaciones que ya escribieron su show lo conservan como personalizado;
-- las que lo dejaron vacío pasan a usar el del tema.
update public.invitations
  set show = show || jsonb_build_object(
    'source',
    case
      when coalesce(show->>'title', '') <> ''
        or coalesce(show->>'description', '') <> ''
        or jsonb_array_length(coalesce(show->'performers', '[]'::jsonb)) > 0
        or show->>'image_source' = 'custom'
      then 'custom'
      else 'theme'
    end
  )
  where not show ? 'source';
