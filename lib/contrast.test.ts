import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import {
  contrastLevel,
  contrastRatio,
  formatRatio,
  parseHex,
  suggestPassingColor,
} from "./contrast";
import { checkPalette } from "./contrastPairs";

describe("parseHex", () => {
  it("leser kort og lang form, med og uten #", () => {
    expect(parseHex("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHex("0284C7")).toEqual({ r: 2, g: 132, b: 199 });
  });

  it("avviser ugyldige verdier", () => {
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("blå")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("contrastRatio", () => {
  // Fasitverdier fra WebAIM Contrast Checker.
  it("svart på hvitt er 21:1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("er lik samme vei begge veier", () => {
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(
      contrastRatio("#FFFFFF", "#767676")!,
      10,
    );
  });

  it("#767676 på hvitt er 4.54:1, den mørkeste grå som består AA", () => {
    expect(formatRatio(contrastRatio("#767676", "#FFFFFF")!)).toBe("4.54:1");
    expect(contrastRatio("#777777", "#FFFFFF")!).toBeLessThan(4.5);
  });

  it("gir null for ugyldig farge", () => {
    expect(contrastRatio("#zzz", "#fff")).toBeNull();
  });
});

describe("contrastLevel", () => {
  it("bruker WCAG-grensene for vanlig og stor tekst", () => {
    expect(contrastLevel(7)).toBe("AAA");
    expect(contrastLevel(4.5)).toBe("AA");
    expect(contrastLevel(4.49)).toBe("fail");
    expect(contrastLevel(4.5, true)).toBe("AAA");
    expect(contrastLevel(3, true)).toBe("AA");
    expect(contrastLevel(2.99, true)).toBe("fail");
  });
});

describe("formatRatio", () => {
  it("runder ned, så en farge som stryker aldri vises som 4.50", () => {
    expect(formatRatio(4.499)).toBe("4.49:1");
  });
});

describe("suggestPassingColor", () => {
  it("gir null når fargen allerede består", () => {
    expect(suggestPassingColor("#000000", "#FFFFFF", 4.5)).toBeNull();
  });

  it("gjør en lys grå på hvitt mørk nok, og ikke mer enn nødvendig", () => {
    const forslag = suggestPassingColor("#A3A3A3", "#FFFFFF", 4.5)!;
    const ratio = contrastRatio(forslag, "#FFFFFF")!;
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(4.7);
  });

  it("gjør en mørk farge lysere på mørk bakgrunn", () => {
    const forslag = suggestPassingColor("#334155", "#0F172A", 4.5)!;
    expect(contrastRatio(forslag, "#0F172A")!).toBeGreaterThanOrEqual(4.5);
    expect(parseHex(forslag)!.r).toBeGreaterThan(0x33);
  });

  it("beholder fargetonen", () => {
    const forslag = parseHex(suggestPassingColor("#0EA5E9", "#FFFFFF", 4.5)!)!;
    // Fortsatt blå: blått er største kanal og rødt minste.
    expect(forslag.b).toBeGreaterThan(forslag.g);
    expect(forslag.g).toBeGreaterThan(forslag.r);
  });

  it("gir null når ingen lyshet når målet", () => {
    // Mot mellomgrå er maks kontrast rundt 5.3:1 (mot svart).
    expect(suggestPassingColor("#777777", "#777777", 7)).toBeNull();
  });
});

describe("checkPalette", () => {
  it("gir et forslag som består for hvert par som stryker", () => {
    for (const p of colorPalettes) {
      for (const variant of [p, p.darkVariant].filter((v) => v !== undefined)) {
        for (const r of checkPalette(variant)) {
          expect(r.ratio).not.toBeNull();
          if (r.level !== "fail" || !r.suggestion) continue;
          const nyFg = r.pair.adjust === "fg" ? r.suggestion.color : r.fg;
          const nyBg = r.pair.adjust === "bg" ? r.suggestion.color : r.bg;
          const krav = r.pair.large ? 3 : 4.5;
          expect(contrastRatio(nyFg, nyBg)!).toBeGreaterThanOrEqual(krav);
        }
      }
    }
  });
});
