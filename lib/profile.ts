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
 * ordene designere bruker i en profilmanual. Designeren kan bytte teksten ut
 * med egne bruksregler, og legge til generelle regler. De ligger også i
 * lenken.
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

/** En gruppe med egne bruksregler, eller de generelle reglene. */
export type RuleKey = ProfileKind | "general";

/**
 * Bruksreglene ligger i lenken som `u` + en bokstav. De starter ikke med
 * «b», så de ikke blir en del av palettens id.
 */
export const RULE_PARAMS: Record<RuleKey, string> = {
  logo: "ul",
  support: "us",
  highlight: "uh",
  internal: "ui",
  main: "um",
  general: "ug",
};

/** Lengste tekst per gruppe, i tegn. */
export const MAX_RULE = 600;

export type Rules = Partial<Record<RuleKey, string>>;

/**
 * En bruksregel renset for kontrolltegn (linjeskift beholdes), uten tomme
 * linjer i slutten og kortet ned.
 */
export function cleanRule(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_RULE);
}

/** Bruksreglene i fragmentet. Tomme regler er ikke med. */
export function readRules(hash: string): Rules {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const ut: Rules = {};
  for (const [key, param] of Object.entries(RULE_PARAMS) as [
    RuleKey,
    string,
  ][]) {
    const tekst = cleanRule(q.get(param));
    if (tekst) ut[key] = tekst;
  }
  return ut;
}

/** Fragmentet med en bruksregel satt, eller fjernet når teksten er tom. */
export function withRule(hash: string, key: RuleKey, tekst: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const ren = cleanRule(tekst);
  if (ren) q.set(RULE_PARAMS[key], ren);
  else q.delete(RULE_PARAMS[key]);
  return q.toString().replace(/\+/g, "%20");
}

/** Fragmentet uten bruksregler, til lenken tilbake til verktøyet. */
export function withoutRules(hash: string): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  for (const param of Object.values(RULE_PARAMS)) q.delete(param);
  return q.toString().replace(/\+/g, "%20");
}

/**
 * Linjene i en bruksregel, uten tomme linjer og uten et punkttegn først
 * («- », «* », «• »), så de kan vises som en liste.
 */
export function ruleLines(tekst: string): string[] {
  return tekst
    .split("\n")
    .map((l) => l.replace(/^[-*•–]\s+/, "").trim())
    .filter(Boolean);
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

/**
 * Kundens visning: lenken fra «Kopier lenke til kunden» har `ro=1`, og
 * profilsiden vises da uten knappene for redigering. Det er ikke en
 * tilgangskontroll (alt står i lenken), bare en ren side til kunden.
 */
export const READONLY_PARAM = "ro";

export function isReadonlyLink(hash: string): boolean {
  return (
    new URLSearchParams(hash.replace(/^#/, "")).get(READONLY_PARAM) === "1"
  );
}

export function withReadonly(hash: string, on: boolean): string {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  if (on) q.set(READONLY_PARAM, "1");
  else q.delete(READONLY_PARAM);
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
