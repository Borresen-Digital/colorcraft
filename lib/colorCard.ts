import type { ExtendedColorPalette } from "@/data/palettes";
import { formatCmyk, hexToCmyk, parseCmyk, type Cmyk } from "./cmyk";
import { contrastRatio, formatRatio, parseHex } from "./contrast";
import { checkPalette } from "./contrastPairs";
import { localizeRatio, MESSAGES, type Locale } from "./i18n";
import { tints } from "./tint";

/** Tintene som vises som striper ved hver merkefarge på kortet. */
export const CARD_TINTS = [60, 40, 20] as const;

/**
 * Fargekort til kunden.
 *
 * Kortet bygges i to steg, slik at PDF og PNG alltid blir like:
 *
 *   1. `buildCardModel` samler innholdet: fargene med HEX, RGB og CMYK,
 *      kontrast for hvit og svart tekst på hver farge, og kontrastparene i
 *      paletten.
 *   2. `layoutCard` gjør modellen om til tegneoperasjoner (firkanter og
 *      tekst) på en A4-side i punkter, med origo øverst til venstre.
 *
 * PDF-en (pdf-lib) og PNG-en (canvas) tegner bare operasjonene. Oppsettet
 * trenger ikke måle tekst, så de to gir samme resultat.
 */

export const PAGE = { width: 595.28, height: 841.89, margin: 40 } as const;

export interface CardColor {
  label: string;
  hex: string;
  rgb: string;
  /** CMYK-teksten, fra manualen eller omregnet. */
  cmyk: string;
  /** CMYK-verdien til swatchen i PDF, når den er skrevet inn fra manualen. */
  cmykValue?: Cmyk;
  cmykFromManual: boolean;
  outOfGamut: boolean;
  onWhite: number;
  onBlack: number;
  /** Tint-striper (bare for merkefarger). CMYK når den kommer fra manualen. */
  tints: { percent: number; hex: string; cmyk?: Cmyk }[];
}

export interface CardModel {
  title: string;
  subtitle: string;
  sections: { heading: string; colors: CardColor[] }[];
  contrastHeading: string;
  contrast: { label: string; ratio: string; level: string }[];
  footer: string[];
}

function color(
  label: string,
  hex: string,
  manual: string | undefined,
  locale: Locale,
  medTint = false,
): CardColor {
  const k = MESSAGES[locale].card;
  const rgb = parseHex(hex)!;
  const fraManual = manual ? parseCmyk(manual) : null;
  const omregnet = hexToCmyk(hex)!;
  return {
    label,
    hex,
    rgb: `${rgb.r} ${rgb.g} ${rgb.b}`,
    cmyk: fraManual
      ? `${formatCmyk(fraManual)} ${k.fromManual}`
      : `${k.approx} ${formatCmyk(omregnet.cmyk)}`,
    cmykValue: fraManual ?? undefined,
    cmykFromManual: !!fraManual,
    outOfGamut: !fraManual && omregnet.outOfGamut,
    onWhite: contrastRatio("#FFFFFF", hex) ?? 1,
    onBlack: contrastRatio("#000000", hex) ?? 1,
    tints: medTint
      ? tints(hex, fraManual, CARD_TINTS).map((t) => ({
          percent: t.percent,
          hex: t.hex,
          // I PDF-en blir tinten ekte CMYK når manualens tall finnes.
          cmyk: fraManual ? t.cmyk : undefined,
        }))
      : [],
  };
}

/** Deler en tekst i linjer på høyst `max` tegn, mellom ord. */
export function wrap(text: string, max: number): string[] {
  const linjer: string[] = [];
  let linje = "";
  for (const ord of text.split(/\s+/)) {
    if (!ord) continue;
    if (linje && (linje + " " + ord).length > max) {
      linjer.push(linje);
      linje = ord;
    } else {
      linje = linje ? `${linje} ${ord}` : ord;
    }
  }
  if (linje) linjer.push(linje);
  return linjer;
}

