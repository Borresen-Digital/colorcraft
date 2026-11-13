import type { ExtendedColorPalette } from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { contrastRatio } from "./contrast";
import { textOn } from "./contrastPairs";
import { parseCmyk } from "./cmyk";
import { tints } from "./tint";

/**
 * Flater: støttefargene brukt slik en profilmanual bruker dem, som
 * heldekkende seksjoner og infobokser, med logoen og tekst oppå.
 *
 * For hver flate regnes det ut hvilken tekstfarge som gir best kontrast, og
 * om logoen synes. Logoen er grafikk, så kravet er 3:1 (WCAG 2.2, 1.4.11),
 * ikke 4,5:1 som for tekst. På en flate i selve logofargen brukes logoen i
 * negativ (lys eller mørk), slik manualer gjør.
 */

export const LOGO_MIN = 3;
export const TEXT_MIN = 4.5;

export type SurfaceKind = "support" | "logo";

export interface Surface {
  kind: SurfaceKind;
  /** Nummeret blant støttefargene (1, 2, …). 0 for logofargen. */
  index: number;
  /** Rollen flaten kommer fra, for paletter uten profilmanual. */
  role?: "secondary" | "surface";
  color: string;
  text: string;
  textRatio: number;
  /** Fargen logoen vises i på denne flaten. */
  logo: string;
  logoRatio: number;
  logoOk: boolean;
  /** Logoen er vist i negativ fordi flaten er selve logofargen. */
  logoInverted: boolean;
  /** Tinter av en støtteflate, med logoens kontrast på hver. */
  tints: { percent: number; hex: string; logoRatio: number; logoOk: boolean }[];
}

/** Trinnene som vises under hver støtteflate. 100 % er flaten selv. */
export const SURFACE_TINTS = [80, 60, 40, 20] as const;

/** Den av palettens egne tekstfarger (og hvit) som gir best kontrast. */
function bestText(palette: ColorPalette, bg: string): string {
  const kandidater = [
    palette.colors.foreground,
    palette.colors.background,
    "#FFFFFF",
  ];
  return kandidater.reduce((best, c) =>
    (contrastRatio(c, bg) ?? 0) > (contrastRatio(best, bg) ?? 0) ? c : best,
  );
}

function surface(
  palette: ColorPalette,
  color: string,
  kind: SurfaceKind,
  index: number,
  cmyk?: string,
): Surface {
  const text = bestText(palette, color);
  const inverted = kind === "logo";
  const logo = inverted ? textOn(palette, color) : palette.colors.primary;
  const logoRatio = contrastRatio(logo, color) ?? 1;
  return {
    kind,
    index,
    color,
    text,
    textRatio: contrastRatio(text, color) ?? 1,
    logo,
    logoRatio,
    logoOk: logoRatio >= LOGO_MIN,
    logoInverted: inverted,
    tints:
      kind === "support"
        ? tints(color, cmyk ? parseCmyk(cmyk) : null, SURFACE_TINTS).map(
            (t) => {
              const r = contrastRatio(logo, t.hex) ?? 1;
              return {
                percent: t.percent,
                hex: t.hex,
                logoRatio: r,
                logoOk: r >= LOGO_MIN,
              };
            },
          )
        : [],
  };
}

/**
 * Flatene for en palett. Er den laget fra en profilmanual, er det
 * støttefargene derfra. Ellers brukes secondary og surface, som er det
 * nærmeste en vanlig palett har. Logofargen som flate kommer alltid sist.
 */
export function surfacesFor(
  palette: ColorPalette,
  brand?: ExtendedColorPalette["brand"],
): Surface[] {
  const fraManual = !!brand && brand.support.length > 0;
  const roller = ["secondary", "surface"] as const;
  const støtte = fraManual
    ? brand.support
    : roller.map((r) => palette.colors[r]);
  // Samme farge to ganger gir ingenting nytt å se på.
  const unike = støtte.filter(
    (c, i) =>
      støtte.findIndex((x) => x.toLowerCase() === c.toLowerCase()) === i,
  );
  return [
    ...unike.map((c, i) => ({
      ...surface(
        palette,
        c,
        "support",
        i + 1,
        fraManual ? brand.cmyk?.[c] : undefined,
      ),
      ...(!fraManual && { role: roller[støtte.indexOf(c)] }),
    })),
    surface(palette, palette.colors.primary, "logo", 0),
  ];
}
