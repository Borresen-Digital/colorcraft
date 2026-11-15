import { withPantone } from "./pantone";
import { RULE_PARAMS, withMaker, withRule, type RuleKey } from "./profile";
import type { ProfileExtras } from "./profileImport";
import { withTypography } from "./typography";

/**
 * Det en importert profil har i tillegg til paletten: «Laget av»,
 * typografi, bruksregler og Pantone. Verktøyet bruker det ikke selv, men tar
 * det med i lenken til profilsiden, så ingenting forsvinner på veien.
 *
 * Lagres i nettleseren per palett, på samme måte som egne paletter.
 */

const KEY = "colorcraft-profile-extras";

/** Fragmentet til profilsiden med tilleggene lagt til. */
export function withProfileExtras(hash: string, e: ProfileExtras): string {
  let h = withMaker(hash, e.maker);
  h = withTypography(h, e.typography);
  for (const key of Object.keys(RULE_PARAMS) as RuleKey[]) {
    if (e.rules[key]) h = withRule(h, key, e.rules[key]!);
  }
  return withPantone(h, e.pantone);
}

function lesAlle(): Record<string, ProfileExtras> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** Tilleggene for en palett, eller null. Formen sjekkes, verdiene renses i lenken. */
export function loadExtras(paletteId: string): ProfileExtras | null {
  const e = lesAlle()[paletteId] as Partial<ProfileExtras> | undefined;
  if (!e || typeof e !== "object") return null;
  const obj = (v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? v : {};
  return {
    maker: typeof e.maker === "string" ? e.maker : "",
    typography: Array.isArray(e.typography) ? e.typography : [],
    rules: obj(e.rules) as ProfileExtras["rules"],
    pantone: obj(e.pantone) as ProfileExtras["pantone"],
  };
}

export function saveExtras(paletteId: string, e: ProfileExtras | null): void {
  try {
    const alle = lesAlle();
    if (e) alle[paletteId] = e;
    else delete alle[paletteId];
    localStorage.setItem(KEY, JSON.stringify(alle));
  } catch {
    // Privat modus eller fullt lager: tilleggene følger da bare med denne gangen.
  }
}
