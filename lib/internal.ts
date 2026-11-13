import { hexToOklch, oklchToHex } from "./tones";

/**
 * Intern profil: friere tilleggsfarger til for eksempel PowerPoint og
 * interne dokumenter, der det er lov å være mer fargerik enn utad.
 *
 * Forslaget bygger på hovedfargens tone, så fargene hører sammen med merket:
 * to naboer (±35°), komplementen (180°) og en triade (+120°), med nok metning
 * til å skille seg ut og vekslende lyshet, så de kan stå side om side i et
 * diagram. Designeren kan endre dem fritt. De merkes «bare internt» og
 * brukes ikke i paletten for skjerm.
 */

export const MAX_INTERNAL = 6;

const STEG = [
  { dh: 35, l: 0.62 },
  { dh: -35, l: 0.72 },
  { dh: 180, l: 0.58 },
  { dh: 120, l: 0.7 },
];

export function suggestInternal(hoved: string): string[] {
  const o = hexToOklch(hoved);
  if (!o) return [];
  // En grå hovedfarge har ingen tone å bygge på, så forslaget får en varm
  // start i stedet for å bli fire gråtoner.
  const h = o.c < 0.02 ? 60 : o.h;
  const c = Math.min(Math.max(o.c, 0.13), 0.18);
  return STEG.map(({ dh, l }) =>
    oklchToHex({ l, c, h: (((h + dh) % 360) + 360) % 360 }),
  );
}
