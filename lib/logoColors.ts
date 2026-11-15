import { parseHex, toHex } from "./contrast";
import { hexToOklch } from "./tones";

/**
 * Fargene i en logo, lest fra pikslene i nettleseren (2f: palett fra logo).
 *
 * En logo har få, rene farger, men kantene er glattet og gir mange
 * mellomfarger i små mengder. Pikslene grupperes derfor i to trinn: først i
 * grove bøtter (5 bit per kanal), så slås bøtter som ser like ut (OKLab)
 * sammen. Fargen som vises, er den største bøtta i gruppen, ikke snittet, så
 * kantpikslene ikke trekker fargen mot bakgrunnen. En liten gruppe som er en
 * blanding av to større (kanten mellom dem), legges til den nærmeste, og
 * grupper under 1,5 % er støy og tas ikke med.
 *
 * Gjennomsiktige piksler og en hvit bakgrunn telles ikke. Svart og grått tas
 * med, men merkes som nøytrale, siden de sjelden er selve merkefargen.
 */

export interface LogoColor {
  hex: string;
  /** Andel av logoens piksler (uten bakgrunn), 0–1. */
  share: number;
  /** Svart, hvitt eller grått (nesten uten metning). */
  neutral: boolean;
}

const LIK = 0.06;
const MIN_ANDEL = 0.015;

type Bøtte = { r: number; g: number; b: number; n: number };
type Gruppe = { hex: string; lab: [number, number, number]; n: number };

const lab = (hex: string): [number, number, number] => {
  const o = hexToOklch(hex)!;
  const rad = (o.h * Math.PI) / 180;
  return [o.l, o.c * Math.cos(rad), o.c * Math.sin(rad)];
};

/** Avstand i sRGB (0–255) som fortsatt regnes som «på linjen». */
const BLANDING = 14;

/**
 * Er `g` en blanding av to større grupper? Nettleseren glatter i sRGB, så
 * linjen regnes der. Bare grupper under halvparten av begge naboene kan være
 * en blanding, så en ekte mellomfarge med tyngde i logoen beholdes.
 */
function blandingAv(g: Gruppe, større: Gruppe[]): Gruppe | null {
  const p = parseHex(g.hex)!;
  for (let i = 0; i < større.length; i++) {
    for (let j = i + 1; j < større.length; j++) {
      const a = større[i];
      const b = større[j];
      if (g.n * 2 > Math.min(a.n, b.n)) continue;
      const pa = parseHex(a.hex)!;
      const pb = parseHex(b.hex)!;
      const d = [pb.r - pa.r, pb.g - pa.g, pb.b - pa.b];
      const lengde2 = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
      if (lengde2 === 0) continue;
      const t =
        ((p.r - pa.r) * d[0] + (p.g - pa.g) * d[1] + (p.b - pa.b) * d[2]) /
        lengde2;
      if (t <= 0 || t >= 1) continue;
      const avstand = Math.hypot(
        pa.r + t * d[0] - p.r,
        pa.g + t * d[1] - p.g,
        pa.b + t * d[2] - p.b,
      );
      if (avstand < BLANDING) return t < 0.5 ? a : b;
    }
  }
  return null;
}

/** `data` er RGBA-piksler, som fra getImageData. */
export function extractColors(data: ArrayLike<number>, max = 6): LogoColor[] {
  const bøtter = new Map<number, Bøtte>();
  for (let i = 0; i + 3 < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    const bø = bøtter.get(k);
    if (bø) {
      bø.r += r;
      bø.g += g;
      bø.b += b;
      bø.n++;
    } else bøtter.set(k, { r, g, b, n: 1 });
  }

  const grupper: Gruppe[] = [];
  const sortert = [...bøtter.values()].sort((a, b) => b.n - a.n);
  for (const bø of sortert) {
    const hex = toHex({
      r: Math.round(bø.r / bø.n),
      g: Math.round(bø.g / bø.n),
      b: Math.round(bø.b / bø.n),
    });
    const l = lab(hex);
    const lik = grupper.find(
      (g) =>
        Math.hypot(g.lab[0] - l[0], g.lab[1] - l[1], g.lab[2] - l[2]) < LIK,
    );
    if (lik) lik.n += bø.n;
    else grupper.push({ hex, lab: l, n: bø.n });
  }

  // Glattede kanter blander to nabofarger (også bakgrunnen). En liten gruppe
  // som ligger på linjen mellom to større, er en slik blanding og legges til
  // den nærmeste av dem.
  const ekte: Gruppe[] = [];
  for (const g of grupper) {
    const blanding = blandingAv(g, ekte);
    if (blanding) blanding.n += g.n;
    else ekte.push(g);
  }

  // Hvit bakgrunn (vanlig i JPG og PNG uten gjennomsiktighet) telles ikke.
  const hvit = (g: Gruppe) =>
    g.lab[0] > 0.95 && Math.hypot(g.lab[1], g.lab[2]) < 0.03;
  const igjen = ekte.filter((g) => !hvit(g));
  const sum = igjen.reduce((a, g) => a + g.n, 0);
  if (sum === 0) return [];

  return igjen
    .map((g) => ({
      hex: g.hex,
      share: g.n / sum,
      neutral: Math.hypot(g.lab[1], g.lab[2]) < 0.03,
    }))
    .filter((c) => c.share >= MIN_ANDEL)
    .sort((a, b) => b.share - a.share)
    .slice(0, max);
}

/**
 * Logofargene et forslag bør starte med: de fargerike, største først. Har
 * logoen bare svart og grått, brukes den største av dem.
 */
export function suggestLogoColors(colors: LogoColor[], max = 3): string[] {
  const fargerike = colors.filter((c) => !c.neutral).map((c) => c.hex);
  if (fargerike.length > 0) return fargerike.slice(0, max);
  return colors.slice(0, 1).map((c) => c.hex);
}
