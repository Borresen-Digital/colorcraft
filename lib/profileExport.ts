import { parseHex } from "./contrast";
import { fileSlug } from "./export";
import { toFigmaTokens, type FigmaInput } from "./figmaExport";
import { cssSlug, type ToneStep } from "./toneScale";
import { cleanFont, fontStack, type TypeSpec } from "./typography";

/**
 * Eksport av profilsiden: merkefargene, tonetrappen og typografien i
 * formatene utviklere og designere bruker.
 *
 *   css       CSS-variabler i :root
 *   scss      Sass-variabler og et kart per tonetrapp
 *   tailwind  Tailwind 4 @theme (gir bg-navn-500, font-overskrifter …)
 *   tokens    Design tokens (DTCG-utkastet med hex-strenger), som Style
 *             Dictionary og Tokens Studio leser
 *   figma     Formatet Figma importerer som variabler (se figmaExport.ts)
 *   swift     SwiftUI Color
 *   flutter   Dart-klasse med Color-konstanter
 *   android   colors.xml
 *   profile   Hele profilen som JSON, også bruksregler og Pantone. Tenkt
 *             for andre verktøy og for AI som skal lese eller lage en profil.
 *
 * Alt lages i nettleseren. Navn designeren har skrevet, renses for hvert
 * format, så de ikke kan lukke en kommentar eller bryte koden.
 */

export const PROFILE_FORMATS = [
  "css",
  "scss",
  "tailwind",
  "tokens",
  "figma",
  "swift",
  "flutter",
  "android",
  "profile",
] as const;
export type ProfileFormat = (typeof PROFILE_FORMATS)[number];

export interface ExportColor {
  group: string;
  label: string;
  hex: string;
  /** CMYK-teksten slik profilsiden viser den. */
  cmyk?: string;
  pantone?: string;
}

export interface ProfileExportInput {
  title: string;
  /** «Laget med ColorCraft (farger.borresendigital.no)» på riktig språk. */
  credit: string;
  maker?: string;
  colors: ExportColor[];
  tones: { label: string; scale: ToneStep[] }[];
  typography: TypeSpec[];
  rules: { group: string; text: string }[];
  /** Lenken til profilsiden, til profile-formatet. */
  link?: string;
  figmaNames: FigmaInput["names"];
}

export const FORMAT_INFO: Record<
  ProfileFormat,
  { label: string; ext: string; mime: string }
> = {
  css: { label: "CSS", ext: "css", mime: "text/css" },
  scss: { label: "SCSS", ext: "scss", mime: "text/x-scss" },
  tailwind: { label: "Tailwind 4", ext: "tailwind.css", mime: "text/css" },
  tokens: {
    label: "Design tokens",
    ext: "tokens.json",
    mime: "application/json",
  },
  figma: { label: "Figma", ext: "figma.tokens.json", mime: "application/json" },
  swift: { label: "Swift", ext: "swift", mime: "text/x-swift" },
  flutter: { label: "Flutter", ext: "dart", mime: "text/x-dart" },
  android: { label: "Android", ext: "xml", mime: "application/xml" },
  profile: {
    label: "Profil (JSON)",
    ext: "profile.json",
    mime: "application/json",
  },
};

export function profileFilename(title: string, format: ProfileFormat): string {
  return `${fileSlug(title)}.${FORMAT_INFO[format].ext}`;
}

// ---------- navn ----------

/** Tekst som trygt kan stå i en kommentar på én linje i alle formatene. */
function enLinje(s: string): string {
  return s
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .split("*/")
    .join("")
    .split("--")
    .join("-")
    .replace(/\s+/g, " ")
    .trim();
}

/** varm-rorfarge → varmRorfarge, og aldri et tall først. */
function camel(slug: string): string {
  const deler = slug.split("-").filter(Boolean);
  const s = deler
    .map((d, i) => (i === 0 ? d : d[0].toUpperCase() + d.slice(1)))
    .join("");
  return /^[a-z]/.test(s) ? s : `c${s}`;
}

function snake(slug: string): string {
  const s = slug.split("-").filter(Boolean).join("_");
  return /^[a-z]/.test(s) ? s : `c_${s}`;
}

/** Unike slugs for en liste navn: «farge», «farge-2» … */
function unikeSlugs(navn: string[]): string[] {
  const brukt = new Set<string>();
  return navn.map((n) => {
    const base = cssSlug(n);
    let s = base;
    for (let i = 2; brukt.has(s); i++) s = `${base}-${i}`;
    brukt.add(s);
    return s;
  });
}

/** Unike farger (samme HEX bare én gang), med slug. */
function farger(input: ProfileExportInput) {
  const unike = input.colors.filter(
    (c, i) => input.colors.findIndex((d) => d.hex === c.hex) === i,
  );
  const slugs = unikeSlugs(unike.map((c) => c.label));
  return unike.map((c, i) => ({ ...c, slug: slugs[i] }));
}

