import type { ExtendedColorPalette } from "@/data/palettes";
import {
  DIRECTIONS,
  MAX_HIGHLIGHT,
  MAX_LOGO,
  MAX_SUPPORT,
  normalizeHex,
  type Direction,
} from "./brand";
import { formatCmyk, parseCmyk } from "./cmyk";
import { MESSAGES } from "./i18n";
import { MAX_INTERNAL } from "./internal";
import { cleanPantone, pantoneKey, type PantoneMap } from "./pantone";
import {
  cleanMaker,
  cleanRule,
  RULE_PARAMS,
  type RuleKey,
  type Rules,
} from "./profile";
import { cleanType, MAX_TYPES, type TypeSpec } from "./typography";

/**
 * Import av «Profil (JSON)» fra profilsiden (format colorcraft-profile,
 * versjon 1).
 *
 * Filen kan komme fra hvem som helst, også fra en AI, så alt sjekkes og
 * renses: ukjente felt hoppes over, farger må være gyldige, og tekst kortes
 * ned med de samme reglene som lenken bruker. Resultatet er et utgangspunkt
 * for «Fra profilmanual», der designeren ser over fargene før paletten
 * lages. Ingenting lagres før det.
 */

export const PROFILE_FORMAT = "colorcraft-profile";
export const PROFILE_VERSION = 1;
/** Største fil vi leser. En profil er noen få kB. */
export const MAX_PROFILE_BYTES = 200_000;
const MAX_COLORS = 40;
const MAX_NAME = 60;

type Liste = "logo" | "support" | "highlight" | "internal";
const LISTER: Liste[] = ["logo", "support", "highlight", "internal"];
const MAKS: Record<Liste, number> = {
  logo: MAX_LOGO,
  support: MAX_SUPPORT,
  highlight: MAX_HIGHLIGHT,
  internal: MAX_INTERNAL,
};

/** Det som følger med til profilsiden, men ikke hører til paletten. */
export interface ProfileExtras {
  maker: string;
  typography: TypeSpec[];
  rules: Rules;
  pantone: PantoneMap;
}

export interface ImportedProfile {
  name: string;
  brand: NonNullable<ExtendedColorPalette["brand"]>;
  extras: ProfileExtras;
  /** Farger som ikke fikk plass i en gruppe (for mange). */
  dropped: number;
}

export type ImportError = "size" | "json" | "format" | "version" | "colors";

export type ImportResult =
  { ok: true; profile: ImportedProfile } | { ok: false; error: ImportError };

const tekst = (v: unknown, maks: number): string =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maks)
    : "";

/** Gruppenavn på begge språk, for filer uten rolle. */
function rolleFraGruppe(gruppe: string): Liste | "main" | null {
  const g = gruppe.toLowerCase();
  for (const m of Object.values(MESSAGES)) {
    const k = m.card;
    if (g === k.logoColors.toLowerCase()) return "logo";
    if (g === k.supportColors.toLowerCase()) return "support";
    if (g === k.highlightColors.toLowerCase()) return "highlight";
    if (g === k.internalColors.toLowerCase()) return "internal";
    if (g === k.mainColors.toLowerCase()) return "main";
  }
  return null;
}

function rolle(c: Record<string, unknown>): Liste | "main" | null {
  const r = c.role;
  if (r === "main" || (typeof r === "string" && LISTER.includes(r as Liste))) {
    return r as Liste | "main";
  }
  return rolleFraGruppe(tekst(c.group, MAX_NAME));
}

