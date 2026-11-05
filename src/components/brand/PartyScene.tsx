export type PartySceneClasses = {
  scene?: string;
  strings?: string;
  popA?: string;
  popB?: string;
  flame?: string;
  dotA?: string;
  dotB?: string;
  ribbon?: string;
};

/** Silueta de fiesta (regalos, pastel, banderines y globos) para cerrar una página sobre una franja de color.
 * Las formas sin clase toman el `fill` del <svg>; cada quien pone sus colores con `classes`. */
export function PartyScene({ classes: c }: { classes: PartySceneClasses }) {
  return (
    <svg className={c.scene} viewBox="0 0 400 100" aria-hidden="true">
      {/* hilos de los globos y banderines */}
      <g className={c.strings}>
        <path d="M58 46c-2 10 4 16 2 26M72 39c2 12-6 20-8 33" />
        <path d="M292 49c4 10 10 18 13 31M308 41c0 14-2 24-3 39M322 53c-4 10-12 18-17 27" />
        <path d="M265 26c-3 6 3 10 0 16s2 10 0 14" />
        <path d="M160 50Q205 66 250 46" />
      </g>
      {/* globos de color */}
      <ellipse className={c.popA} cx="58" cy="36" rx="8" ry="10" />
      <ellipse className={c.popB} cx="72" cy="29" rx="8" ry="10" />
      {/* suelo con lomas */}
      <path d="M0 100V84c40-8 80-4 120-2 50 3 100-8 150-4s90 4 130-2v24z" />
      {/* regalos */}
      <rect x="18" y="64" width="32" height="20" rx="1.5" />
      <rect x="16" y="59" width="36" height="6" rx="1.5" />
      <ellipse cx="28.5" cy="55.5" rx="6" ry="3.6" transform="rotate(-24 28.5 55.5)" />
      <ellipse cx="39.5" cy="55.5" rx="6" ry="3.6" transform="rotate(24 39.5 55.5)" />
      <rect x="54" y="72" width="18" height="12" rx="1" />
      <rect x="52" y="68.5" width="22" height="4.5" rx="1" />
      {/* gorro de fiesta */}
      <path d="M78 83h15l-7.5-24z" />
      <circle cx="85.5" cy="57" r="3.2" />
      {/* pastel con velas */}
      <rect x="106" y="68" width="44" height="16" rx="2.5" />
      <rect x="114" y="56" width="28" height="13" rx="2.5" />
      <rect x="120.5" y="46" width="2.6" height="10" rx="1" />
      <rect x="126.7" y="44" width="2.6" height="12" rx="1" />
      <rect x="132.9" y="46" width="2.6" height="10" rx="1" />
      <ellipse className={c.flame} cx="121.8" cy="42.6" rx="1.7" ry="2.8" />
      <ellipse className={c.flame} cx="128" cy="40.6" rx="1.7" ry="2.8" />
      <ellipse className={c.flame} cx="134.2" cy="42.6" rx="1.7" ry="2.8" />
      {/* banderines */}
      <rect x="158.8" y="48" width="2.4" height="34" rx="1" />
      <rect x="248.8" y="44" width="2.4" height="38" rx="1" />
      <path d="M168.5 54h10l-5 11zM183.8 56.5h10l-5 11zM200 57h10l-5 11zM216.2 55h10l-5 11zM231.5 51.2h10l-5 11z" />
      {/* globo solitario */}
      <ellipse cx="265" cy="17" rx="7.5" ry="9" />
      <path d="M263 26h4l-2 2.6z" />
      {/* racimo de globos */}
      <ellipse cx="292" cy="40" rx="9" ry="11" />
      <ellipse cx="308" cy="31" rx="9" ry="11" />
      <ellipse cx="322" cy="44" rx="9" ry="11" />
      {/* paleta */}
      <rect x="348.8" y="58" width="2.6" height="26" rx="1" />
      <circle cx="350" cy="50" r="10" />
      {/* regalo chico */}
      <rect x="366" y="69" width="20" height="14" rx="1" />
      <rect x="364" y="65.5" width="24" height="4.5" rx="1" />
      <rect x="374.6" y="65.5" width="2.8" height="18" className={c.ribbon} />
      {/* confeti */}
      <circle className={c.dotA} cx="98" cy="34" r="2" />
      <circle className={c.dotB} cx="150" cy="26" r="1.8" />
      <rect className={c.dotA} x="228" y="24" width="4" height="4" rx="1" transform="rotate(30 230 26)" />
      <circle className={c.dotB} cx="340" cy="22" r="2" />
      <rect className={c.dotB} x="30" y="30" width="4" height="4" rx="1" transform="rotate(-20 32 32)" />
      <circle className={c.dotA} cx="382" cy="40" r="1.8" />
    </svg>
  );
}
