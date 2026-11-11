import type { ColorPalette } from "@/types/palette";
import {
  contrastRatio,
  hslToRgb,
  parseHex,
  rgbToHsl,
  suggestPassingColor,
  toHex,
  type Hsl,
} from "./contrast";

/**
 * Palett fra en profilmanual.
 *
 * Designere starter ikke med 14 roller, men med merket: noen logofarger og
 * noen støttefarger. Logofargen brukes til det som skal vises (knapper,
 * overskrifter, highlight). Støttefargene er flatefarger: heldekkende
 * seksjoner, infobokser og bakteppet logoen skal stå frem mot.
 *
 * Merkefargene endres ikke i lys modus. Det er resten (tekst, muted, kanter,
 * bakgrunn og statusfarger) som tilpasses, slik at kontrasten består. I mørk
 * modus kan en logofarge måtte lysnes for å synes. Det står da i `notes`.
 */

type Colors = ColorPalette["colors"];
type Role = keyof Colors;

export interface BrandInput {
  /** 1–3 logofarger. Den første er hovedfargen. */
  logo: string[];
  /** 0–4 støttefarger, flatefarger fra manualen. */
  support: string[];
}

export type BrandNote =
  | { kind: "adjusted-dark"; role: Role; from: string; to: string }
  | { kind: "low-contrast-light"; role: Role; color: string; ratio: number };

export interface BrandResult {
  light: Colors;
  dark: Colors;
  notes: BrandNote[];
}

export const MAX_LOGO = 3;
export const MAX_SUPPORT = 4;

/** Normaliserer til #RRGGBB, eller null hvis det ikke er en farge. */
export function normalizeHex(s: string): string | null {
  const rgb = parseHex(s);
  return rgb ? toHex(rgb) : null;
}

function hsl(hex: string): Hsl {
  return rgbToHsl(parseHex(hex)!);
}

function fromHsl(h: number, s: number, l: number): string {
  return toHex(
    hslToRgb({
      h: ((h % 1) + 1) % 1,
      s: Math.min(1, Math.max(0, s)),
      l: Math.min(1, Math.max(0, l)),
    }),
  );
}

/** Blander to farger i sRGB. t = 0 gir a, t = 1 gir b. */
export function mix(a: string, b: string, t: number): string {
  const x = parseHex(a)!;
  const y = parseHex(b)!;
  return toHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  });
}

/**
 * Justerer lysheten på `color` til den når `target` mot alle flatene i
 * `against`. Prøver flere ganger, fordi en justering mot én flate kan gjøre
 * det verre mot en annen. Gir null hvis det ikke går.
 */
export function ensureContrast(
  color: string,
  against: string[],
  target: number,
): string | null {
  let c = color;
  for (let i = 0; i < 6; i++) {
    const verst = against.reduce((v, bg) =>
      (contrastRatio(c, bg) ?? 0) < (contrastRatio(c, v) ?? 0) ? bg : v,
    );
    if ((contrastRatio(c, verst) ?? 0) >= target) return c;
    const neste = suggestPassingColor(c, verst, target);
    if (!neste) return null;
    c = neste;
  }
  return against.every((bg) => (contrastRatio(c, bg) ?? 0) >= target)
    ? c
    : null;
}

/** Høyest mulig av målene (7, så 4,5) uten å gi opp. */
function textOn(base: string, against: string[], targets: number[]): string {
  for (const t of targets) {
    const c = ensureContrast(base, against, t);
    if (c) return c;
  }
  return base;
}

/** Fargen blant kandidatene med fargetone nærmest `hue`, blant de mettede. */
function nearestHue(candidates: string[], hue: number): string | undefined {
  // HSL-metning er høy også for svært lyse og svært mørke farger (beige har
  // over 0,5). En farge regnes som mettet bare med tydelig farge i midten av
  // lysskalaen.
  const mettede = candidates.filter((c) => {
    const x = hsl(c);
    return x.s > 0.35 && x.l > 0.2 && x.l < 0.8;
  });
  const avstand = (c: string) => {
    const d = Math.abs(hsl(c).h - hue);
    return Math.min(d, 1 - d);
  };
  // Bare farger som faktisk ligger nær fargetonen (innenfor 60°).
  const nære = mettede.filter((c) => avstand(c) <= 60 / 360);
  if (nære.length === 0) return undefined;
  return nære.reduce((a, b) => (avstand(b) < avstand(a) ? b : a));
}

const SEMANTIC_LIGHT = {
  success: "#15803D",
  warning: "#B45309",
  error: "#DC2626",
  info: "#2563EB",
};
const SEMANTIC_DARK = {
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",
};

