-- Elementos flotantes configurables en el tema y en la invitación.
--
--   themes.effects      : { floaters, keep }
--                         floaters: balloon | hotair | bubble | petal | none
--                         keep: si siguen saliendo por toda la invitación
--                         null (o sin la llave) = lo de siempre del tipo de evento:
--                         cumpleaños globos que siguen; bautizo burbujas y
--                         comunión pétalos, solo en la portada.
--   invitations.effects : { source: theme | custom, intro, floaters, keep }
--                         "theme" usa la apertura y los elementos del tema;
--                         "custom", los propios.

alter table public.themes
  add column effects jsonb not null default '{}'::jsonb check (jsonb_typeof(effects) = 'object');

alter table public.invitations
  add column effects jsonb not null default '{"source": "theme"}'::jsonb check (jsonb_typeof(effects) = 'object');

-- El tema de globos aerostáticos: globos aerostáticos que siguen saliendo
update public.themes
  set effects = '{"floaters": "hotair", "keep": true}'::jsonb
  where id = '00000000-0000-4000-8000-000000000101';