function toner(input: ProfileExportInput) {
  const slugs = unikeSlugs(input.tones.map((t) => t.label));
  return input.tones.map((t, i) => ({ ...t, slug: slugs[i] }));
}

function fonter(input: ProfileExportInput) {
  const liste = input.typography.filter((t) => cleanFont(t.font));
  const slugs = unikeSlugs(liste.map((t) => t.role || t.font));
  return liste.map((t, i) => ({ ...t, slug: slugs[i] }));
}

const lav = (hex: string) => hex.toLowerCase();

// ---------- formatene ----------

function css(input: ProfileExportInput, prefix = ""): string[] {
  const linjer: string[] = [];
  for (const c of farger(input))
    linjer.push(`  --${prefix}color-${c.slug}: ${lav(c.hex)};`);
  for (const t of toner(input)) {
    linjer.push("");
    for (const s of t.scale) {
      linjer.push(`  --${prefix}color-${t.slug}-${s.step}: ${lav(s.hex)};`);
    }
  }
  const f = fonter(input);
  if (f.length > 0) linjer.push("");
  for (const t of f) {
    linjer.push(`  --${prefix}font-${t.slug}: ${fontStack(t)};`);
  }
  return linjer;
}

function toCss(input: ProfileExportInput): string {
  const fontVekter = fonter(input).map(
    (t) => `  --font-weight-${t.slug}: ${t.weight};`,
  );
  return [
    `/* ${enLinje(input.title)} · ${enLinje(input.credit)} */`,
    ":root {",
    ...css(input),
    ...fontVekter,
    "}",
    "",
  ].join("\n");
}

function toTailwind(input: ProfileExportInput): string {
  return [
    `/* ${enLinje(input.title)} · ${enLinje(input.credit)} */`,
    '@import "tailwindcss";',
    "",
    "@theme {",
    ...css(input),
    "}",
    "",
  ].join("\n");
}

function toScss(input: ProfileExportInput): string {
  const linjer = [`// ${enLinje(input.title)} · ${enLinje(input.credit)}`, ""];
  for (const c of farger(input))
    linjer.push(`$color-${c.slug}: ${lav(c.hex)};`);
  for (const t of toner(input)) {
    linjer.push("", `$color-${t.slug}-tones: (`);
    for (const s of t.scale) linjer.push(`  ${s.step}: ${lav(s.hex)},`);
    linjer.push(");");
  }
  const f = fonter(input);
  if (f.length > 0) linjer.push("");
  for (const t of f) {
    linjer.push(`$font-${t.slug}: ${fontStack(t)};`);
    linjer.push(`$font-weight-${t.slug}: ${t.weight};`);
  }
  return linjer.join("\n") + "\n";
}

function toTokens(input: ProfileExportInput): string {
  const color: Record<string, unknown> = {};
  for (const c of farger(input)) {
    color[c.slug] = { $type: "color", $value: lav(c.hex) };
  }
  for (const t of toner(input)) {
    const trapp: Record<string, unknown> = {};
    for (const s of t.scale)
      trapp[s.step] = { $type: "color", $value: lav(s.hex) };
    const navn = color[t.slug] ? `${t.slug}-tones` : t.slug;
    color[navn] = trapp;
  }
  const font: Record<string, unknown> = {};
  for (const t of fonter(input)) {
    font[t.slug] = {
      family: {
        $type: "fontFamily",
        $value: [cleanFont(t.font), cleanFont(t.fallback), "sans-serif"].filter(
          Boolean,
        ),
      },
      weight: { $type: "fontWeight", $value: t.weight },
    };
  }
  const ut: Record<string, unknown> = {
    $description: `${enLinje(input.title)} · ${enLinje(input.credit)}`,
    color,
  };
  if (Object.keys(font).length > 0) ut.font = font;
  return JSON.stringify(ut, null, 2) + "\n";
}

function rgb01(hex: string): [string, string, string] {
  const c = parseHex(hex) ?? { r: 0, g: 0, b: 0 };
  const f = (v: number) => String(Math.round((v / 255) * 10000) / 10000);
  return [f(c.r), f(c.g), f(c.b)];
}

function toSwift(input: ProfileExportInput): string {
  const linje = (navn: string, hex: string) => {
    const [r, g, b] = rgb01(hex);
    return `    static let ${navn} = Color(.sRGB, red: ${r}, green: ${g}, blue: ${b}) // ${hex.toUpperCase()}`;
  };
  const ut = [
    `// ${enLinje(input.title)} · ${enLinje(input.credit)}`,
    "import SwiftUI",
    "",
    "extension Color {",
  ];
  for (const c of farger(input)) ut.push(linje(camel(c.slug), c.hex));
  for (const t of toner(input)) {
    ut.push("");
    for (const s of t.scale) ut.push(linje(`${camel(t.slug)}${s.step}`, s.hex));
  }
  ut.push("}");
  const f = fonter(input);
  if (f.length > 0) {
    ut.push("", "enum BrandFont {");
    for (const t of f) {
      // Fontnavnet er renset til bokstaver, tall, mellomrom og ._- (cleanFont).
      ut.push(`    static let ${camel(t.slug)} = "${cleanFont(t.font)}"`);
    }
    ut.push("}");
  }
  return ut.join("\n") + "\n";
}

