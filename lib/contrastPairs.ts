import type { ColorPalette } from "@/types/palette";
import {
  contrastLevel,
  contrastRatio,
  suggestPassingColor,
  THRESHOLDS,
  type ContrastLevel,
} from "./contrast";

type ColorRole = keyof ColorPalette["colors"];

const WHITE = "#FFFFFF";

/** Knappetekst: den som gir best kontrast av hvit og palettens mørke farge. */
export const AUTO_TEXT = "auto";

/**
 * Tekstfargen som hører hjemme på en farget flate (knapper, aktive lenker).
 * Hvit, eller den mørkeste av palettens forgrunn og bakgrunn, alt etter hva
 * som gir best kontrast. Slik velger en utvikler i praksis, og det er det
 * forhåndsvisningen viser.
 */
export function textOn(palette: ColorPalette, bg: string): string {
  const { foreground, background } = palette.colors;
  const mork =
    (contrastRatio(foreground, WHITE) ?? 0) >=
    (contrastRatio(background, WHITE) ?? 0)
      ? foreground
      : background;
  return (contrastRatio(WHITE, bg) ?? 0) >= (contrastRatio(mork, bg) ?? 0)
    ? WHITE
    : mork;
}

export interface ContrastPair {
  id: string;
  label: string;
  /** En fargerolle i paletten, eller tekstfargen som passer på `bg`. */
  fg: ColorRole | typeof AUTO_TEXT;
  bg: ColorRole;
  /** Stor tekst har lavere krav (overskrifter i forhåndsvisningen). */
  large?: boolean;
  /** Hvilken av de to som bør endres for å bestå. Det er alltid en rolle. */
  adjust: "fg" | "bg";
}

/**
 * Parene som faktisk brukes sammen i forhåndsvisningen, og som en utvikler
 * kommer til å bruke sammen på en ekte side.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  {
    id: "text-background",
    label: "Text on background",
    fg: "foreground",
    bg: "background",
    adjust: "fg",
  },
  {
    id: "text-surface",
    label: "Text on surface",
    fg: "foreground",
    bg: "surface",
    adjust: "fg",
  },
  {
    id: "muted-background",
    label: "Muted on background",
    fg: "muted",
    bg: "background",
    adjust: "fg",
  },
  {
    id: "muted-surface",
    label: "Muted on surface",
    fg: "muted",
    bg: "surface",
    adjust: "fg",
  },
  {
    id: "heading-background",
    label: "Heading (primary) on background",
    fg: "primary",
    bg: "background",
    large: true,
    adjust: "fg",
  },
  {
    id: "button-primary",
    label: "Button text on primary",
    fg: AUTO_TEXT,
    bg: "primary",
    adjust: "bg",
  },
  {
    id: "button-accent",
    label: "Button text on accent",
    fg: AUTO_TEXT,
    bg: "accent",
    adjust: "bg",
  },
];

export interface ContrastResult {
  pair: ContrastPair;
  fg: string;
  bg: string;
  ratio: number | null;
  level: ContrastLevel;
  /** Fargerollen forslaget gjelder, og nærmeste farge som når AA. */
  suggestion: { role: ColorRole; color: string } | null;
}

export function checkPair(
  palette: ColorPalette,
  pair: ContrastPair,
): ContrastResult {
  const bg = palette.colors[pair.bg];
  const fg =
    pair.fg === AUTO_TEXT ? textOn(palette, bg) : palette.colors[pair.fg];
  const ratio = contrastRatio(fg, bg);
  const level = ratio === null ? "fail" : contrastLevel(ratio, pair.large);

  let suggestion: ContrastResult["suggestion"] = null;
  if (ratio !== null && level === "fail") {
    const target = pair.large ? THRESHOLDS.large.AA : THRESHOLDS.normal.AA;
    const role = (pair.adjust === "fg" ? pair.fg : pair.bg) as ColorRole;
    const color =
      pair.adjust === "fg"
        ? suggestPassingColor(fg, bg, target)
        : suggestPassingColor(bg, fg, target);
    if (color) suggestion = { role, color };
  }

  return { pair, fg, bg, ratio, level, suggestion };
}

export function checkPalette(palette: ColorPalette): ContrastResult[] {
  return CONTRAST_PAIRS.map((pair) => checkPair(palette, pair));
}
