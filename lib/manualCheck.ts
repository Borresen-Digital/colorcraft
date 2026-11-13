import { cmykToHex, colorDistance, parseCmyk } from "./cmyk";
import { parseHex, toHex } from "./contrast";

/**
 * Sjekker at HEX, RGB og CMYK for en farge i en profilmanual henger sammen.
 *
 * HEX og RGB er samme tall skrevet på to måter, så de må stemme helt. CMYK
 * er en trykkfarge, og omregningen avhenger av profilen, så den kan bare
 * ligne. Vi måler hvor ulike fargene ser ut (OKLab): under LIKE er de like
 * nok til at forskjellen kommer av profilen, over AVVIK er det trolig en
 * skrivefeil eller en farge som er byttet ut.
 */

export const CMYK_LIKE = 0.05;
export const CMYK_AVVIK = 0.1;

/** «144 153 64», «144, 153, 64», «R 144 G 153 B 64» eller «rgb(144,153,64)». */
export function parseRgb(s: string): string | null {
  const tall = (s.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  if (tall.length !== 3 || tall.some((n) => n < 0 || n > 255)) return null;
  const [r, g, b] = tall;
  return toHex({ r, g, b });
}

export type CmykVerdict = "like" | "nær" | "avvik";

export interface ManualCheck {
  hex: string | null;
  rgbHex: string | null;
  cmykHex: string | null;
  /** null når HEX eller RGB mangler. */
  rgbMatchesHex: boolean | null;
  /** CMYK mot HEX (eller RGB hvis HEX mangler). */
  cmyk: { distance: number; verdict: CmykVerdict; against: string } | null;
  /** Hvilke felt som er fylt ut, men ikke kunne leses. */
  invalid: ("hex" | "rgb" | "cmyk")[];
}

export function checkManual(input: {
  hex?: string;
  rgb?: string;
  cmyk?: string;
}): ManualCheck {
  const invalid: ManualCheck["invalid"] = [];
  const fylt = (s?: string) => !!s && s.trim() !== "";

  const hexRgb = fylt(input.hex) ? parseHex(input.hex!.trim()) : null;
  const hex = hexRgb ? toHex(hexRgb) : null;
  if (fylt(input.hex) && !hex) invalid.push("hex");

  const rgbHex = fylt(input.rgb) ? parseRgb(input.rgb!) : null;
  if (fylt(input.rgb) && !rgbHex) invalid.push("rgb");

  const cmyk = fylt(input.cmyk) ? parseCmyk(input.cmyk!) : null;
  if (fylt(input.cmyk) && !cmyk) invalid.push("cmyk");
  const cmykHex = cmyk ? cmykToHex(cmyk) : null;

  const rgbMatchesHex = hex && rgbHex ? hex === rgbHex : null;
  const mot = hex ?? rgbHex;
  let cmykRes: ManualCheck["cmyk"] = null;
  if (cmykHex && mot) {
    const d = colorDistance(cmykHex, mot)!;
    cmykRes = {
      distance: d,
      verdict: d <= CMYK_LIKE ? "like" : d <= CMYK_AVVIK ? "nær" : "avvik",
      against: mot,
    };
  }
  return { hex, rgbHex, cmykHex, rgbMatchesHex, cmyk: cmykRes, invalid };
}
