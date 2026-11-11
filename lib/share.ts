import {
  colorPalettes,
  resolvePaletteId,
  type ExtendedColorPalette,
} from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";

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

function cleanName(name: string | null): string {
  // Kontrolltegn ut, mellomrom samlet, og en øvre grense. React escaper
  // resten når navnet vises.
  const ren = (name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
  return ren || "Shared palette";
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
  }
  if (dark && palette.darkVariant) q.set("m", "dark");
  // URLSearchParams bruker + for mellomrom. %20 er tydeligere i en lenke som
  // limes inn i en e-post.
  return q.toString().replace(/\+/g, "%20");
}

/** Leser fragmentet (med eller uten #). Gir null hvis det ikke er en palett. */
export function decodeShare(hash: string): SharedState | null {
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

  const name = cleanName(q.get("n"));
  const id = `shared-${contentId(`${name}|${q.get("l")}|${q.get("d") ?? ""}`)}`;
  const palette: ExtendedColorPalette = {
    id,
    name,
    description: "Shared palette",
    colors: lys,
    ...(mork && {
      darkVariant: {
        id: `${id}-dark`,
        name: `${name} Dark`,
        description: "Shared palette - Dark mode",
        colors: mork,
      },
    }),
  };
  return { kind: "custom", palette, dark: dark && !!mork };
}
