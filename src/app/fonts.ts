import {
  Audiowide, Baloo_2, Bangers, Bubblegum_Sans, Bungee, Chewy, Cinzel_Decorative, Creepster, Fredoka, Lilita_One,
  Luckiest_Guy, Monoton, Orbitron, Pacifico, Poppins, Press_Start_2P, Rubik_Moonrocks, Rye, Sniglet, Titan_One,
} from "next/font/google";

// Lilita y Baloo son las de siempre; las demás solo se descargan si un tema las usa.
const lilita = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-lilita", display: "swap" });
const baloo = Baloo_2({ weight: ["500", "600", "700", "800"], subsets: ["latin"], variable: "--font-baloo", display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-luckiest", display: "swap", preload: false });
const titan = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-titan", display: "swap", preload: false });
const chewy = Chewy({ weight: "400", subsets: ["latin"], variable: "--font-chewy", display: "swap", preload: false });
const fredoka = Fredoka({ weight: "700", subsets: ["latin"], variable: "--font-fredoka", display: "swap", preload: false });
const bubblegum = Bubblegum_Sans({ weight: "400", subsets: ["latin"], variable: "--font-bubblegum", display: "swap", preload: false });

// Temáticas: solo se descargan si un tema las usa
const moonrocks = Rubik_Moonrocks({ weight: "400", subsets: ["latin"], variable: "--font-moonrocks", display: "swap", preload: false });
const bangers = Bangers({ weight: "400", subsets: ["latin"], variable: "--font-bangers", display: "swap", preload: false });
const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee", display: "swap", preload: false });
const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel", display: "swap", preload: false });
const rye = Rye({ weight: "400", subsets: ["latin"], variable: "--font-rye", display: "swap", preload: false });
const creepster = Creepster({ weight: "400", subsets: ["latin"], variable: "--font-creepster", display: "swap", preload: false });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], variable: "--font-pacifico", display: "swap", preload: false });
const monoton = Monoton({ weight: "400", subsets: ["latin"], variable: "--font-monoton", display: "swap", preload: false });
const audiowide = Audiowide({ weight: "400", subsets: ["latin"], variable: "--font-audiowide", display: "swap", preload: false });
const orbitron = Orbitron({ weight: "800", subsets: ["latin"], variable: "--font-orbitron", display: "swap", preload: false });
const cinzel = Cinzel_Decorative({ weight: "700", subsets: ["latin"], variable: "--font-cinzel", display: "swap", preload: false });
const sniglet = Sniglet({ weight: "800", subsets: ["latin"], variable: "--font-sniglet", display: "swap", preload: false });

// Marca invita2 (landing y panel)
const poppins = Poppins({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-poppins", display: "swap" });

export const fontVariables = [
  poppins, lilita, baloo, luckiest, titan, chewy, fredoka, bubblegum,
  moonrocks, bangers, bungee, pixel, rye, creepster, pacifico, monoton, audiowide, orbitron, cinzel, sniglet,
].map((f) => f.variable).join(" ");
