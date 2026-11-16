import type { ExtendedColorPalette } from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { generateFromBrand, normalizeHex } from "./brand";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

/**
 * Nettsidevisningen: paletten på en hel nettside, med fargene i en linje
 * nederst som kan byttes mens man ser på siden. Paletten ligger i
 * fragmentet, som på profilsiden.
 */

/** Stien til nettsidevisningen på et språk. Norsk har ikke prefiks. */
export function sitePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/nettside" : `/${locale}/nettside`;
}

/** Listene i en palett fra en profilmanual som kan endres i linjen. */
export type BrandList = "logo" | "support" | "highlight";

/** Rollene som kan endres i en palett uten profilmanual. */
export const SITE_ROLES = [
  "background",
  "foreground",
  "primary",
  "secondary",
  "accent",
] as const;
export type SiteRole = (typeof SITE_ROLES)[number];

export type SiteEdit =
  | { kind: "brand"; list: BrandList; index: number; hex: string }
  | { kind: "role"; role: SiteRole; hex: string };

/**
 * Paletten med én farge byttet.
 *
 * - En palett fra en profilmanual regnes ut på nytt fra merkefargene, som i
 *   «Fra profilmanual», så resten av paletten følger med. Eget navn flyttes
 *   til den nye fargen. CMYK fra manualen gjelder ikke lenger og tas bort.
 * - Andre paletter får bare den ene rollen byttet, i varianten som vises.
 *
 * Ugyldig HEX gir paletten uendret.
 */
export function editPalette(
  palette: ExtendedColorPalette,
  edit: SiteEdit,
  dark = false,
): ExtendedColorPalette {
  const hex = normalizeHex(edit.hex);
  if (!hex) return palette;

  if (edit.kind === "role") {
    const bytt = (p: ColorPalette): ColorPalette => ({
      ...p,
      colors: { ...p.colors, [edit.role]: hex },
    });
    if (dark && palette.darkVariant) {
      return { ...palette, darkVariant: bytt(palette.darkVariant) };
    }
    return { ...palette, ...bytt(palette) };
  }

  const brand = palette.brand;
  if (!brand) return palette;
  const liste = [...(brand[edit.list] ?? [])];
  const gammel = liste[edit.index];
  if (gammel === undefined) return palette;
  liste[edit.index] = hex;
  const ny = { ...brand, [edit.list]: liste };

  const flytt = (m: Record<string, string> | undefined, behold: boolean) => {
    if (!m) return m;
    const ut = { ...m };
    const verdi = ut[gammel] ?? ut[gammel.toUpperCase()];
    delete ut[gammel];
    delete ut[gammel.toUpperCase()];
    if (behold && verdi) ut[hex] = verdi;
    return ut;
  };
  ny.names = flytt(brand.names, true);
  ny.cmyk = flytt(brand.cmyk, false);

  const r = generateFromBrand({
    logo: ny.logo,
    support: ny.support,
    highlight: ny.highlight,
    direction: ny.direction ?? "neutral",
  });
  return {
    ...palette,
    colors: r.light,
    ...(palette.darkVariant && {
      darkVariant: { ...palette.darkVariant, colors: r.dark },
    }),
    brand: ny,
  };
}

/**
 * Fragmentet med en ny palett, der alt annet (typografi, bruksregler,
 * Pantone, «Laget av», logoen) står som før. Palettens egne parametere er
 * p, v, n, l, d, m og de som starter med b (merkefargene).
 */
export function withPalette(hash: string, paletteHash: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  for (const k of [...q.keys()]) {
    if (["p", "v", "n", "l", "d", "m"].includes(k) || k.startsWith("b")) {
      q.delete(k);
    }
  }
  const ut = new URLSearchParams(paletteHash.replace(/^#/, ""));
  for (const [k, v] of q) ut.append(k, v);
  return ut.toString().replace(/\+/g, "%20");
}