function argb(hex: string): string {
  return `0xFF${hex.replace(/^#/, "").toUpperCase()}`;
}

function toFlutter(input: ProfileExportInput): string {
  const ut = [
    `// ${enLinje(input.title)} · ${enLinje(input.credit)}`,
    "import 'package:flutter/painting.dart';",
    "",
    "abstract final class BrandColors {",
  ];
  for (const c of farger(input)) {
    ut.push(`  static const ${camel(c.slug)} = Color(${argb(c.hex)});`);
  }
  for (const t of toner(input)) {
    ut.push("");
    for (const s of t.scale) {
      ut.push(
        `  static const ${camel(t.slug)}${s.step} = Color(${argb(s.hex)});`,
      );
    }
  }
  ut.push("}");
  const f = fonter(input);
  if (f.length > 0) {
    ut.push("", "abstract final class BrandFonts {");
    for (const t of f) {
      ut.push(`  static const ${camel(t.slug)} = '${cleanFont(t.font)}';`);
      ut.push(
        `  static const ${camel(t.slug)}Weight = FontWeight.w${t.weight};`,
      );
    }
    ut.push("}");
  }
  return ut.join("\n") + "\n";
}

function toAndroid(input: ProfileExportInput): string {
  const ut = [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<!-- ${enLinje(input.title)} · ${enLinje(input.credit)} -->`,
    "<resources>",
  ];
  for (const c of farger(input)) {
    ut.push(
      `    <color name="${snake(c.slug)}">${argb(c.hex).replace("0x", "#")}</color>`,
    );
  }
  for (const t of toner(input)) {
    for (const s of t.scale) {
      ut.push(
        `    <color name="${snake(t.slug)}_${s.step}">${argb(s.hex).replace("0x", "#")}</color>`,
      );
    }
  }
  ut.push("</resources>");
  return ut.join("\n") + "\n";
}

/**
 * Hele profilen som data. Formatet har navn og versjon, så et annet verktøy
 * (eller en AI) vet hva det leser, og så det kan endres uten å knekke gamle
 * filer.
 */
function toProfile(input: ProfileExportInput): string {
  const ut = {
    format: "colorcraft-profile",
    version: 1,
    title: input.title,
    ...(input.maker ? { maker: input.maker } : {}),
    ...(input.link ? { link: input.link } : {}),
    colors: input.colors.map((c) => ({
      group: c.group,
      name: c.label,
      hex: c.hex.toUpperCase(),
      ...(c.cmyk ? { cmyk: c.cmyk } : {}),
      ...(c.pantone ? { pantone: c.pantone } : {}),
    })),
    tones: input.tones.map((t) => ({
      name: t.label,
      steps: Object.fromEntries(
        t.scale.map((s) => [s.step, s.hex.toUpperCase()]),
      ),
    })),
    typography: fonter(input).map((t) => ({
      role: t.role,
      font: cleanFont(t.font),
      weight: t.weight,
      ...(t.size ? { size: t.size } : {}),
      ...(cleanFont(t.fallback) ? { fallback: cleanFont(t.fallback) } : {}),
      ...(t.note ? { note: t.note } : {}),
    })),
    rules: input.rules.filter((r) => r.text),
    generator: input.credit,
  };
  return JSON.stringify(ut, null, 2) + "\n";
}

export function renderProfile(
  format: ProfileFormat,
  input: ProfileExportInput,
): string {
  switch (format) {
    case "css":
      return toCss(input);
    case "scss":
      return toScss(input);
    case "tailwind":
      return toTailwind(input);
    case "tokens":
      return toTokens(input);
    case "figma":
      return toFigmaTokens({
        groups: [...new Set(input.colors.map((c) => c.group))].map((g) => ({
          heading: g,
          colors: input.colors
            .filter((c) => c.group === g)
            .map((c) => ({
              label: c.label,
              hex: c.hex,
              description: [
                c.cmyk && `CMYK ${c.cmyk}`,
                c.pantone && `Pantone ${c.pantone}`,
              ]
                .filter(Boolean)
                .join(" · "),
            })),
        })),
        tones: input.tones,
        typography: input.typography,
        names: input.figmaNames,
      });
    case "swift":
      return toSwift(input);
    case "flutter":
      return toFlutter(input);
    case "android":
      return toAndroid(input);
    case "profile":
      return toProfile(input);
  }
}