export function parseProfileJson(input: string): ImportResult {
  if (input.length > MAX_PROFILE_BYTES) return { ok: false, error: "size" };
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return { ok: false, error: "json" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "format" };
  }
  const o = data as Record<string, unknown>;
  if (o.format !== PROFILE_FORMAT) return { ok: false, error: "format" };
  if (o.version !== PROFILE_VERSION) return { ok: false, error: "version" };
  if (!Array.isArray(o.colors)) return { ok: false, error: "colors" };

  const lister: Record<Liste, string[]> = {
    logo: [],
    support: [],
    highlight: [],
    internal: [],
  };
  const hoved: string[] = [];
  const uten: string[] = [];
  const names: Record<string, string> = {};
  const cmyk: Record<string, string> = {};
  const pantone: PantoneMap = {};
  const sett = new Set<string>();

  for (const rå of o.colors.slice(0, MAX_COLORS)) {
    if (!rå || typeof rå !== "object") continue;
    const c = rå as Record<string, unknown>;
    const hex = typeof c.hex === "string" ? normalizeHex(c.hex) : null;
    // En farge står bare ett sted, som i skjemaet.
    if (!hex || sett.has(hex)) continue;
    sett.add(hex);
    const r = rolle(c);
    if (r === "main") hoved.push(hex);
    else if (r) lister[r].push(hex);
    else uten.push(hex);
    const navn = tekst(c.name, MAX_NAME);
    if (navn) names[hex] = navn;
    if (c.cmykSource === "manual" && typeof c.cmyk === "string") {
      const v = parseCmyk(c.cmyk);
      if (v) cmyk[hex] = formatCmyk(v);
    }
    const pms = cleanPantone(typeof c.pantone === "string" ? c.pantone : "");
    if (pms) pantone[pantoneKey(hex)] = pms;
  }

  // En palett uten profil har hovedfargene i fast rekkefølge: hovedfarge,
  // uthevingsfarge, flatefarge, bakgrunn, tekst og svak tekst.
  if (lister.logo.length === 0 && hoved.length > 0) {
    lister.logo.push(hoved[0]);
    if (hoved[1]) lister.highlight.push(hoved[1]);
    lister.support.push(...hoved.slice(2, 4));
  }
  // Farger uten kjent gruppe blir flatefarger, eller logofarge hvis den mangler.
  for (const hex of uten) {
    if (lister.logo.length === 0) lister.logo.push(hex);
    else lister.support.push(hex);
  }
  if (lister.logo.length === 0) return { ok: false, error: "colors" };

  let dropped = 0;
  for (const l of LISTER) {
    dropped += Math.max(0, lister[l].length - MAKS[l]);
    lister[l] = lister[l].slice(0, MAKS[l]);
  }
  const brukt = new Set(LISTER.flatMap((l) => lister[l]));
  const filtrer = <T>(m: Record<string, T>) =>
    Object.fromEntries(Object.entries(m).filter(([h]) => brukt.has(h)));

  const retning = DIRECTIONS.includes(o.direction as Direction)
    ? (o.direction as Direction)
    : "neutral";

  const typography = (Array.isArray(o.typography) ? o.typography : [])
    .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
    .map((t) =>
      cleanType({
        role: tekst(t.role, MAX_NAME),
        font: tekst(t.font, MAX_NAME),
        weight: typeof t.weight === "number" ? t.weight : 400,
        size: tekst(t.size, MAX_NAME),
        fallback: tekst(t.fallback, MAX_NAME),
        note: tekst(t.note, 160),
      }),
    )
    .filter((t) => t.font)
    .slice(0, MAX_TYPES);

  const rules: Rules = {};
  for (const r of Array.isArray(o.rules) ? o.rules : []) {
    if (!r || typeof r !== "object") continue;
    const regel = r as Record<string, unknown>;
    const key = regel.role as RuleKey;
    if (typeof key !== "string" || !Object.hasOwn(RULE_PARAMS, key)) continue;
    const t = cleanRule(typeof regel.text === "string" ? regel.text : "");
    if (t) rules[key] = t;
  }
  // En palett uten profil blir en palett med profil. Regelen for
  // hovedfargene følger hovedfargen, som nå er logofargen.
  if (rules.main) {
    if (!rules.logo) rules.logo = rules.main;
    delete rules.main;
  }

  return {
    ok: true,
    profile: {
      name: tekst(o.title, MAX_NAME),
      brand: {
        ...lister,
        direction: retning,
        names: filtrer(names),
        cmyk: filtrer(cmyk),
      },
      extras: {
        maker: cleanMaker(typeof o.maker === "string" ? o.maker : ""),
        typography,
        rules,
        pantone: Object.fromEntries(
          Object.entries(pantone).filter(([k]) => brukt.has(`#${k}`)),
        ),
      },
      dropped,
    },
  };
}
