import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { generateFromBrand, type BrandNote } from "./brand";
import { formatCmyk } from "./cmyk";
import { localizePalette, MESSAGES, type Locale } from "./i18n";
import { pantoneKey, readPantone } from "./pantone";
import { buildProfile, cleanRule, readMaker, readRules } from "./profile";
import type { ProfileExportInput } from "./profileExport";
import { withProfileExtras } from "./profileExtras";
import type { ImportedProfile } from "./profileImport";
import { decodeShare, encodeShare } from "./share";
import { toneScale } from "./toneScale";
import { cleanFont, readTypography } from "./typography";

/**
 * Profilen mellom lenkeformen (fragmentet) og dataformen (profilfilen), på
 * serveren. Brukes av MCP: en AI leser profiler som profilfiler og lager
 * nye fra profilfiler, uten nettleser. Profilsiden bygger det samme i
 * nettleseren fra det som står i feltene.
 */

/** Paletten i fragmentet, eller null. Innebygde paletter på riktig språk. */
export function paletteFromHash(
  hash: string,
  locale: Locale,
): ExtendedColorPalette | null {
  const delt = decodeShare(hash, MESSAGES[locale].palette);
  if (delt?.kind === "builtin") {
    const p = colorPalettes.find((x) => x.id === delt.id);
    return p ? localizePalette(p, locale) : null;
  }
  return delt?.kind === "custom" ? delt.palette : null;
}

/** Alt eksporten trenger, fra fragmentet. Null når det ikke er en profil. */
export function exportInputFromHash(
  hash: string,
  locale: Locale,
  link?: string,
): ProfileExportInput | null {
  const palette = paletteFromHash(hash, locale);
  if (!palette) return null;
  const m = MESSAGES[locale];
  const profil = buildProfile(palette, locale);
  const regler = readRules(hash);
  const pantone = readPantone(hash);
  const tonefarger = profil.sections.flatMap((s) =>
    s.kind === "internal"
      ? []
      : (s.kind === "main" ? s.colors.slice(0, 3) : s.colors).map((c) => ({
          label: c.label,
          hex: c.hex,
        })),
  );
  const unike = tonefarger.filter(
    (f, i) => tonefarger.findIndex((g) => g.hex === f.hex) === i,
  );
  return {
    title: profil.title,
    credit: `${m.profile.madeWith} (farger.borresendigital.no)`,
    maker: readMaker(hash) || undefined,
    colors: profil.sections.flatMap((s) =>
      s.colors.map((c) => ({
        group: s.heading,
        role: s.kind,
        label: c.label,
        hex: c.hex,
        cmyk: c.cmyk,
        cmykNumbers: c.cmykValue
          ? formatCmyk(c.cmykValue)
          : c.cmyk.slice(m.card.approx.length + 1),
        cmykFromManual: c.cmykFromManual,
        pantone: pantone[pantoneKey(c.hex)] || undefined,
      })),
    ),
    tones: unike.map((f) => ({ label: f.label, scale: toneScale(f.hex) })),
    typography: readTypography(hash).filter((t) => cleanFont(t.font)),
    rules: [
      ...profil.sections.map((s) => ({
        group: s.heading,
        role: s.kind,
        text: cleanRule(regler[s.kind]),
      })),
      {
        group: m.profile.rules,
        role: "general" as const,
        text: cleanRule(regler.general),
      },
    ],
    link,
    direction: palette.brand?.direction,
    figmaNames: m.profile.figmaNames,
  };
}

/**
 * En importert profilfil som fragment: paletten regnes ut på samme måte som
 * «Fra profilmanual», og tilleggene (typografi, regler, Pantone, «Laget av»)
 * legges til. `notes` sier hva generatoren justerte, så AI-en kan fortelle
 * designeren det.
 */
export function hashFromImported(
  p: ImportedProfile,
  locale: Locale,
): { hash: string; title: string; notes: BrandNote[] } {
  const b = MESSAGES[locale].brand;
  const t = MESSAGES[locale].palette;
  const navn = p.name || b.defaultName;
  const retning = p.brand.direction ?? "neutral";
  const r = generateFromBrand({
    logo: p.brand.logo,
    support: p.brand.support,
    highlight: p.brand.highlight,
    direction: retning,
  });
  const beskrivelse =
    retning === "neutral"
      ? b.description
      : `${b.description} · ${b.directions[retning]}`;
  const palette: ExtendedColorPalette = {
    id: "custom-mcp",
    name: navn,
    description: beskrivelse,
    colors: r.light,
    darkVariant: {
      id: "custom-mcp-dark",
      name: `${navn} ${t.darkSuffix}`,
      description: `${beskrivelse} ${t.darkDescriptionSuffix}`,
      colors: r.dark,
    },
    brand: p.brand,
  };
  const hash = withProfileExtras(encodeShare(palette, false), p.extras);
  return { hash, title: navn, notes: r.notes };
}