/** Lager lys og mørk palett fra merkefargene. Kaster ved ugyldig input. */
export function generateFromBrand(input: BrandInput): BrandResult {
  const logo = input.logo.map(normalizeHex).filter((c): c is string => !!c);
  const support = input.support
    .map(normalizeHex)
    .filter((c): c is string => !!c);
  if (logo.length === 0) throw new Error("Minst én logofarge trengs.");

  const notes: BrandNote[] = [];
  const hoved = logo[0];
  const h0 = hsl(hoved);
  const nøytralMetning = Math.min(h0.s, 0.35);
  const alle = [...logo, ...support];

  // ---------- Lys ----------
  const secondary = support[0] ?? mix(hoved, "#FFFFFF", 0.85);

  // Siden trenger en lys bakgrunn å lese på. Er en støttefarge lys nok,
  // brukes den. Ellers blir bakgrunnen en svak tone av den lyseste
  // støttefargen (eller hovedfargen), så den hører til merket.
  const lyseste = [...support].sort((a, b) => hsl(b).l - hsl(a).l)[0];
  const background =
    lyseste && hsl(lyseste).l >= 0.9
      ? lyseste
      : mix(lyseste ?? hoved, "#FFFFFF", 0.92);
  const surface =
    background === "#FFFFFF" ? mix(secondary, "#FFFFFF", 0.95) : "#FFFFFF";
  const flater = [background, surface];

  const foreground = textOn(
    fromHsl(h0.h, nøytralMetning * 0.6, 0.15),
    flater,
    [7, 4.5],
  );
  // Uten en andre logofarge blir aksenten en annen valør av hovedfargen, og
  // den skal bære knappetekst. En mellomtone gir verken hvit eller mørk tekst
  // nok kontrast, så valøren flyttes til en av dem består: mørkere for hvit
  // tekst, eller lysere for mørk tekst når hovedfargen alt er veldig mørk.
  const accent =
    logo[1] ??
    (h0.l > 0.3
      ? (ensureContrast(fromHsl(h0.h, h0.s, h0.l - 0.15), ["#FFFFFF"], 4.5) ??
        fromHsl(h0.h, h0.s, h0.l - 0.15))
      : (ensureContrast(fromHsl(h0.h, h0.s, h0.l + 0.15), [foreground], 4.5) ??
        fromHsl(h0.h, h0.s, h0.l + 0.15)));
  const muted = textOn(
    fromHsl(h0.h, Math.min(h0.s, 0.25), 0.42),
    flater,
    [4.5],
  );
  const border = mix(foreground, background, 0.82);
  const warm = nearestHue(alle, 30 / 360) ?? "#D97706";
  const cool = nearestHue(alle, 200 / 360) ?? "#0891B2";

  const light: Colors = {
    primary: hoved,
    secondary,
    accent,
    warm,
    cool,
    background,
    surface,
    foreground,
    muted,
    border,
    success:
      ensureContrast(SEMANTIC_LIGHT.success, [background], 3) ??
      SEMANTIC_LIGHT.success,
    warning:
      ensureContrast(SEMANTIC_LIGHT.warning, [background], 3) ??
      SEMANTIC_LIGHT.warning,
    error:
      ensureContrast(SEMANTIC_LIGHT.error, [background], 3) ??
      SEMANTIC_LIGHT.error,
    info:
      ensureContrast(SEMANTIC_LIGHT.info, [background], 3) ??
      SEMANTIC_LIGHT.info,
  };

  // Logofargen endres ikke i lys modus, men det er verdt å vite om den er
  // for lys til tekst og bør brukes som flate eller grafikk.
  for (const role of ["primary", "accent"] as const) {
    const r = contrastRatio(light[role], background) ?? 0;
    if (r < 3) {
      notes.push({
        kind: "low-contrast-light",
        role,
        color: light[role],
        ratio: r,
      });
    }
  }

  // ---------- Mørk ----------
  // Har manualen en mørk støttefarge, er den bakgrunnen i mørk modus. Ellers
  // blir bakgrunnen nesten svart med en tone av hovedfargen.
  const mørkeste = [...support].sort((a, b) => hsl(a).l - hsl(b).l)[0];
  const dBg =
    mørkeste && hsl(mørkeste).l <= 0.2
      ? mørkeste
      : fromHsl(h0.h, nøytralMetning, 0.08);
  const dSurface = mix(dBg, "#FFFFFF", 0.06);
  const dFlater = [dBg, dSurface];

  // Merkefarger i mørk modus: beholdes hvis de synes (3:1, som grafikk og
  // stor tekst). Må en farge justeres likevel, lysnes den til 4,5:1. Bare 3:1
  // ville gitt en mellomtone der verken hvit eller mørk knappetekst består.
  // Justeringen står i notes.
  const synlig = (role: Role, c: string) => {
    const ok = dFlater.every((f) => (contrastRatio(c, f) ?? 0) >= 3);
    if (ok) return c;
    const ny =
      ensureContrast(c, dFlater, 4.5) ?? ensureContrast(c, dFlater, 3) ?? c;
    if (ny !== c) notes.push({ kind: "adjusted-dark", role, from: c, to: ny });
    return ny;
  };

  const sHue = support[0] ? hsl(support[0]) : h0;
  const dark: Colors = {
    primary: synlig("primary", hoved),
    secondary: fromHsl(sHue.h, sHue.s * 0.6, 0.2),
    // En ekte logofarge lysnes bare til den synes (3:1). En avledet aksent er
    // ikke en merkefarge, så den kan løftes helt til mørk knappetekst består.
    accent: logo[1]
      ? synlig("accent", accent)
      : (ensureContrast(accent, dFlater, 4.5) ?? synlig("accent", accent)),
    warm: ensureContrast(warm, [dBg], 3) ?? warm,
    cool: ensureContrast(cool, [dBg], 3) ?? cool,
    background: dBg,
    surface: dSurface,
    foreground: textOn(fromHsl(h0.h, 0.15, 0.94), dFlater, [7, 4.5]),
    muted: textOn(fromHsl(h0.h, 0.12, 0.68), dFlater, [4.5]),
    border: mix(fromHsl(h0.h, 0.15, 0.94), dBg, 0.8),
    success:
      ensureContrast(SEMANTIC_DARK.success, [dBg], 3) ?? SEMANTIC_DARK.success,
    warning:
      ensureContrast(SEMANTIC_DARK.warning, [dBg], 3) ?? SEMANTIC_DARK.warning,
    error: ensureContrast(SEMANTIC_DARK.error, [dBg], 3) ?? SEMANTIC_DARK.error,
    info: ensureContrast(SEMANTIC_DARK.info, [dBg], 3) ?? SEMANTIC_DARK.info,
  };

  return { light, dark, notes };
}
