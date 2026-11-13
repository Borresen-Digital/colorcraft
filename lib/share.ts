import {
  colorPalettes,
  resolvePaletteId,
  type ExtendedColorPalette,
} from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { DIRECTIONS, type Direction } from "./brand";
import { formatCmyk, parseCmyk } from "./cmyk";

/**
 * Delbar lenke: paletten ligger i adressen, så den kan sendes til en kunde
 * eller utvikler uten database.
 *
 * Alt ligger i fragmentet (etter #). Nettleseren sender aldri fragmentet til
 * serveren, så en delt palett blir ikke logget noe sted, og siden kan fortsatt
 * være ferdig gjengitt på kanten.
 *
 *   #p=larvikitt&m=dark                     en innebygd palett
 *   #n=Min%20palett&l=<84 hex>&d=<84 hex>   en egen palett, lys og mørk
 *
 * Fargene står i fast rekkefølge (COLOR_ROLES), seks hex-tegn hver, uten #.
 *
 * En palett fra profilmanualen tar med merkefargene, så mottakeren får de
 * samme flatene, highlightfargene, den interne profilen og fargekortet:
 *
 *   bl, bs, bh, bi   logo, støtte, highlight og intern profil (6 hex hver)
 *   br               retningen, hvis den ikke er nøytral
 *   bn               navnene, skilt med |, i samme rekkefølge som fargene
 *   bc               CMYK fra manualen som c_m_y_k, skilt med ., samme rekkefølge
 * `v` er formatversjonen, så formatet kan endres uten å knekke gamle lenker.
 */

export const COLOR_ROLES = [
  "primary",
  "secondary",
  "accent",
  "warm",
  "cool",
  "background",
  "surface",
  "foreground",
  "muted",
  "border",
  "success",
  "warning",
  "error",
  "info",
] as const satisfies readonly (keyof ColorPalette["colors"])[];

const FORMAT_VERSION = "1";
const MAX_NAME = 60;

export type SharedState =
  | { kind: "builtin"; id: string; dark: boolean }
  | { kind: "custom"; palette: ExtendedColorPalette; dark: boolean };

