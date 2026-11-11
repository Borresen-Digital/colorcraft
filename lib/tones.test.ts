import { describe, expect, it } from "vitest";
import { normalizeHex } from "./brand";
import {
  COOL_HUE,
  hexToOklch,
  hueDistance,
  oklchToHex,
  valorScale,
  variants,
  WARM_HUE,
} from "./tones";

const FARGER = [
  "#F2B705",
  "#0284C7",
  "#C8102E",
  "#2E7D32",
  "#0B2545",
  "#F5EFE0",
];

describe("OKLCH", () => {
  it("går rundt uten å endre fargen", () => {
    for (const hex of [...FARGER, "#000000", "#FFFFFF", "#808080"]) {
      expect(oklchToHex(hexToOklch(hex)!)).toBe(hex);
    }
  });

  it("gir kjente verdier for hvitt og svart", () => {
    expect(hexToOklch("#FFFFFF")!.l).toBeCloseTo(1, 3);
    expect(hexToOklch("#000000")!.l).toBeCloseTo(0, 3);
    expect(hexToOklch("#808080")!.c).toBeLessThan(0.001);
  });

  it("trekker farger utenfor skjermen inn uten å endre lysheten mye", () => {
    // Svært mettet lys blå finnes ikke på skjerm.
    const hex = oklchToHex({ l: 0.9, c: 0.4, h: 250 });
    expect(normalizeHex(hex)).toBe(hex);
    expect(hexToOklch(hex)!.l).toBeCloseTo(0.9, 2);
  });
});

describe("valorScale", () => {
  for (const hex of FARGER) {
    it(`${hex}: går fra lyst til mørkt, med fargen selv på sin plass`, () => {
      const s = valorScale(hex);
      expect(s.length).toBeGreaterThanOrEqual(9);
      for (let i = 1; i < s.length; i++) {
        expect(s[i].l).toBeLessThan(s[i - 1].l);
      }
      const egen = s.filter((t) => t.original);
      expect(egen).toHaveLength(1);
      expect(egen[0].hex).toBe(hex);
      for (const t of s) expect(normalizeHex(t.hex)).toBe(t.hex);
    });
  }

  it("beholder fargetonen i mellomtrinnene", () => {
    const h = hexToOklch("#0284C7")!.h;
    for (const t of valorScale("#0284C7").filter(
      (t) => t.l > 0.3 && t.l < 0.9,
    )) {
      expect(hueDistance(hexToOklch(t.hex)!.h, h)).toBeLessThan(6);
    }
  });

  it("gir tom liste for ugyldig farge", () => {
    expect(valorScale("tull")).toEqual([]);
  });
});

describe("variants", () => {
  for (const hex of FARGER.filter((h) => hexToOklch(h)!.c >= 0.02)) {
    it(`${hex}: varmere og kaldere har samme lyshet og flytter tonen riktig vei`, () => {
      const o = hexToOklch(hex)!;
      const v = variants(hex)!;
      const w = hexToOklch(v.warmer)!;
      const c = hexToOklch(v.cooler)!;
      expect(w.l).toBeCloseTo(o.l, 2);
      expect(c.l).toBeCloseTo(o.l, 2);
      expect(hueDistance(w.h, WARM_HUE)).toBeLessThanOrEqual(
        hueDistance(o.h, WARM_HUE) + 1,
      );
      expect(hueDistance(c.h, COOL_HUE)).toBeLessThanOrEqual(
        hueDistance(o.h, COOL_HUE) + 1,
      );
    });

    it(`${hex}: mer mettet har mer kroma, mindre mettet har mindre`, () => {
      const o = hexToOklch(hex)!;
      const v = variants(hex)!;
      expect(hexToOklch(v.lessSaturated)!.c).toBeLessThan(o.c);
      expect(hexToOklch(v.moreSaturated)!.c).toBeGreaterThanOrEqual(
        o.c - 0.005,
      );
    });
  }

  it("gir grå en svak varm og kald tone", () => {
    const v = variants("#808080")!;
    expect(hexToOklch(v.warmer)!.c).toBeGreaterThan(0.01);
    expect(hueDistance(hexToOklch(v.warmer)!.h, WARM_HUE)).toBeLessThan(10);
    expect(hueDistance(hexToOklch(v.cooler)!.h, COOL_HUE)).toBeLessThan(10);
  });
});
