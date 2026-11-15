import { parseHex } from "./contrast";
import type { ToneStep } from "./toneScale";
import { cleanFont, type TypeSpec } from "./typography";

/**
 * Profilen som en tokenfil Figma kan importere som variabler.
 *
 * Formatet følger Figmas hjelpeside «Modes for variables» (lest 15.11.2026):
 * DTCG-JSON, der
 *
 *   - farger er objekter med colorSpace "srgb", components (0–1), alpha og hex;
 *   - fontFamily er én streng, ikke en liste;
 *   - number og string godtas (string er ikke en offisiell DTCG-type, men
 *     Figma tar den);
 *   - grupper blir mapper med skråstrek (Farger/Logofarger/Dark blue), og to
 *     tokens med samme navn gir bare den første.
 *
 * I Figma: åpne Variables, lag en ny samling og dra filen inn. Hver fil blir
 * en modus.
 */

export interface FigmaColor {
  label: string;
  hex: string;
  /** For eksempel «CMYK 100 80 30 40 (fra manualen)». */
  description?: string;
}

export interface FigmaInput {
  groups: { heading: string; colors: FigmaColor[] }[];
  tones: { label: string; scale: ToneStep[] }[];
  typography: TypeSpec[];
  names: {
    colors: string;
    tones: string;
    typography: string;
    font: string;
    fallback: string;
    weight: string;
    size: string;
    note: string;
  };
}

type Token = {
  $type: string;
  $value: unknown;
  $description?: string;
};
type Group = { [navn: string]: Token | Group };

/**
 * Et tokennavn Figma og DTCG godtar: uten punktum, krøllparenteser og
 * skråstrek (som ville laget nye mapper), og ikke med $ først.
 */
export function tokenName(s: string, reserve = "token"): string {
  let navn = s
    .replace(/[.{}/\\\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  while (navn.startsWith("$")) navn = navn.slice(1).trim();
  return navn || reserve;
}

/** Legger til et navn i en gruppe, med «2», «3» … hvis det finnes fra før. */
function leggTil(gruppe: Group, navn: string, verdi: Token | Group) {
  let n = navn;
  for (let i = 2; n in gruppe; i++) n = `${navn} ${i}`;
  gruppe[n] = verdi;
}

export function colorToken(hex: string, description?: string): Token {
  const rgb = parseHex(hex) ?? { r: 0, g: 0, b: 0 };
  const del = (v: number) => Math.round((v / 255) * 10000) / 10000;
  const token: Token = {
    $type: "color",
    $value: {
      colorSpace: "srgb",
      components: [del(rgb.r), del(rgb.g), del(rgb.b)],
      alpha: 1,
      hex: hex.toUpperCase(),
    },
  };
  if (description) token.$description = description;
  return token;
}

export function toFigmaTokens(input: FigmaInput): string {
  const n = input.names;
  // Ingen $description i roten: Figma lager bare variabler av tokens, og
  // vi vil ikke risikere at importen stopper på noe den ikke kjenner.
  const rot: Group = {};

  const farger: Group = {};
  for (const g of input.groups) {
    if (g.colors.length === 0) continue;
    const gruppe: Group = {};
    for (const c of g.colors) {
      leggTil(
        gruppe,
        tokenName(c.label, c.hex),
        colorToken(c.hex, c.description),
      );
    }
    leggTil(farger, tokenName(g.heading), gruppe);
  }
  if (Object.keys(farger).length > 0) rot[tokenName(n.colors)] = farger;

  const toner: Group = {};
  for (const t of input.tones) {
    const trapp: Group = {};
    for (const s of t.scale) trapp[String(s.step)] = colorToken(s.hex);
    leggTil(toner, tokenName(t.label, t.scale[0]?.hex), trapp);
  }
  if (Object.keys(toner).length > 0) rot[tokenName(n.tones)] = toner;

  const typo: Group = {};
  for (const t of input.typography) {
    const font = cleanFont(t.font);
    if (!font) continue;
    const gruppe: Group = {
      [tokenName(n.font)]: { $type: "fontFamily", $value: font },
      [tokenName(n.weight)]: { $type: "number", $value: t.weight },
    };
    const reserve = cleanFont(t.fallback);
    if (reserve) {
      gruppe[tokenName(n.fallback)] = { $type: "fontFamily", $value: reserve };
    }
    if (t.size) gruppe[tokenName(n.size)] = { $type: "string", $value: t.size };
    if (t.note) gruppe[tokenName(n.note)] = { $type: "string", $value: t.note };
    leggTil(typo, tokenName(t.role, font), gruppe);
  }
  if (Object.keys(typo).length > 0) rot[tokenName(n.typography)] = typo;

  return JSON.stringify(rot, null, 2) + "\n";
}