function encodeColors(p: ColorPalette): string {
  return COLOR_ROLES.map((r) =>
    p.colors[r].replace(/^#/, "").toLowerCase(),
  ).join("");
}

function decodeColors(s: string | null): ColorPalette["colors"] | null {
  if (!s || !/^[0-9a-fA-F]+$/.test(s) || s.length !== COLOR_ROLES.length * 6) {
    return null;
  }
  const farger = {} as ColorPalette["colors"];
  COLOR_ROLES.forEach((r, i) => {
    farger[r] = `#${s.slice(i * 6, i * 6 + 6).toUpperCase()}`;
  });
  return farger;
}

/** Kort, stabil id fra innholdet, så samme lenke gir samme palett. */
function contentId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function cleanName(name: string | null, fallback: string): string {
  // Kontrolltegn ut, mellomrom samlet, og en øvre grense. React escaper
  // resten når navnet vises.
  const ren = (name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
  return ren || fallback;
}

const BRAND_LISTS = [
  ["bl", "logo"],
  ["bs", "support"],
  ["bh", "highlight"],
  ["bi", "internal"],
] as const;
const MAX_BRAND = 12;
const MAX_COLOR_NAME = 40;

type Brand = NonNullable<ExtendedColorPalette["brand"]>;

function brandColors(b: Brand): string[] {
  return BRAND_LISTS.flatMap(([, k]) => b[k] ?? []).map((h) => h.toUpperCase());
}

function encodeBrand(b: Brand, q: URLSearchParams) {
  for (const [nøkkel, k] of BRAND_LISTS) {
    const liste = b[k] ?? [];
    if (liste.length > 0) {
      q.set(
        nøkkel,
        liste.map((h) => h.replace(/^#/, "").toLowerCase()).join(""),
      );
    }
  }
  if (b.direction && b.direction !== "neutral") q.set("br", b.direction);
  const alle = brandColors(b);
  const navn = alle.map((h) =>
    cleanName(b.names?.[h] ?? b.names?.[h.toLowerCase()] ?? "", "")
      .replace(/\|/g, "/")
      .slice(0, MAX_COLOR_NAME),
  );
  if (navn.some(Boolean)) q.set("bn", navn.join("|"));
  const cmyk = alle.map((h) => {
    const v = parseCmyk(b.cmyk?.[h] ?? b.cmyk?.[h.toLowerCase()] ?? "");
    return v ? formatCmyk(v).replace(/ /g, "_") : "";
  });
  if (cmyk.some(Boolean)) q.set("bc", cmyk.join("."));
}

function hexList(s: string | null): string[] | null {
  if (s === null) return [];
  if (!/^[0-9a-fA-F]*$/.test(s) || s.length % 6 !== 0) return null;
  return (s.match(/.{6}/g) ?? []).map((h) => `#${h.toUpperCase()}`);
}

/** Merkefargene fra lenken, eller undefined hvis det ikke er noen. */
function decodeBrand(q: URLSearchParams): Brand | undefined {
  const lister = BRAND_LISTS.map(([nøkkel]) => hexList(q.get(nøkkel)));
  if (lister.some((l) => l === null)) return undefined;
  const [logo, support, highlight, internal] = lister as string[][];
  if (logo.length === 0) return undefined;
  if (lister.flat().length > MAX_BRAND * 2) return undefined;
  const alle = [...logo, ...support, ...highlight, ...internal];
  const r = q.get("br");
  const direction: Direction = DIRECTIONS.includes(r as Direction)
    ? (r as Direction)
    : "neutral";
  const names: Record<string, string> = {};
  (q.get("bn") ?? "").split("|").forEach((n, i) => {
    const ren = cleanName(n, "").slice(0, MAX_COLOR_NAME);
    if (ren && alle[i]) names[alle[i]] = ren;
  });
  const cmyk: Record<string, string> = {};
  (q.get("bc") ?? "").split(".").forEach((c, i) => {
    const v = parseCmyk(c.replace(/_/g, " "));
    if (v && alle[i]) cmyk[alle[i]] = formatCmyk(v);
  });
  return { logo, support, highlight, internal, direction, names, cmyk };
}

function sameColors(a: ColorPalette, b: ColorPalette): boolean {
  return COLOR_ROLES.every(
    (r) => a.colors[r].toLowerCase() === b.colors[r].toLowerCase(),
  );
}

/**
 * Lenken for paletten som vises. Innebygde paletter som ikke er endret, deles
 * med id. Alt annet deles med fargene, så mottakeren ser det samme.
 */
export function encodeShare(
  palette: ExtendedColorPalette,
  dark: boolean,
): string {
  const q = new URLSearchParams();
  const innebygd = colorPalettes.find((p) => p.id === palette.id);
  const urort =
    innebygd &&
    sameColors(innebygd, palette) &&
    (!innebygd.darkVariant ||
      (palette.darkVariant &&
        sameColors(innebygd.darkVariant, palette.darkVariant)));

  if (urort) {
    q.set("p", palette.id);
  } else {
    q.set("v", FORMAT_VERSION);
    q.set("n", palette.name);
    q.set("l", encodeColors(palette));
    if (palette.darkVariant) q.set("d", encodeColors(palette.darkVariant));
    if (palette.brand) encodeBrand(palette.brand, q);
  }
  if (dark && palette.darkVariant) q.set("m", "dark");
  // URLSearchParams bruker + for mellomrom. %20 er tydeligere i en lenke som
  // limes inn i en e-post.
  return q.toString().replace(/\+/g, "%20");
}

/** Tekstene en delt palett får, på sidens språk. */
export interface ShareLabels {
  sharedName: string;
  sharedDescription: string;
  darkSuffix: string;
  darkDescriptionSuffix: string;
}

const ENGLISH_LABELS: ShareLabels = {
  sharedName: "Shared palette",
  sharedDescription: "Shared palette",
  darkSuffix: "dark",
  darkDescriptionSuffix: "(dark mode)",
};

/** Leser fragmentet (med eller uten #). Gir null hvis det ikke er en palett. */
export function decodeShare(
  hash: string,
  labels: ShareLabels = ENGLISH_LABELS,
): SharedState | null {
  const q = new URLSearchParams(hash.replace(/^#/, ""));
  const dark = q.get("m") === "dark";

  const p = q.get("p");
  if (p) {
    const id = resolvePaletteId(p.replace(/-dark$/, ""));
    if (!colorPalettes.some((x) => x.id === id)) return null;
    return { kind: "builtin", id, dark: dark || p.endsWith("-dark") };
  }

  const v = q.get("v");
  if (v !== null && v !== FORMAT_VERSION) return null;
  const lys = decodeColors(q.get("l"));
  if (!lys) return null;
  const mork = decodeColors(q.get("d"));
  const brand = decodeBrand(q);
  const merke = brand
    ? `|${new URLSearchParams(
        [...q].filter(([k]) => k.startsWith("b")),
      ).toString()}`
    : "";

  // Id-en bygger på det som står i lenken, ikke på språket, så samme lenke
  // gir samme palett på begge sidene.
  const id = `shared-${contentId(`${cleanName(q.get("n"), "")}|${q.get("l")}|${q.get("d") ?? ""}${merke}`)}`;
  const name = cleanName(q.get("n"), labels.sharedName);
  const palette: ExtendedColorPalette = {
    id,
    name,
    description: labels.sharedDescription,
    colors: lys,
    ...(mork && {
      darkVariant: {
        id: `${id}-dark`,
        name: `${name} ${labels.darkSuffix}`,
        description: `${labels.sharedDescription} ${labels.darkDescriptionSuffix}`,
        colors: mork,
      },
    }),
    ...(brand && { brand }),
  };
  return { kind: "custom", palette, dark: dark && !!mork };
}
