import type { ExtendedColorPalette } from "@/data/palettes";
import { parseCmyk, type Cmyk } from "./cmyk";
import { formatRatio } from "./contrast";
import { PAGE, wrap, type Fill, type Op } from "./colorCard";
import { localizeRatio, MESSAGES, type Locale } from "./i18n";
import { inUseColors, type InUseColors } from "./inUse";

/**
 * Side 2 på fargekortet: «I bruk». De samme trykksakene som fanen i
 * forhåndsvisningen (rollup, annonse, visittkort, lysbilde og eventuelt den
 * interne presentasjonen), tegnet med firkanter, sirkler og tekst, så PDF og
 * PNG blir like. Farger med CMYK fra manualen fylles med de tallene i PDF-en.
 */

export interface InUsePageModel {
  title: string;
  subtitle: string;
  /** Navnet i logomerket (palettnavnet uten «mørk»). */
  name: string;
  colors: InUseColors;
  cmyk: Record<string, Cmyk>;
  checks: { label: string; ratio: string; ok: boolean }[];
  footer: string[];
}

export function buildInUseModel(
  palette: ExtendedColorPalette,
  locale: Locale,
): InUsePageModel {
  const m = MESSAGES[locale];
  const c = inUseColors(palette, palette.brand);
  const cmyk: Record<string, Cmyk> = {};
  for (const [hex, tekst] of Object.entries(palette.brand?.cmyk ?? {})) {
    const v = parseCmyk(tekst);
    if (v) cmyk[hex.toUpperCase()] = v;
  }
  return {
    title: palette.name,
    subtitle: `${m.inUse.tab} · ${m.card.title}`,
    name: palette.name.replace(/\s+(mørk|dark)$/i, ""),
    colors: c,
    cmyk,
    checks: c.checks.map((s) => ({
      label: m.inUse.checks[s.id],
      ratio: localizeRatio(formatRatio(s.ratio), locale),
      ok: s.ok,
    })),
    footer: [m.card.madeWith],
  };
}

const GRÅ = "#4B5563";
const MØRK = "#1F2937";
const LINJE = "#D1D5DB";
const BILDE = "#8A8F96";

