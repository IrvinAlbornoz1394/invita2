"use client";

import { useState } from "react";
import type { InvitationView } from "@/lib/view";
import { burstFrom, type Fx } from "./effects";
import { Icon } from "./icons";

const MAX_PEOPLE = 15;

export function Rsvp({ view, fx }: { view: InvitationView; fx: Fx }) {
  const [attending, setAttending] = useState(true);
  const [people, setPeople] = useState(1);

  const clamp = (v: number) => Math.min(MAX_PEOPLE, Math.max(1, v || 1));

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = String(new FormData(form).get("nombre") ?? "").trim();
    const of = `${view.toEvent} de ${view.fullName}`;
    const count = view.rsvpAskPeople ? ` Asistiremos ${people} ${people === 1 ? "persona" : "personas"}.` : "";
    const msg = attending
      ? `¡Hola! Soy ${name} y confirmo mi asistencia ${of} el ${view.shortDate}.${count}`
      : `¡Hola! Soy ${name}. Lamentablemente no podré asistir ${of}. ¡Muchas felicidades!`;
    burstFrom(fx, form.querySelector("[type=submit]")!, 90, 0);
    window.open(`https://wa.me/${view.whatsapp ?? ""}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <form className="rsvp" data-reveal="up" onSubmit={submit}>
      <label className="field">
        <span>Tu nombre</span>
        <input name="nombre" required autoComplete="name" placeholder="Ej. Familia Pérez" />
      </label>
      <div className="choice" role="radiogroup" aria-label="Asistencia" data-on={attending ? "yes" : "no"}>
        <span className="choice__thumb" aria-hidden="true" />
        <label>
          <input type="radio" name="asiste" checked={attending} onChange={() => setAttending(true)} />
          <span>¡Sí voy!</span>
        </label>
        <label>
          <input type="radio" name="asiste" checked={!attending} onChange={() => setAttending(false)} />
          <span>No podré</span>
        </label>
      </div>
      {attending && view.rsvpAskPeople && (
        <div className="field">
          <span id="personas-label">¿Cuántos vienen?</span>
          <div className="stepper">
            <button type="button" onClick={() => setPeople((p) => clamp(p - 1))} aria-label="Menos">
              −
            </button>
            <input
              className="stepper__value"
              aria-labelledby="personas-label"
              type="number"
              min={1}
              max={MAX_PEOPLE}
              value={people}
              inputMode="numeric"
              onChange={(e) => setPeople(clamp(parseInt(e.target.value, 10)))}
            />
            <button type="button" onClick={() => setPeople((p) => clamp(p + 1))} aria-label="Más">
              +
            </button>
          </div>
        </div>
      )}
      <button className="btn btn--primary btn--block" type="submit">
        <Icon name="whatsapp" />
        Confirmar por WhatsApp
      </button>
    </form>
  );
}
