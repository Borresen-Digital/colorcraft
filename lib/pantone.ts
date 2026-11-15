/**
 * Pantone på profilsiden: nummeret designeren har fra manualen, for
 * eksempel «2945 C», skrevet inn for hånd.
 *
 * ColorCraft regner ikke om til Pantone og har ingen Pantone-tabell.
 * Fargebiblioteket er lisensiert, og en omregning fra skjermfarge ville
 * uansett bare vært omtrentlig. Nummeret står derfor som designeren skrev
 * det, merket «fra manualen».
 *
 * I lenken: pn=002245~2945 C|C1B694~7535 C (HEX uten #, ~, nummeret).
 * Parameteren starter ikke med «b», så palettens id ikke endres.
 */

export const PANTONE_PARAM = "pn";
const MAX_PANTONE = 30;

export type PantoneMap = Record<string, string>;

/** Nøkkelen for en farge: HEX med store bokstaver, uten #. */
export function pantoneKey(hex: string): string {
  return hex.replace(/^#/, "").toUpperCase();
}

/** Et Pantone-nummer: bokstaver, tall, mellomrom og . - / +. */
export function cleanPantone(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/[^\p{L}\p{N} ./+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_PANTONE);
}

export function readPantone(hash: string): PantoneMap {
  const verdi = new URLSearchParams(hash.replace(/^#/, "")).get(PANTONE_PARAM);
  const ut: PantoneMap = {};
  for (const del of (verdi ?? "").split("|")) {
    const i = del.indexOf("~");
    if (i < 0) continue;
    const hex = del.slice(0, i).toUpperCase();
    const nummer = cleanPantone(del.slice(i + 1));
    if (/^[0-9A-F]{6}$/.test(hex) && nummer) ut[hex] = nummer;
  }
  return ut;
}

/** Fragmentet med Pantone-numrene satt. Tomme numre tas ikke med. */
export function withPantone(hash: string, map: PantoneMap): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const deler = Object.entries(map)
    .map(([hex, n]) => [pantoneKey(hex), cleanPantone(n)] as const)
    .filter(([hex, n]) => /^[0-9A-F]{6}$/.test(hex) && n)
    .map(([hex, n]) => `${hex}~${n}`);
  if (deler.length > 0) q.set(PANTONE_PARAM, deler.join("|"));
  else q.delete(PANTONE_PARAM);
  return q.toString().replace(/\+/g, "%20");
}

export function withoutPantone(hash: string): string {
  return withPantone(hash, {});
}
