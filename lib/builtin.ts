import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { COLOR_ROLES } from "./share";

/**
 * Endringer i de innebygde palettene.
 *
 * V1 lot deg endre en innebygd palett, men endringen forsvant ved omlasting:
 * bare paletter med `custom-`-id ble lagret. Nå lagres en endret innebygd
 * palett som en overstyring med samme id, og den kan tilbakestilles. Id-en
 * er den samme, så en delt lenke til en urørt palett virker som før, og en
 * endret palett deles med fargene (se lib/share.ts).
 */

export function builtinOriginal(id: string): ExtendedColorPalette | undefined {
  return colorPalettes.find((p) => p.id === id);
}

function sameVariant(a: ColorPalette, b: ColorPalette): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    COLOR_ROLES.every(
      (r) => a.colors[r].toLowerCase() === b.colors[r].toLowerCase(),
    )
  );
}

/** Er dette en innebygd palett som er endret? Gir false for egne paletter. */
export function isModifiedBuiltin(p: ExtendedColorPalette): boolean {
  const o = builtinOriginal(p.id);
  if (!o) return false;
  if (!sameVariant(o, p)) return true;
  if (!o.darkVariant !== !p.darkVariant) return true;
  return !!o.darkVariant && !sameVariant(o.darkVariant, p.darkVariant!);
}

/** De innebygde palettene som er endret, klare til å lagres. */
export function builtinOverrides(
  palettes: ExtendedColorPalette[],
): Record<string, ExtendedColorPalette> {
  return Object.fromEntries(
    palettes.filter(isModifiedBuiltin).map((p) => [p.id, p]),
  );
}

function isColors(x: unknown): x is ColorPalette["colors"] {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;
  return COLOR_ROLES.every(
    (r) => typeof c[r] === "string" && /^#[0-9a-fA-F]{6}$/.test(c[r] as string),
  );
}

function isVariant(x: unknown, id: string): x is ColorPalette {
  if (!x || typeof x !== "object") return false;
  const v = x as Record<string, unknown>;
  return (
    v.id === id &&
    typeof v.name === "string" &&
    typeof v.description === "string" &&
    isColors(v.colors)
  );
}

/**
 * Legger lagrede overstyringer over de innebygde palettene. Det som er lagret
 * kommer fra nettleseren og kan være hva som helst, så alt som ikke er en
 * gyldig palett for en id som finnes, hoppes over.
 */
export function applyOverrides(overrides: unknown): ExtendedColorPalette[] {
  const o =
    overrides && typeof overrides === "object"
      ? (overrides as Record<string, unknown>)
      : {};
  return colorPalettes.map((orig) => {
    const lagret = o[orig.id];
    if (!isVariant(lagret, orig.id)) return orig;
    const mork = (lagret as ExtendedColorPalette).darkVariant;
    return {
      id: orig.id,
      name: lagret.name,
      description: lagret.description,
      colors: lagret.colors,
      ...(isVariant(mork, `${orig.id}-dark`) && { darkVariant: mork }),
    };
  });
}
