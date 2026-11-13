import { parseHex, toHex, type Rgb } from "./contrast";

/**
 * CMYK, omtrentlig.
 *
 * Riktig CMYK krever en fargeprofil (ICC) for papiret og trykket. Det har vi
 * ikke i nettleseren, og vi later ikke som. Men den vanlige formelen
 * (C = 1 − R …) er verre enn ingenting for en designer: den sier at C100 er
 * #00FFFF, mens prosessblå på bestrøket papir ser ut som omtrent #00A0E3.
 * En profilmanual i CMYK ville da gitt helt feil farger på skjermen.
 *
 * Her brukes i stedet en enkel trykkmodell (Neugebauer med Yule-Nielsen):
 * skjermfargen til hver av de åtte kombinasjonene av C, M og Y på 0 % og
 * 100 %, og til K100, slik de er kjent fra Coated FOGRA39 (ISO 12647-2,
 * vanlig offset på bestrøket papir). Mellomverdiene interpoleres. Det treffer
 * hele trykkfarger godt og mellomtoner omtrent, og det er nok til å komme fra
 * en manual til skjermen. Til trykk gjelder verdiene fra trykkeriets profil.
 */

export type Cmyk = { c: number; m: number; y: number; k: number };

/** Skjermfargen til trykkfargene i Coated FOGRA39, omtrentlig (sRGB). */
const PRIMÆR = {
  w: "#FFFFFF",
  c: "#00A0E3",
  m: "#E6007E",
  y: "#FFED00",
  cm: "#312783",
  cy: "#009640",
  my: "#E30613",
  cmy: "#2C2A29",
  k: "#1D1D1B",
} as const;

/** Yule-Nielsen-faktor: tar høyde for punktforstørrelse i mellomtonene. */
const N = 2;

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const gamma = (v: number) => {
  const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
};

type Lin = [number, number, number];
const tilLin = (hex: string): Lin => {
  const { r, g, b } = parseHex(hex)!;
  return [lin(r), lin(g), lin(b)];
};
const P = Object.fromEntries(
  Object.entries(PRIMÆR).map(([k, v]) => [k, tilLin(v)]),
) as Record<keyof typeof PRIMÆR, Lin>;

const klamp = (v: number) => Math.min(100, Math.max(0, v));

/** Lineært lys (0–1 per kanal) for en CMYK-verdi i prosent. */
function cmykTilLin({ c, m, y, k }: Cmyk): Lin {
  const C = klamp(c) / 100;
  const M = klamp(m) / 100;
  const Y = klamp(y) / 100;
  const K = klamp(k) / 100;
  // Demichel-vekter: hvor stor del av flaten hver kombinasjon dekker.
  const vekter: [number, Lin][] = [
    [(1 - C) * (1 - M) * (1 - Y), P.w],
    [C * (1 - M) * (1 - Y), P.c],
    [(1 - C) * M * (1 - Y), P.m],
    [(1 - C) * (1 - M) * Y, P.y],
    [C * M * (1 - Y), P.cm],
    [C * (1 - M) * Y, P.cy],
    [(1 - C) * M * Y, P.my],
    [C * M * Y, P.cmy],
  ];
  const ut: Lin = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    let sum = 0;
    for (const [w, p] of vekter) sum += w * p[i] ** (1 / N);
    // Svart legges oppå som et eget lag: refleksjonen ganges med K-laget.
    const kLag = 1 - K + K * P.k[i] ** (1 / N);
    ut[i] = (sum * kLag) ** N;
  }
  return ut;
}

export function cmykToRgb(cmyk: Cmyk): Rgb {
  const [r, g, b] = cmykTilLin(cmyk);
  return { r: gamma(r), g: gamma(g), b: gamma(b) };
}

export function cmykToHex(cmyk: Cmyk): string {
  return toHex(cmykToRgb(cmyk));
}

// ---------- Tilbake: fra skjerm til omtrentlig CMYK ----------

