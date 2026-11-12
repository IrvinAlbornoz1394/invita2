"use client";

import { useOptimistic, useTransition } from "react";
import { setThemeFeatured } from "./actions";
import { Switch } from "./Switch";

/** «Destacado en la landing» desde la lista de temas, sin entrar a editarlo. */
export function FeaturedSwitch({ id, featured, active }: { id: string; featured: boolean; active: boolean }) {
  const [pending, start] = useTransition();
  const [on, setOn] = useOptimistic(featured);

  return (
    <Switch
      checked={on}
      loading={pending}
      disabled={!active}
      label="Destacado"
      title={active ? "Aparece en la landing antes de «Ver todos»" : "Actívalo para poder destacarlo"}
      onChange={(next) =>
        start(async () => {
          setOn(next);
          await setThemeFeatured(id, next);
        })
      }
    />
  );
}
