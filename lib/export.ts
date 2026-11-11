import type { ExtendedColorPalette } from "@/data/palettes";
import type { ColorPalette } from "@/types/palette";
import { textOn } from "./contrastPairs";

/**
 * Eksport av en palett, lys og eventuelt mørk, til tre formater:
 *
 *   - CSS-variabler med mørk modus på samme måte som tokens.css på
 *     borresendigital.no: `prefers-color-scheme` som standard, og
 *     `data-theme="light"`/`"dark"` på <html> for å overstyre.
 *   - Tailwind 4: de samme variablene, pluss `@theme inline` som gjør dem til
 *     klasser (`bg-primary`, `text-muted`) og en `dark`-variant som følger
 *     data-theme.
 *   - JSON etter W3C Design Tokens-formatet (DTCG), som Tokens Studio for
 *     Figma og Style Dictionary leser.
 *
 * Alle tre tar med `on-primary` og `on-accent`: tekstfargen kontrastsjekken
 * og forhåndsvisningen bruker på knapper.
 */

export type ExportFormat = "css" | "tailwind" | "json";

type Tokens = Array<[name: string, value: string]>;

function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function tokens(palette: ColorPalette): Tokens {
  const ut: Tokens = Object.entries(palette.colors).map(([k, v]) => [
    kebab(k),
    v.toUpperCase(),
  ]);
  ut.push(["on-primary", textOn(palette, palette.colors.primary)]);
  ut.push(["on-accent", textOn(palette, palette.colors.accent)]);
  return ut;
}

/** Navnet kan være skrevet av brukeren. Det skal aldri kunne lukke en kommentar. */
function safeName(name: string): string {
  return name
    .replace(/\*\//g, "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

export function fileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "palett";
}

function header(palette: ColorPalette): string {
  return `/* ${safeName(palette.name)}, laget med ColorCraft (farger.borresendigital.no) */`;
}

function block(
  selector: string,
  t: Tokens,
  prefix: string,
  opts: { scheme?: "light" | "dark"; indent?: string } = {},
): string {
  const ind = opts.indent ?? "";
  const linjer = [
    // color-scheme gir nettleserens egne flater (rullefelt, skjemafelt) riktig modus.
    ...(opts.scheme ? [`${ind}  color-scheme: ${opts.scheme};`] : []),
    ...t.map(([n, v]) => `${ind}  --${prefix}${n}: ${v};`),
  ];
  return [`${ind}${selector} {`, ...linjer, `${ind}}`].join("\n");
}

/** Lys og mørk modus i samme mønster som tokens.css på borresendigital.no. */
function themeBlocks(palette: ExtendedColorPalette, prefix: string): string {
  const lys = tokens(palette);
  if (!palette.darkVariant) return block(":root", lys, prefix);
  const mork = tokens(palette.darkVariant);
  return [
    block(":root", lys, prefix, { scheme: "light" }),
    block('[data-theme="dark"]', mork, prefix, { scheme: "dark" }),
    [
      "@media (prefers-color-scheme: dark) {",
      block(':root:not([data-theme="light"])', mork, prefix, {
        scheme: "dark",
        indent: "  ",
      }),
      "}",
    ].join("\n"),
  ].join("\n\n");
}

export function toCss(palette: ExtendedColorPalette): string {
  return `${header(palette)}\n\n${themeBlocks(palette, "color-")}\n`;
}

export function toTailwind(palette: ExtendedColorPalette): string {
  const navn = tokens(palette).map(([n]) => n);
  const theme = `@theme inline {\n${navn
    .map((n) => `  --color-${n}: var(--palette-${n});`)
    .join("\n")}\n}`;
  const deler = [header(palette), '@import "tailwindcss";'];
  if (palette.darkVariant) {
    deler.push(
      "/* dark: følger data-theme på <html>. Uten data-theme brukes systemvalget. */\n" +
        '@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));',
    );
  }
  deler.push(theme, themeBlocks(palette, "palette-"));
  return deler.join("\n\n") + "\n";
}

function dtcg(palette: ColorPalette) {
  return Object.fromEntries(
    tokens(palette).map(([n, v]) => [n, { $type: "color", $value: v }]),
  );
}

export function toJson(palette: ExtendedColorPalette): string {
  const ut: Record<string, unknown> = {
    $description: `${safeName(palette.name)}, laget med ColorCraft (farger.borresendigital.no)`,
    light: { color: dtcg(palette) },
  };
  if (palette.darkVariant) ut.dark = { color: dtcg(palette.darkVariant) };
  return JSON.stringify(ut, null, 2) + "\n";
}

export const EXPORTS: Record<
  ExportFormat,
  {
    label: string;
    render: (p: ExtendedColorPalette) => string;
    filename: (p: ExtendedColorPalette) => string;
    mime: string;
  }
> = {
  css: {
    label: "CSS",
    render: toCss,
    filename: (p) => `${fileSlug(p.name)}.css`,
    mime: "text/css",
  },
  tailwind: {
    label: "Tailwind 4",
    render: toTailwind,
    filename: (p) => `${fileSlug(p.name)}.tailwind.css`,
    mime: "text/css",
  },
  json: {
    label: "JSON",
    render: toJson,
    filename: (p) => `${fileSlug(p.name)}.tokens.json`,
    mime: "application/json",
  },
};