/** OKLab, for å måle hvor like to farger ser ut. */
function oklab([r, g, b]: Lin): Lin {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const avstand = (a: Lin, b: Lin) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/**
 * Avstand i OKLab der to farger begynner å se ulike ut side om side. Over
 * dette kan fargen ikke trykkes helt likt i CMYK.
 */
export const GAMUT_LIMIT = 0.04;

export interface CmykResult {
  cmyk: Cmyk;
  /** Hvor langt unna den nærmeste trykkbare fargen er (OKLab). */
  distance: number;
  /** Fargen lar seg ikke trykke helt likt. */
  outOfGamut: boolean;
}

const cache = new Map<string, CmykResult>();

/**
 * Omtrentlig CMYK for en skjermfarge: den CMYK-verdien i modellen over som
 * ser mest lik ut. Svart (K) settes først ut fra hvor mørk fargen er, slik
 * trykkerier gjør (GCR), og C, M og Y søkes ut. Gir hele prosent.
 */
export function hexToCmyk(hex: string): CmykResult | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const nøkkel = toHex(rgb);
  const lagret = cache.get(nøkkel);
  if (lagret) return lagret;

  const mål = oklab([lin(rgb.r), lin(rgb.g), lin(rgb.b)]);
  const feil = (x: Cmyk) => avstand(oklab(cmykTilLin(x)), mål);

  // Svart ut fra hvor mørk fargen er, med litt slakk så lyse farger får 0.
  const mørkhet = 1 - Math.max(rgb.r, rgb.g, rgb.b) / 255;
  const k = Math.round(klamp(((mørkhet - 0.25) / 0.75) * 85));

  // Grovt søk i steg på 10 %, så finere rundt det beste.
  let best: Cmyk = { c: 0, m: 0, y: 0, k };
  let bestFeil = feil(best);
  const søk = (sentrum: Cmyk, steg: number, radius: number) => {
    for (let c = sentrum.c - radius; c <= sentrum.c + radius; c += steg)
      for (let m = sentrum.m - radius; m <= sentrum.m + radius; m += steg)
        for (let y = sentrum.y - radius; y <= sentrum.y + radius; y += steg) {
          if (c < 0 || m < 0 || y < 0 || c > 100 || m > 100 || y > 100)
            continue;
          const x = { c, m, y, k };
          const e = feil(x);
          if (e < bestFeil) {
            bestFeil = e;
            best = x;
          }
        }
  };
  søk({ c: 50, m: 50, y: 50, k }, 10, 50);
  søk(best, 2, 10);
  søk(best, 1, 2);
  // Er fargen mørk, kan litt mer eller mindre svart treffe bedre.
  for (const dk of [-10, -5, 5, 10]) {
    const kk = Math.round(klamp(k + dk));
    const x = { ...best, k: kk };
    const e = feil(x);
    if (e < bestFeil) {
      bestFeil = e;
      best = x;
    }
  }

  const resultat: CmykResult = {
    cmyk: best,
    distance: bestFeil,
    outOfGamut: bestFeil > GAMUT_LIMIT,
  };
  cache.set(nøkkel, resultat);
  return resultat;
}

/** «0 25 100 0», «0/25/100/0», «0,25,100,0» eller med %. Gir null ellers. */
export function parseCmyk(s: string): Cmyk | null {
  const tall = s
    .replace(/%/g, " ")
    .split(/[\s,;/]+/)
    .filter(Boolean)
    .map(Number);
  if (tall.length !== 4 || tall.some((n) => !Number.isFinite(n))) return null;
  if (tall.some((n) => n < 0 || n > 100)) return null;
  const [c, m, y, k] = tall;
  return { c, m, y, k };
}

export function formatCmyk({ c, m, y, k }: Cmyk): string {
  return `${Math.round(c)} ${Math.round(m)} ${Math.round(y)} ${Math.round(k)}`;
}

/** Hvor ulike to skjermfarger ser ut (OKLab). Under GAMUT_LIMIT ser de like ut. */
export function colorDistance(a: string, b: string): number | null {
  if (!parseHex(a) || !parseHex(b)) return null;
  return avstand(oklab(tilLin(a)), oklab(tilLin(b)));
}
