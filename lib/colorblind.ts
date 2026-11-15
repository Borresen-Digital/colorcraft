import { parseHex, toHex } from "./contrast";
import { hexToOklch } from "./tones";

/**
 * Fargeblindsimulering: hvordan fargene ser ut for noen med nedsatt
 * fargesyn.
 *
 * Matrisene er fra Machado, Oliveira og Fernandes (2009), «A Physiologically-
 * based Model for Simulation of Color Vision Deficiency», med full styrke
 * (dikromasi). De brukes på lineær sRGB. Akromatopsi (ingen fargesyn) er
 * bare lysheten.
 *
 * Samme matriser brukes to steder: i `simulate()` for fargene i tabellen, og
 * som SVG-filter (feColorMatrix, som regner i lineær RGB) for hele siden.
 */

export const VISIONS = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "achromatopsia",
] as const;
export type Vision = (typeof VISIONS)[number];

type M3 = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

const LUM = [0.2126, 0.7152, 0.0722] as const;

export const MATRICES: Record<Vision, M3> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
  achromatopsia: [LUM, LUM, LUM],
};

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const gamma = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
};

/** Fargen slik den ser ut med fargesynet, som HEX. */
export function simulate(hex: string, vision: Vision): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const v = [lin(rgb.r), lin(rgb.g), lin(rgb.b)];
  const [r, g, b] = MATRICES[vision].map(
    (rad) => rad[0] * v[0] + rad[1] * v[1] + rad[2] * v[2],
  );
  return toHex({ r: gamma(r), g: gamma(g), b: gamma(b) });
}

/** Verdiene til feColorMatrix (4×5, radvis). */
export function filterMatrix(vision: Vision): string {
  return [...MATRICES[vision].map((rad) => [...rad, 0, 0]), [0, 0, 0, 1, 0]]
    .flat()
    .join(" ");
}

/** Avstanden mellom to farger i OKLab. Rundt 0,02 er så vidt synlig. */
export function difference(a: string, b: string): number {
  const x = hexToOklch(a);
  const y = hexToOklch(b);
  if (!x || !y) return Infinity;
  const ab = (o: { c: number; h: number }) => [
    o.c * Math.cos((o.h * Math.PI) / 180),
    o.c * Math.sin((o.h * Math.PI) / 180),
  ];
  const [xa, xb] = ab(x);
  const [ya, yb] = ab(y);
  return Math.hypot(x.l - y.l, xa - ya, xb - yb);
}

/**
 * Under denne avstanden er to farger vanskelige å skille fra hverandre som
 * flater eller i et diagram.
 */
export const SIMILAR = 0.06;

export interface ColorRef {
  label: string;
  hex: string;
}

export interface SimilarPair {
  a: ColorRef;
  b: ColorRef;
  /** Avstanden med fargesynet. */
  distance: number;
}

/**
 * Par som er lette å skille med vanlig fargesyn, men blir for like med
 * dette fargesynet. Par som alt er like, er ikke med: det er et valg
 * designeren har gjort.
 */
export function similarPairs(
  farger: ColorRef[],
  vision: Vision,
): SimilarPair[] {
  const unike = farger.filter(
    (f, i) => farger.findIndex((g) => g.hex === f.hex) === i,
  );
  const ut: SimilarPair[] = [];
  for (let i = 0; i < unike.length; i++) {
    for (let j = i + 1; j < unike.length; j++) {
      const a = unike[i];
      const b = unike[j];
      if (difference(a.hex, b.hex) < SIMILAR) continue;
      const d = difference(simulate(a.hex, vision), simulate(b.hex, vision));
      if (d < SIMILAR) ut.push({ a, b, distance: d });
    }
  }
  return ut.sort((x, y) => x.distance - y.distance);
}
