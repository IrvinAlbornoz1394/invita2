-- Dirección corta de la demo de cada tema: /demo/bautizo-globos-aerostaticos
-- en vez de /demo/<uuid>. Los enlaces viejos con el id siguen funcionando
-- (la demo redirige a la dirección corta).

alter table public.themes add column slug text;

-- Los temas que ya existen toman su nombre: minúsculas, sin acentos, con guiones.
-- Si dos se llaman igual, el segundo lleva -2, el tercero -3…
with base as (
  select
    id,
    coalesce(
      nullif(
        trim(both '-' from regexp_replace(
          lower(translate(name, 'áéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ', 'aeiouunaeiouunaeiouaeiou')),
          '[^a-z0-9]+', '-', 'g'
        )),
        ''
      ),
      'tema'
    ) as s,
    created_at
  from public.themes
),
numbered as (
  select id, s, row_number() over (partition by s order by created_at, id) as n from base
)
update public.themes t
  set slug = left(case when n.n = 1 then n.s else n.s || '-' || n.n end, 48)
  from numbered n
  where n.id = t.id;

alter table public.themes
  alter column slug set not null,
  add constraint themes_slug_key unique (slug),
  add constraint themes_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 48);
