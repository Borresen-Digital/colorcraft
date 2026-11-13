import { cmykToHex, formatCmyk, hexToCmyk, type Cmyk } from "./cmyk";
import { parseHex, toHex } from "./contrast";

/**
 * Tint, slik en profilmanual bruker ordet: fargen trykt med lavere
 * rasterprosent. 60 % tint er alle trykkfargene ganget med 0,6, så papiret
 * skinner mer gjennom.
 *
 * Skjermfargen regnes ut fra CMYK i samme trykkmodell som resten av
 * verktøyet. Da henger tallene og fargen sammen: 60 % tint av «44 30 26 12»
 * er «26 18 16 7», og det er den fargen som vises. Er CMYK skrevet inn fra
 * manualen, er det de tallene som brukes.
 */

export const TINT_STEPS = [100, 80, 60, 40, 20] as const;

export interface Tint {
  percent: number;
  hex: string;
  cmyk: Cmyk;
  cmykText: string;
}

export function tints(
  hex: string,
  manual?: Cmyk | null,
  steps: readonly number[] = TINT_STEPS,
): Tint[] {
  const rgb = parseHex(hex);
  if (!rgb) return [];
  const full = manual ?? hexToCmyk(hex)!.cmyk;
  return steps.map((p) => {
    const f = p / 100;
    const cmyk = {
      c: Math.round(full.c * f),
      m: Math.round(full.m * f),
      y: Math.round(full.y * f),
      k: Math.round(full.k * f),
    };
    return {
      percent: p,
      // 100 % er fargen selv, så den ikke flytter seg med modellens avrunding.
      hex: p === 100 ? toHex(rgb) : cmykToHex(cmyk),
      cmyk: p === 100 ? full : cmyk,
      cmykText: formatCmyk(p === 100 ? full : cmyk),
    };
  });
}
