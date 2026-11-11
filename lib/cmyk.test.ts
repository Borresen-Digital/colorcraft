import { describe, expect, it } from "vitest";
import {
  cmykToHex,
  formatCmyk,
  GAMUT_LIMIT,
  hexToCmyk,
  parseCmyk,
} from "./cmyk";

describe("cmykToHex", () => {
  it("treffer trykkfargene slik de ser ut på bestrøket papir, ikke den naive formelen", () => {
    expect(cmykToHex({ c: 0, m: 0, y: 0, k: 0 })).toBe("#FFFFFF");
    expect(cmykToHex({ c: 100, m: 0, y: 0, k: 0 })).toBe("#00A0E3");
    expect(cmykToHex({ c: 0, m: 100, y: 0, k: 0 })).toBe("#E6007E");
    expect(cmykToHex({ c: 0, m: 0, y: 100, k: 0 })).toBe("#FFED00");
    expect(cmykToHex({ c: 0, m: 0, y: 0, k: 100 })).toBe("#1D1D1B");
    expect(cmykToHex({ c: 0, m: 100, y: 100, k: 0 })).toBe("#E30613");
    // Den naive formelen ville gitt #00FFFF for C100.
    expect(cmykToHex({ c: 100, m: 0, y: 0, k: 0 })).not.toBe("#00FFFF");
  });

  it("blir mørkere jo mer farge og svart", () => {
    const lys = parseInt(
      cmykToHex({ c: 20, m: 0, y: 0, k: 0 }).slice(1, 3),
      16,
    );
    const mørk = parseInt(
      cmykToHex({ c: 80, m: 0, y: 0, k: 0 }).slice(1, 3),
      16,
    );
    expect(mørk).toBeLessThan(lys);
    const k50 = cmykToHex({ c: 0, m: 0, y: 0, k: 50 });
    expect(k50 > "#1D1D1B" && k50 < "#FFFFFF").toBe(true);
  });

  it("tåler verdier utenfor 0–100 ved å klemme dem", () => {
    expect(cmykToHex({ c: -5, m: 0, y: 0, k: 0 })).toBe("#FFFFFF");
    expect(cmykToHex({ c: 140, m: 0, y: 0, k: 0 })).toBe("#00A0E3");
  });
});

describe("hexToCmyk", () => {
  it("går tilbake til omtrent samme CMYK for farger som kan trykkes", () => {
    for (const x of [
      { c: 0, m: 25, y: 100, k: 0 },
      { c: 100, m: 60, y: 0, k: 20 },
      { c: 10, m: 5, y: 20, k: 0 },
      { c: 0, m: 0, y: 0, k: 60 },
    ]) {
      const hex = cmykToHex(x);
      const r = hexToCmyk(hex)!;
      expect(r.outOfGamut).toBe(false);
      // Mange CMYK-verdier gir samme farge, så det som må stemme, er fargen.
      expect(cmykToHex(r.cmyk)).toSatisfy((h: string) => {
        const a = parseInt(h.slice(1), 16);
        const b = parseInt(hex.slice(1), 16);
        const d = (s: number) => Math.abs(((a >> s) & 255) - ((b >> s) & 255));
        return d(16) <= 12 && d(8) <= 12 && d(0) <= 12;
      });
    }
  });

  it("hvit er 0 0 0 0, og lyse farger får ikke svart", () => {
    expect(hexToCmyk("#FFFFFF")!.cmyk).toEqual({ c: 0, m: 0, y: 0, k: 0 });
    expect(hexToCmyk("#F5EFE0")!.cmyk.k).toBe(0);
  });

  it("sier fra når en skjermfarge ikke kan trykkes likt", () => {
    const grønn = hexToCmyk("#00FF00")!;
    expect(grønn.outOfGamut).toBe(true);
    expect(grønn.distance).toBeGreaterThan(GAMUT_LIMIT);
  });

  it("gir null for ugyldig farge og hele prosent ellers", () => {
    expect(hexToCmyk("tull")).toBeNull();
    const { cmyk } = hexToCmyk("#F2B705")!;
    for (const v of Object.values(cmyk)) expect(Number.isInteger(v)).toBe(true);
  });
});

describe("parseCmyk og formatCmyk", () => {
  it("leser vanlige skrivemåter", () => {
    const fasit = { c: 0, m: 25, y: 100, k: 0 };
    expect(parseCmyk("0 25 100 0")).toEqual(fasit);
    expect(parseCmyk("0/25/100/0")).toEqual(fasit);
    expect(parseCmyk("0, 25, 100, 0")).toEqual(fasit);
    expect(parseCmyk("0% 25% 100% 0%")).toEqual(fasit);
  });
  it("avviser feil antall, tekst og verdier utenfor 0–100", () => {
    expect(parseCmyk("0 25 100")).toBeNull();
    expect(parseCmyk("a b c d")).toBeNull();
    expect(parseCmyk("0 25 120 0")).toBeNull();
    expect(parseCmyk("")).toBeNull();
  });
  it("skriver hele tall med mellomrom", () => {
    expect(formatCmyk({ c: 0, m: 25.4, y: 99.6, k: 0 })).toBe("0 25 100 0");
  });
});
