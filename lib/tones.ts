import { parseHex, toHex } from "./contrast";

/**
 * Valør, varme og metning.
 *
 * Designere tenker i valør (lys og mørk), varme og kalde varianter og metning.
 * Alt her regnes i OKLCH: L er opplevd lyshet, C er metning (kroma) og H er
 * fargetone. I OKLCH ser to farger med samme L like lyse ut, så en varmere
 * variant blir faktisk like lys, ikke lysere slik den ofte blir i HSL.
 *
 * Farger som havner utenfor det skjermen kan vise, trekkes inn ved å senke
 * metningen til de passer, mens lyshet og fargetone beholdes.
 */

export type Oklch = { l: number; c: number; h: number };

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const gamma = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;

export function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const r = lin(rgb.r);
  const g = lin(rgb.g);
  const b = lin(rgb.b);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.hypot(A, B);
  const h = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c, h };
}

/** Lineær sRGB for en OKLCH-farge. Kan ligge utenfor 0–1. */
function oklchTilLin({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const innenfor = (x: [number, number, number]) =>
  x.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * HEX for en OKLCH-farge. Ligger den utenfor skjermens farger, senkes
 * metningen (binærsøk) til den passer, så lyshet og tone beholdes.
 */
export function oklchToHex(farge: Oklch): string {
  const l = Math.min(1, Math.max(0, farge.l));
  let c = Math.max(0, farge.c);
  if (!innenfor(oklchTilLin({ l, c, h: farge.h }))) {
    let lav = 0;
    let høy = c;
    for (let i = 0; i < 24; i++) {
      const midt = (lav + høy) / 2;
      if (innenfor(oklchTilLin({ l, c: midt, h: farge.h }))) lav = midt;
      else høy = midt;
    }
    c = lav;
  }
  const [r, g, b] = oklchTilLin({ l, c, h: farge.h });
  const kanal = (v: number) =>
    Math.round(
      Math.min(1, Math.max(0, gamma(Math.min(1, Math.max(0, v))))) * 255,
    );
  return toHex({ r: kanal(r), g: kanal(g), b: kanal(b) });
}

/** Lysheten i valørskalaen, fra lysest til mørkest. */
export const VALOR_STEPS = [
  0.97, 0.92, 0.85, 0.76, 0.67, 0.58, 0.49, 0.4, 0.31, 0.22,
];

export interface Tone {
  hex: string;
  /** Opplevd lyshet (OKLCH L), 0–1. */
  l: number;
  /** Dette er fargen selv, satt inn på sin plass i skalaen. */
  original?: boolean;
}

/**
 * Valørskala: samme fargetone i ti lysheter, med fargen selv satt inn der
 * den hører hjemme. Metningen følger fargen, men trekkes ned der skjermen
 * ikke kan vise den (helt lyst og helt mørkt).
 */
export function valorScale(hex: string): Tone[] {
  const o = hexToOklch(hex);
  if (!o) return [];
  const egen = parseHex(hex)!;
  const skala: Tone[] = VALOR_STEPS.filter(
    // Et trinn som ligger nesten oppå fargen selv, gir ingenting nytt.
    (l) => Math.abs(l - o.l) > 0.025,
  ).map((l) => ({ hex: oklchToHex({ l, c: o.c, h: o.h }), l }));
  skala.push({ hex: toHex(egen), l: o.l, original: true });
  return skala.sort((a, b) => b.l - a.l);
}

/** Fargetonene vi regner som varmest og kaldest (OKLCH H). */
export const WARM_HUE = 70;
export const COOL_HUE = 250;
/** Hvor langt en varm eller kald variant flytter fargetonen. */
export const HUE_SHIFT = 22;

/** Flytter fargetonen `steg` grader mot `mål` langs korteste vei. */
function mot(h: number, mål: number, steg: number): number {
  let d = ((mål - h + 540) % 360) - 180;
  if (Math.abs(d) < steg) return mål;
  d = Math.sign(d) * steg;
  return (h + d + 360) % 360;
}

export interface Variants {
  warmer: string;
  cooler: string;
  moreSaturated: string;
  lessSaturated: string;
}

/**
 * Varmere og kaldere variant med samme lyshet, og mer og mindre mettet.
 * En grå farge har ingen tone å flytte, så den får en svak varm eller kald
 * tone i stedet.
 */
export function variants(hex: string): Variants | null {
  const o = hexToOklch(hex);
  if (!o) return null;
  const grå = o.c < 0.02;
  const tone = (mål: number) =>
    grå
      ? oklchToHex({ l: o.l, c: 0.03, h: mål })
      : oklchToHex({ l: o.l, c: o.c, h: mot(o.h, mål, HUE_SHIFT) });
  return {
    warmer: tone(WARM_HUE),
    cooler: tone(COOL_HUE),
    moreSaturated: oklchToHex({ ...o, c: grå ? 0.05 : o.c * 1.3 }),
    lessSaturated: oklchToHex({ ...o, c: o.c * 0.55 }),
  };
}

/** Avstand i grader mellom to fargetoner, 0–180. */
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}
