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
import { hexToOklch, hueDistance, variants } from "./tones";

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
 *
 * Highlight er en egen rolle: en farge som bare brukes i små doser (knapper,
 * enkeltord), aldri som flate. Den blir aksenten.
 *
 * Generatoren finner ikke på nye farger. Aksent, varm og kald hentes fra
 * fargene i manualen, eller er en valør eller variant av dem.
 */

type Colors = ColorPalette["colors"];
type Role = keyof Colors;

export interface BrandInput {
  /** 1–3 logofarger. Den første er hovedfargen. */
  logo: string[];
  /** 0–4 støttefarger, flatefarger fra manualen. */
  support: string[];
  /** 0–2 highlightfarger: knapper og enkeltord, aldri flater. */
  highlight?: string[];
  /** Kundens føring for uttrykket. Styrer bare de genererte fargene. */
  direction?: Direction;
}

/**
 * Føringer fra kunden («jeg ønsker en eksklusiv look»). Retningen endrer
 * aldri merkefargene, bare det som lages rundt dem: bakgrunn, tekst, dempet
 * tekst, kanter og varm og kald. Kontrastkravene gjelder i alle retninger.
 *
 *   neutral    Som før.
 *   exclusive  Dempet og luftig: nesten nøytral bakgrunn, gråere tekst og
 *              mindre mettede varm- og kaldfarger.
 *   sales      Høy kontrast: hvit bakgrunn, nesten svart tekst og mer
 *              mettede varm- og kaldfarger.
 *   tonal      Ton i ton: bakgrunn, flater og kanter i hovedfargens tone, og
 *              varm og kald som nære varianter av den.
 *   playful    Leken: tydelig tonet bakgrunn og mer mettede farger.
 */
export type Direction = "neutral" | "exclusive" | "sales" | "tonal" | "playful";
export const DIRECTIONS: Direction[] = [
  "neutral",
  "exclusive",
  "sales",
  "tonal",
  "playful",
];

export type BrandNote =
  | { kind: "adjusted-dark"; role: Role; from: string; to: string }
  | { kind: "low-contrast-light"; role: Role; color: string; ratio: number }
  /** Logofargen er så mørk at den blir bakgrunnen i mørk modus. */
  | { kind: "logo-background"; role: Role; from: string; to: string };

export interface BrandResult {
  light: Colors;
  dark: Colors;
  notes: BrandNote[];
}

export const MAX_LOGO = 3;
export const MAX_SUPPORT = 4;
export const MAX_HIGHLIGHT = 2;

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

/**
 * Varm og kald hentes fra merkefargene. En farge regnes som varm med
 * fargetone mellom rødt og gult (OKLCH 0–120°), og som kald mellom turkis og
 * blått (170–290°). Den må ha litt farge (chroma), så grått teller ikke.
 * Farger som alt har en rolle (primær, aksent) brukes bare hvis ingen andre
 * passer, og blant resten vinner den mest fargerike. Finnes ingen, blir det
 * en varmere eller kaldere variant av hovedfargen, ikke en fremmed farge.
 */
const VARM = { hue: 60, maxDistance: 60, minChroma: 0.03 };
const KALD = { hue: 230, maxDistance: 60, minChroma: 0.015 };