export function buildCardModel(
  palette: ExtendedColorPalette,
  locale: Locale,
  maker: string,
  date: Date,
): CardModel {
  const m = MESSAGES[locale];
  const k = m.card;
  const manual = palette.brand?.cmyk ?? {};
  const names = palette.brand?.names ?? {};
  const sections: CardModel["sections"] = [];

  if (palette.brand && palette.brand.logo.length > 0) {
    sections.push({
      heading: k.logoColors,
      colors: palette.brand.logo.map((c, i) =>
        color(names[c] || m.tones.logo(i + 1), c, manual[c], locale, true),
      ),
    });
    if (palette.brand.support.length > 0) {
      sections.push({
        heading: k.supportColors,
        colors: palette.brand.support.map((c, i) =>
          color(names[c] || m.tones.support(i + 1), c, manual[c], locale, true),
        ),
      });
    }
    const highlight = palette.brand.highlight ?? [];
    if (highlight.length > 0) {
      sections.push({
        heading: k.highlightColors,
        colors: highlight.map((c, i) =>
          color(
            names[c] || m.tones.highlight(i + 1),
            c,
            manual[c],
            locale,
            true,
          ),
        ),
      });
    }
  } else {
    const roller = [
      "primary",
      "accent",
      "secondary",
      "background",
      "foreground",
      "muted",
    ] as const;
    sections.push({
      heading: k.mainColors,
      colors: roller.map((r) =>
        color(m.roles[r], palette.colors[r], undefined, locale),
      ),
    });
  }

  const contrast = checkPalette(palette).map((r) => ({
    label: m.contrast.pairs[r.pair.id] ?? r.pair.label,
    ratio: r.ratio === null ? "–" : localizeRatio(formatRatio(r.ratio), locale),
    level: r.level === "fail" ? k.belowAA : r.level,
  }));

  const dato = new Intl.DateTimeFormat(locale === "nb" ? "nb-NO" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const harTint = sections.some((s) => s.colors.some((c) => c.tints.length));
  const footer = [
    ...(maker.trim() ? [k.madeBy(maker.trim().slice(0, 60))] : []),
    k.madeWith,
    ...(harTint ? [k.tintNote] : []),
    ...wrap(k.note, 120),
  ];

  return {
    title: palette.name,
    subtitle: `${k.title} · ${dato}`,
    sections,
    contrastHeading: k.contrastHeading,
    contrast,
    footer,
  };
}

// ---------- Oppsett ----------

export type Fill = { hex: string; cmyk?: Cmyk };

export type Op =
  | {
      kind: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      /** Uten fyll tegnes bare kanten. */
      fill?: Fill;
      stroke?: string;
    }
  | {
      kind: "text";
      x: number;
      /** Grunnlinjen, målt fra toppen av siden. */
      y: number;
      text: string;
      size: number;
      bold?: boolean;
      color: string;
    };

const MØRK = "#1F2937";
const GRÅ = "#4B5563";
const LINJE = "#D1D5DB";

const SWATCH = 92;
const STRIPE = 10;
const BLOKK = 108;

export function layoutCard(model: CardModel, locale: Locale): Op[] {
  const k = MESSAGES[locale].card;
  const ops: Op[] = [];
  const { margin, width, height } = PAGE;
  const innhold = width - margin * 2;
  const tekst = (
    x: number,
    y: number,
    text: string,
    size: number,
    bold = false,
    color = MØRK,
  ) => ops.push({ kind: "text", x, y, text, size, bold, color });

  let y = margin + 22;
  tekst(margin, y, model.title, 22, true);
  y += 18;
  tekst(margin, y, model.subtitle, 10.5, false, GRÅ);
  y += 26;

  const kolonne = (innhold - 20) / 2;
  for (const seksjon of model.sections) {
    tekst(margin, y, seksjon.heading, 13, true);
    y += 12;
    seksjon.colors.forEach((c, i) => {
      const x = margin + (i % 2) * (kolonne + 20);
      const top = y + Math.floor(i / 2) * BLOKK;
      // Med tint blir fargen en blokk med smale striper til høyre, slik
      // manualer viser det.
      const hoved = SWATCH - STRIPE * c.tints.length;
      ops.push({
        kind: "rect",
        x,
        y: top,
        w: hoved,
        h: SWATCH,
        fill: { hex: c.hex, cmyk: c.cmykValue },
      });
      c.tints.forEach((t, j) =>
        ops.push({
          kind: "rect",
          x: x + hoved + j * STRIPE,
          y: top,
          w: STRIPE,
          h: SWATCH,
          fill: { hex: t.hex, cmyk: t.cmyk },
        }),
      );
      // Kanten tegnes til slutt, rundt hele blokken.
      ops.push({
        kind: "rect",
        x,
        y: top,
        w: SWATCH,
        h: SWATCH,
        stroke: LINJE,
      });
      const tx = x + SWATCH + 12;
      tekst(tx, top + 16, c.label, 10.5, true);
      tekst(tx, top + 33, `HEX ${c.hex}  ·  RGB ${c.rgb}`, 8.5, false, GRÅ);
      tekst(
        tx,
        top + 47,
        `CMYK ${c.cmyk}${c.outOfGamut ? ` (${k.outOfGamut})` : ""}`,
        8.5,
        false,
        GRÅ,
      );
      const merk = (r: number) =>
        `${localizeRatio(formatRatio(r), locale)}${r >= 4.5 ? "  AA" : ""}`;
      tekst(
        tx,
        top + 64,
        `${k.whiteText}: ${merk(c.onWhite)}`,
        8.5,
        false,
        GRÅ,
      );
      tekst(
        tx,
        top + 78,
        `${k.blackText}: ${merk(c.onBlack)}`,
        8.5,
        false,
        GRÅ,
      );
    });
    y += Math.ceil(seksjon.colors.length / 2) * BLOKK + 14;
  }

  tekst(margin, y, model.contrastHeading, 13, true);
  y += 16;
  for (const rad of model.contrast) {
    tekst(margin, y, rad.label, 9);
    tekst(margin + 300, y, rad.ratio, 9);
    tekst(margin + 380, y, rad.level, 9, rad.level !== k.belowAA);
    y += 14;
  }

  // Bunnteksten står fast nederst på siden.
  let fy = height - margin - (model.footer.length - 1) * 11;
  ops.push({
    kind: "rect",
    x: margin,
    y: fy - 16,
    w: innhold,
    h: 0.75,
    fill: { hex: LINJE },
  });
  for (const linje of model.footer) {
    tekst(margin, fy, linje, 7.5, false, GRÅ);
    fy += 11;
  }
  return ops;
}

/** Filnavn for kortet: «fargekort-havet.pdf». */
export function cardFilename(
  name: string,
  locale: Locale,
  ext: "pdf" | "png",
): string {
  const slug =
    name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "palett";
  return `${MESSAGES[locale].card.filePrefix}-${slug}.${ext}`;
}
