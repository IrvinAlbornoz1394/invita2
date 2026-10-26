import { Baloo_2, Bubblegum_Sans, Chewy, Fredoka, Lilita_One, Luckiest_Guy, Titan_One } from "next/font/google";

// Lilita y Baloo son las de siempre; las demás solo se descargan si un tema las usa.
const lilita = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-lilita", display: "swap" });
const baloo = Baloo_2({ weight: ["500", "600", "700", "800"], subsets: ["latin"], variable: "--font-baloo", display: "swap" });
const luckiest = Luckiest_Guy({ weight: "400", subsets: ["latin"], variable: "--font-luckiest", display: "swap", preload: false });
const titan = Titan_One({ weight: "400", subsets: ["latin"], variable: "--font-titan", display: "swap", preload: false });
const chewy = Chewy({ weight: "400", subsets: ["latin"], variable: "--font-chewy", display: "swap", preload: false });
const fredoka = Fredoka({ weight: "700", subsets: ["latin"], variable: "--font-fredoka", display: "swap", preload: false });
const bubblegum = Bubblegum_Sans({ weight: "400", subsets: ["latin"], variable: "--font-bubblegum", display: "swap", preload: false });

export const fontVariables = [lilita, baloo, luckiest, titan, chewy, fredoka, bubblegum].map((f) => f.variable).join(" ");