export function pickTemperature(
  candidates: string[],
  taken: string[],
  kind: "warm" | "cool",
): string | undefined {
  const k = kind === "warm" ? VARM : KALD;
  const treff = candidates.filter((c) => {
    const o = hexToOklch(c);
    return (
      !!o && o.c >= k.minChroma && hueDistance(o.h, k.hue) <= k.maxDistance
    );
  });
  const ledige = treff.filter((c) => !taken.includes(c));
  const liste = ledige.length > 0 ? ledige : treff;
  if (liste.length === 0) return undefined;
  return liste.reduce((a, b) => (hexToOklch(b)!.c > hexToOklch(a)!.c ? b : a));
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
  const highlight = (input.highlight ?? [])
    .map(normalizeHex)
    .filter((c): c is string => !!c);
  if (logo.length === 0) throw new Error("Minst én logofarge trengs.");

  const notes: BrandNote[] = [];
  const retning = input.direction ?? "neutral";
  const hoved = logo[0];
  const h0 = hsl(hoved);
  const nøytralMetning = Math.min(h0.s, 0.35);
  // Rekkefølgen avgjør ved likt: highlight, støttefarger, så logofargene.
  const alle = [
    ...new Set([...highlight, ...support, ...logo.slice(1), hoved]),
  ];

  // ---------- Lys ----------
  const secondary =
    support[0] ?? mix(hoved, "#FFFFFF", retning === "tonal" ? 0.75 : 0.85);

  // Siden trenger en lys bakgrunn å lese på. Er en støttefarge lys nok,
  // brukes den. Ellers blir bakgrunnen en svak tone av den lyseste
  // støttefargen (eller hovedfargen), så den hører til merket.
  const lyseste = [...support].sort((a, b) => hsl(b).l - hsl(a).l)[0];
  // En lys støttefarge fra manualen går foran retningen. Ellers styrer
  // retningen hvor tonet bakgrunnen er.
  const genBakgrunn = {
    neutral: () => mix(lyseste ?? hoved, "#FFFFFF", 0.92),
    exclusive: () => fromHsl(h0.h, 0.06, 0.975),
    sales: () => "#FFFFFF",
    tonal: () => mix(hoved, "#FFFFFF", 0.9),
    playful: () => mix(lyseste ?? hoved, "#FFFFFF", 0.86),
  }[retning];
  const background = lyseste && hsl(lyseste).l >= 0.9 ? lyseste : genBakgrunn();
  const surface =
    retning === "tonal"
      ? mix(hoved, "#FFFFFF", 0.95)
      : background === "#FFFFFF"
        ? mix(secondary, "#FFFFFF", 0.95)
        : "#FFFFFF";
  const flater = [background, surface];

  const foreground = textOn(
    {
      neutral: fromHsl(h0.h, nøytralMetning * 0.6, 0.15),
      exclusive: fromHsl(h0.h, 0.08, 0.13),
      sales: fromHsl(h0.h, 0.2, 0.07),
      tonal: fromHsl(h0.h, Math.min(h0.s, 0.6), 0.16),
      playful: fromHsl(h0.h, nøytralMetning, 0.15),
    }[retning],
    flater,
    retning === "sales" ? [12, 7, 4.5] : [7, 4.5],
  );
  // Aksenten er highlightfargen, ellers logofarge 2. Uten noen av dem er
  // det logofargen selv (den brukes ofte til highlight), så lenge den synes
  // mot bakgrunnen. Er logofargen for lys til det, blir aksenten en annen
  // valør av den, og den skal bære knappetekst. En mellomtone gir verken
  // hvit eller mørk tekst nok kontrast, så valøren flyttes til en av dem
  // består: mørkere for hvit tekst, eller lysere for mørk tekst når
  // hovedfargen alt er veldig mørk.
  const avledet = () =>
    h0.l > 0.3
      ? (ensureContrast(fromHsl(h0.h, h0.s, h0.l - 0.15), ["#FFFFFF"], 4.5) ??
        fromHsl(h0.h, h0.s, h0.l - 0.15))
      : (ensureContrast(fromHsl(h0.h, h0.s, h0.l + 0.15), [foreground], 4.5) ??
        fromHsl(h0.h, h0.s, h0.l + 0.15));
  const accent =
    highlight[0] ??
    logo[1] ??
    (flater.every((f) => (contrastRatio(hoved, f) ?? 0) >= 3)
      ? hoved
      : avledet());
  const muted = textOn(
    {
      neutral: fromHsl(h0.h, Math.min(h0.s, 0.25), 0.42),
      exclusive: fromHsl(h0.h, 0.06, 0.42),
      sales: fromHsl(h0.h, Math.min(h0.s, 0.25), 0.35),
      tonal: fromHsl(h0.h, Math.min(h0.s, 0.45), 0.4),
      playful: fromHsl(h0.h, Math.min(h0.s, 0.35), 0.42),
    }[retning],
    flater,
    [4.5],
  );
  const border =
    retning === "tonal"
      ? mix(hoved, background, 0.75)
      : mix(foreground, background, 0.82);
  const tatt = [hoved, accent];
  // Ton i ton holder seg til hovedfargen: varm og kald er nære varianter av
  // den. De andre retningene velger fra merket og demper eller metter.
  const valgt = (kind: "warm" | "cool") => {
    const v = variants(hoved);
    const fallback = (kind === "warm" ? v?.warmer : v?.cooler) ?? hoved;
    if (retning === "tonal") return fallback;
    const c = pickTemperature(alle, tatt, kind) ?? fallback;
    if (retning === "exclusive") return variants(c)?.lessSaturated ?? c;
    if (retning === "sales" || retning === "playful")
      return variants(c)?.moreSaturated ?? c;
    return c;
  };
  const warm = valgt("warm");
  const cool = valgt("cool");

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
  // for lys til tekst og bør brukes som flate eller grafikk. En
  // highlightfarge er laget for knapper og markering, ikke tekst, så den får
  // ingen slik merknad.
  const roller = highlight[0]
    ? (["primary"] as const)
    : (["primary", "accent"] as const);
  for (const role of roller) {
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
  // Har manualen en mørk støttefarge, er den bakgrunnen i mørk modus. Er
  // logofargen selv mørk (som marineblå), blir den bakgrunnen, slik den er
  // flaten på en rollup eller annonse, og en lys merkefarge tar plassen som
  // primær. Ellers blir bakgrunnen nesten svart med en tone av hovedfargen.
  const mørkeste = [...support].sort((a, b) => hsl(a).l - hsl(b).l)[0];
  const lysPåLogo = (() => {
    if (h0.l > 0.2) return undefined;
    const flate = [hoved, mix(hoved, "#FFFFFF", 0.06)];
    const ok = (c: string) =>
      flate.every((f) => (contrastRatio(c, f) ?? 0) >= 3);
    // Highlight først, siden den er laget for å synes. Ellers den som står
    // best frem.
    if (highlight[0] && ok(highlight[0])) return highlight[0];
    const kandidater = [...highlight, ...support, ...logo.slice(1)].filter(ok);
    if (kandidater.length === 0) return undefined;
    return kandidater.reduce((a, b) =>
      (contrastRatio(b, hoved) ?? 0) > (contrastRatio(a, hoved) ?? 0) ? b : a,
    );
  })();
  const dBg =
    mørkeste && hsl(mørkeste).l <= 0.2
      ? mørkeste
      : lysPåLogo
        ? hoved
        : retning === "exclusive"
          ? fromHsl(h0.h, 0.05, 0.07)
          : retning === "tonal"
            ? fromHsl(h0.h, Math.min(h0.s, 0.5), 0.1)
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

  let dPrimary: string;
  if (dBg === hoved && lysPåLogo) {
    dPrimary = lysPåLogo;
    notes.push({
      kind: "logo-background",
      role: "primary",
      from: hoved,
      to: lysPåLogo,
    });
  } else {
    dPrimary = synlig("primary", hoved);
  }
  let dAccent: string;
  if (highlight[0] || logo[1]) {
    dAccent = synlig("accent", accent);
  } else if (accent === hoved) {
    // Aksenten var logofargen, så den følger logofargen i mørk modus.
    dAccent = dPrimary;
  } else {
    // En avledet aksent er ikke en merkefarge, så den kan løftes helt til
    // mørk knappetekst består.
    dAccent = ensureContrast(accent, dFlater, 4.5) ?? synlig("accent", accent);
  }

  const sHue = support[0] ? hsl(support[0]) : h0;
  const dark: Colors = {
    primary: dPrimary,
    secondary: fromHsl(sHue.h, sHue.s * 0.6, 0.2),
    accent: dAccent,
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
