import type { ExtendedColorPalette } from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { contrastRatio, relativeLuminance, parseHex } from "./contrast";
import { LOGO_MIN, TEXT_MIN } from "./surfaces";

/**
 * Fargene til «I bruk»: rollup, annonse, visittkort og presentasjon.
 *
 * Trykksaker har ikke lys og mørk modus, så for en palett fra en
 * profilmanual hentes alt fra merkefargene, uansett hvilken variant som
 * vises. Andre paletter bruker rollene i varianten som vises.
 *
 *   hero    Den store flaten: logofargen, slik den brukes på en rollup.
 *           Gir den ikke lesbar tekst, brukes en støttefarge som gjør det.
 *   band    Stripen og andre små flater: highlight, ellers en støttefarge.
 *   button  Knappen, som står på hero og derfor må skille seg fra den.
 *   paper   Lys flate: baksiden av kortet og lysbildet.
 *
 * Tekst på en farge er merkets mørkeste farge når den er mørk nok (navy på
 * beige, som i manualen), ellers hvit eller nesten svart, den som gir best
 * kontrast. Logoen står i negativ på hero og i egen farge på papir.
 */

export interface InUseCheck {
  id: "hero" | "band" | "button" | "paper" | "logoHero" | "logoPaper";
  ratio: number;
  min: number;
  ok: boolean;
}

export interface InUseColors {
  hero: string;
  heroText: string;
  band: string;
  bandText: string;
  button: string;
  buttonText: string;
  paper: string;
  paperText: string;
  /** Logoen i egen farge, brukt på papir. */
  logo: string;
  /** Den interne profilens farger, til den interne presentasjonen. */
  internal: string[];
  checks: InUseCheck[];
}

const HVIT = "#FFFFFF";
const SVART = "#1A1A1A";

const r = (a: string, b: string) => contrastRatio(a, b) ?? 1;
const lum = (hex: string) => relativeLuminance(parseHex(hex)!);

/** Den av kandidatene som gir best kontrast mot `bg`. */
function best(bg: string, kandidater: string[]): string {
  return kandidater.reduce((a, b) => (r(b, bg) > r(a, bg) ? b : a));
}

export function inUseColors(
  palette: ColorPalette,
  brand?: ExtendedColorPalette["brand"],
): InUseColors {
  const fraManual = !!brand && brand.logo.length > 0;
  const logo = fraManual ? brand.logo[0] : palette.colors.primary;
  const highlight = fraManual ? (brand.highlight ?? []) : [];
  const støtte = fraManual ? brand.support : [palette.colors.secondary];
  const alle = fraManual
    ? [...brand.logo, ...brand.support, ...highlight]
    : [palette.colors.primary, palette.colors.foreground];

  // Merkets mørkeste farge som tekst, når den er nesten like mørk som svart.
  const mørkeste = alle.reduce((a, b) => (lum(b) < lum(a) ? b : a));
  const mørk = r(mørkeste, HVIT) >= 12 ? mørkeste : SVART;
  const tekst = (bg: string, foretrukket?: string) =>
    foretrukket && foretrukket !== bg && r(foretrukket, bg) >= TEXT_MIN
      ? foretrukket
      : best(bg, [HVIT, mørk]);

  // Logofargen er hovedflaten så lenge store overskrifter og logoen synes på
  // den (3:1). Om brødteksten også består, viser sjekken under.
  const synlig = (bg: string) => r(best(bg, [HVIT, mørk]), bg) >= LOGO_MIN;
  const hero =
    [logo, ...støtte].find(synlig) ??
    (fraManual ? mørk : palette.colors.foreground);
  const heroText = tekst(hero);

  // Stripen skal skille seg fra hovedflaten. Highlight går først når den
  // gjør det. Ellers velges den merkefargen som står tydeligst mot hero.
  const ulik = (c: string) =>
    c.toUpperCase() !== hero.toUpperCase() && r(c, hero) >= 2;
  const kandidater = [
    ...støtte,
    ...(fraManual ? brand.logo.slice(1) : []),
    palette.colors.accent,
  ].filter(ulik);
  const band =
    highlight.find(ulik) ??
    (kandidater.length > 0
      ? kandidater.reduce((a, b) => (r(b, hero) > r(a, hero) ? b : a))
      : heroText);
  const bandText = tekst(band, hero);

  const aksent = fraManual
    ? (highlight[0] ?? brand.logo[1] ?? band)
    : palette.colors.accent;
  const button = ulik(aksent) ? aksent : band;
  const buttonText = tekst(button, hero);

  const lysStøtte = støtte.filter((c) => lum(c) >= 0.75);
  const paper = fraManual
    ? (lysStøtte.sort((a, b) => lum(b) - lum(a))[0] ?? HVIT)
    : palette.colors.background;
  const paperText = fraManual ? tekst(paper, mørk) : palette.colors.foreground;

  const sjekk = (
    id: InUseCheck["id"],
    fg: string,
    bg: string,
    min: number,
  ): InUseCheck => ({ id, ratio: r(fg, bg), min, ok: r(fg, bg) >= min });

  return {
    hero,
    heroText,
    band,
    bandText,
    button,
    buttonText,
    paper,
    paperText,
    logo,
    internal: fraManual ? (brand.internal ?? []) : [],
    checks: [
      sjekk("hero", heroText, hero, TEXT_MIN),
      sjekk("band", bandText, band, TEXT_MIN),
      sjekk("button", buttonText, button, TEXT_MIN),
      sjekk("paper", paperText, paper, TEXT_MIN),
      sjekk("logoHero", heroText, hero, LOGO_MIN),
      sjekk("logoPaper", logo, paper, LOGO_MIN),
    ],
  };
}