export function layoutInUse(model: InUsePageModel, locale: Locale): Op[] {
  const k = MESSAGES[locale].inUse;
  const sur = MESSAGES[locale].surfaces;
  const c = model.colors;
  const ops: Op[] = [];
  const { margin, height } = PAGE;
  const fyll = (hex: string): Fill => ({
    hex,
    cmyk: model.cmyk[hex.toUpperCase()],
  });
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    hex?: string,
    stroke?: string,
  ) =>
    ops.push({
      kind: "rect",
      x,
      y,
      w,
      h,
      ...(hex && { fill: fyll(hex) }),
      ...(stroke && { stroke }),
    });
  const tekst = (
    x: number,
    y: number,
    text: string,
    size: number,
    color: string,
    bold = false,
    align?: "center",
  ) =>
    ops.push({
      kind: "text",
      x,
      y,
      text,
      size,
      bold,
      color,
      ...(align && { align }),
    });
  /** Logomerket: en ring med en prikk, og navnet ved siden av. */
  const logo = (
    x: number,
    y: number,
    r: number,
    farge: string,
    navn: string,
    size: number,
  ) => {
    ops.push({ kind: "circle", cx: x, cy: y, r, stroke: farge, width: r / 3 });
    ops.push({ kind: "circle", cx: x, cy: y, r: r / 3, fill: farge });
    if (navn) tekst(x + r + 4, y + size / 3, navn, size, farge, true);
  };
  const linjer = (
    x: number,
    y: number,
    text: string,
    max: number,
    size: number,
    color: string,
    bold = false,
    align?: "center",
  ) => {
    wrap(text, max).forEach((l, i) =>
      tekst(x, y + i * size * 1.2, l, size, color, bold, align),
    );
  };

  let y = margin + 22;
  tekst(margin, y, model.title, 22, MØRK, true);
  y += 18;
  tekst(margin, y, model.subtitle, 10.5, GRÅ);
  const topp = 110;

  // Rollup, 110 × 264.
  {
    const x = margin;
    const w = 110;
    rect(x, topp, w, 264, c.hero);
    logo(x + 14, topp + 18, 6, c.heroText, model.name, 7);
    linjer(x + 10, topp + 50, k.headline, 18, 11, c.heroText, true);
    linjer(x + 10, topp + 84, k.body, 28, 6.5, c.heroText);
    rect(x, topp + 110, w, 104, BILDE);
    tekst(
      x + w / 2,
      topp + 164,
      k.image.toUpperCase(),
      6,
      "#FFFFFF",
      true,
      "center",
    );
    rect(x, topp + 214, w, 22, c.band);
    tekst(x + w / 2, topp + 228, k.services, 6, c.bandText, true, "center");
    tekst(x + w / 2, topp + 253, k.url, 7, c.heroText, true, "center");
    tekst(x + w / 2, topp + 264 + 14, k.rollup, 8, GRÅ, false, "center");
  }

  // Displayannonse, 110 × 220.
  {
    const x = margin + 130;
    const w = 110;
    rect(x, topp, w, 220, c.hero);
    linjer(
      x + w / 2,
      topp + 24,
      k.adHeadline,
      14,
      12,
      c.heroText,
      true,
      "center",
    );
    tekst(x + w / 2, topp + 54, k.adSub, 7, c.heroText, false, "center");
    rect(x, topp + 64, w, 88, BILDE);
    tekst(
      x + w / 2,
      topp + 111,
      k.image.toUpperCase(),
      6,
      "#FFFFFF",
      true,
      "center",
    );
    rect(x + w / 2 - 34, topp + 162, 68, 18, c.button);
    tekst(x + w / 2, topp + 174, k.cta, 7.5, c.buttonText, true, "center");
    logo(x + 22, topp + 202, 5, c.heroText, model.name, 6.5);
    tekst(x + w / 2, topp + 220 + 14, k.ad, 8, GRÅ, false, "center");
  }

  // Visittkort, forside og bakside, 170 × 110.
  {
    const x = margin + 260;
    const w = 170;
    rect(x, topp, w, 110, c.hero);
    logo(x + 40, topp + 55, 9, c.heroText, model.name, 10);
    const bak = topp + 122;
    rect(x, bak, w, 110, c.paper, LINJE);
    rect(x + w - 6, bak, 6, 110, c.band);
    logo(x + 16, bak + 16, 5, c.logo, model.name, 7);
    tekst(x + 12, bak + 78, k.person, 8, c.paperText, true);
    tekst(x + 12, bak + 89, k.role, 6.5, c.paperText);
    tekst(x + 12, bak + 101, k.url, 6.5, c.paperText);
    tekst(x + w / 2, bak + 110 + 14, k.card, 8, GRÅ, false, "center");
  }

  // Lysbilde og intern presentasjon, 16:9 (240 × 135).
  const rad2 = topp + 300;
  {
    const x = margin;
    rect(x, rad2, 240, 135, c.paper, LINJE);
    rect(x, rad2, 80, 135, c.hero);
    logo(x + 14, rad2 + 121, 5, c.heroText, "", 0);
    linjer(x + 94, rad2 + 58, k.slideTitle, 22, 11, c.paperText, true);
    rect(x + 94, rad2 + 84, 30, 3, c.band);
    tekst(x + 94, rad2 + 98, k.slideSub, 7, c.paperText);
    tekst(x + 120, rad2 + 135 + 14, k.slide, 8, GRÅ, false, "center");
  }
  if (c.internal.length > 0) {
    const x = margin + 260;
    rect(x, rad2, 240, 135, c.paper, LINJE);
    rect(x + 168, rad2 + 8, 64, 12, c.hero);
    tekst(
      x + 200,
      rad2 + 16.5,
      k.internalOnly.toUpperCase(),
      5.5,
      c.heroText,
      true,
      "center",
    );
    tekst(x + 12, rad2 + 22, k.chartTitle, 9, c.paperText, true);
    const høyder = [55, 80, 40, 95, 65, 75];
    const bredde = (216 - (c.internal.length - 1) * 6) / c.internal.length;
    c.internal.forEach((farge, i) => {
      const h = (høyder[i % 6] / 100) * 74;
      rect(x + 12 + i * (bredde + 6), rad2 + 108 - h, bredde, h, farge);
    });
    logo(x + 17, rad2 + 122, 4, c.logo, model.name, 6.5);
    tekst(x + 120, rad2 + 135 + 14, k.internalSlide, 8, GRÅ, false, "center");
  }

  // Kontrast for tekst og logo på flatene.
  y = rad2 + 180;
  tekst(margin, y, k.checksTitle, 13, MØRK, true);
  y += 16;
  for (const s of model.checks) {
    tekst(margin, y, s.label, 9, MØRK);
    tekst(margin + 300, y, s.ratio, 9, MØRK);
    tekst(margin + 380, y, s.ok ? sur.ok : sur.fail, 9, MØRK, s.ok);
    y += 14;
  }

  let fy = height - margin - (model.footer.length - 1) * 11;
  rect(margin, fy - 16, PAGE.width - margin * 2, 0.75, LINJE);
  for (const l of model.footer) {
    tekst(margin, fy, l, 7.5, GRÅ);
    fy += 11;
  }
  return ops;
}
