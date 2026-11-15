import type { ExtendedColorPalette } from "@/data/palettes";
import { buildCardModel, cardColor, type CardColor } from "./colorCard";
import { parseCmyk } from "./cmyk";
import { DEFAULT_LOCALE, MESSAGES, type Locale } from "./i18n";
import { tints, type Tint } from "./tint";

/**
 * Profilsiden: fargeprofilen som en side designeren kan sende til kunden.
 *
 * Siden leser paletten fra den samme lenken som verktøyet deler. Det finnes
 * fortsatt ingen database: alt ligger i fragmentet, og ingenting sendes til
 * serveren. Verdiene er de samme som på fargekortet (HEX, RGB, CMYK og
 * kontrast), så kortet og siden aldri sier noe forskjellig.
 *
 * I tillegg har hver gruppe en kort tekst om hva fargene brukes til, med de
 * ordene designere bruker i en profilmanual.
 */

/** Tintene som vises under hver merkefarge på siden. */
export const PROFILE_TINTS = [80, 60, 40, 20] as const;

/** «Laget av» ligger i lenken som `mk`. Resten av lenken er delelenken. */
export const MAKER_PARAM = "mk";
const MAX_MAKER = 60;

export type ProfileKind =
  "logo" | "support" | "highlight" | "internal" | "main";

export interface ProfileColor extends CardColor {
  /** Tekstfargen som står best på fargen: hvit eller svart. */
  text: "#FFFFFF" | "#000000";
  profileTints: Tint[];
}

export interface ProfileSection {
  kind: ProfileKind;
  heading: string;
  usage: string;
  colors: ProfileColor[];
}

export interface ProfileModel {
  title: string;
  sections: ProfileSection[];
  contrast: { label: string; ratio: string; level: string }[];
}

/** Stien til profilsiden på et språk. Norsk har ikke prefiks. */
export function profilePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/profil" : `/${locale}/profil`;
}

/** Navnet i «Laget av», renset for kontrolltegn og kortet ned. */
export function cleanMaker(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MAKER);
}

/** Leser «Laget av» fra fragmentet. */
export function readMaker(hash: string): string {
  return cleanMaker(
    new URLSearchParams(hash.replace(/^#/, "")).get(MAKER_PARAM),
  );
}

/** Fragmentet med «Laget av» satt, eller fjernet når navnet er tomt. */
export function withMaker(hash: string, maker: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const navn = cleanMaker(maker);
  if (navn) q.set(MAKER_PARAM, navn);
  else q.delete(MAKER_PARAM);
  return q.toString().replace(/\+/g, "%20");
}

/** Fragmentet uten «Laget av», til lenken tilbake til verktøyet. */
export function withoutMaker(hash: string): string {
  return withMaker(hash, "");
}

function profileColor(
  label: string,
  hex: string,
  manual: string | undefined,
  locale: Locale,
  medTint: boolean,
): ProfileColor {
  const c = cardColor(label, hex, manual, locale);
  return {
    ...c,
    text: c.onWhite >= c.onBlack ? "#FFFFFF" : "#000000",
    profileTints: medTint
      ? tints(hex, manual ? parseCmyk(manual) : null, PROFILE_TINTS)
      : [],
  };
}

export function buildProfile(
  palette: ExtendedColorPalette,
  locale: Locale,
): ProfileModel {
  const m = MESSAGES[locale];
  const k = m.card;
  const u = m.profile.usage;
  const brand = palette.brand;
  const manual = brand?.cmyk ?? {};
  const names = brand?.names ?? {};
  const sections: ProfileSection[] = [];

  const gruppe = (
    kind: ProfileKind,
    heading: string,
    farger: string[],
    navn: (i: number) => string,
    medTint: boolean,
  ) => {
    if (farger.length === 0) return;
    sections.push({
      kind,
      heading,
      usage: u[kind],
      colors: farger.map((c, i) =>
        profileColor(names[c] || navn(i + 1), c, manual[c], locale, medTint),
      ),
    });
  };

  if (brand && brand.logo.length > 0) {
    gruppe("logo", k.logoColors, brand.logo, m.tones.logo, true);
    gruppe("support", k.supportColors, brand.support, m.tones.support, true);
    gruppe(
      "highlight",
      k.highlightColors,
      brand.highlight ?? [],
      m.tones.highlight,
      true,
    );
    gruppe(
      "internal",
      k.internalColors,
      brand.internal ?? [],
      m.tones.internal,
      false,
    );
  } else {
    // En palett uten profil: hovedfargene, uten tint.
    const roller = [
      "primary",
      "accent",
      "secondary",
      "background",
      "foreground",
      "muted",
    ] as const;
    sections.push({
      kind: "main",
      heading: k.mainColors,
      usage: u.main,
      colors: roller.map((r) =>
        profileColor(m.roles[r], palette.colors[r], undefined, locale, false),
      ),
    });
  }

  // Kontrastparene er de samme som på fargekortet.
  const { contrast } = buildCardModel(palette, locale, "", new Date(0));
  return { title: palette.name, sections, contrast };
}
