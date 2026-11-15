import { describe, expect, it } from "vitest";
import { parseHex } from "./contrast";
import { extractColors, suggestLogoColors } from "./logoColors";

/** RGBA-piksler: [hex, antall, alfa]. */
function piksler(...deler: [string, number, number?][]): number[] {
  const ut: number[] = [];
  for (const [hex, n, a = 255] of deler) {
    const { r, g, b } = parseHex(hex)!;
    for (let i = 0; i < n; i++) ut.push(r, g, b, a);
  }
  return ut;
}

describe("extractColors", () => {
  it("finner logofargene, største først, uten hvit bakgrunn", () => {
    const f = extractColors(
      piksler(
        ["#FFFFFF", 5000],
        ["#002245", 700],
        ["#C1B694", 250],
        ["#59A8BD", 50],
      ),
    );
    expect(f.map((c) => c.hex)).toEqual(["#002245", "#C1B694", "#59A8BD"]);
    expect(f[0].share).toBeCloseTo(0.7, 2);
    expect(f.every((c) => !c.neutral)).toBe(true);
  });

  it("hopper over gjennomsiktige piksler og kantstøy", () => {
    const f = extractColors(
      piksler(
        ["#000000", 9000, 0],
        ["#7E1961", 900],
        // Glattede kanter: mange ulike mellomfarger i små mengder.
        ["#A0558A", 5],
        ["#C38FB4", 5],
        ["#E0C5D8", 5],
        ["#7E1961", 10, 60],
      ),
    );
    expect(f.map((c) => c.hex)).toEqual(["#7E1961"]);
  });

  it("tar ikke med blandingsfarger fra glattede kanter mot bakgrunnen", () => {
    // Fra en ekte logo i nettleseren: beige og teal på hvitt, nedskalert.
    const f = extractColors(
      piksler(
        ["#FFFFFF", 4000],
        ["#002245", 600],
        ["#C1B694", 170],
        ["#59A8BD", 120],
        ["#E9E5D9", 40],
        ["#79B9CA", 30],
        ["#D7D0BA", 20],
      ),
    );
    expect(f.map((c) => c.hex)).toEqual(["#002245", "#C1B694", "#59A8BD"]);
  });

  it("beholder en ekte mellomfarge med tyngde i logoen", () => {
    const f = extractColors(
      piksler(["#000000", 400], ["#FFFFFF", 400], ["#808080", 300]),
    );
    expect(f.map((c) => c.hex)).toContain("#808080");
  });

  it("slår sammen nesten like farger og beholder den største", () => {
    const f = extractColors(piksler(["#C8AD78", 800], ["#CAAF7A", 200]));
    expect(f).toHaveLength(1);
    expect(f[0].hex).toBe("#C8AD78");
    expect(f[0].share).toBe(1);
  });

  it("merker svart og grått som nøytrale", () => {
    const f = extractColors(piksler(["#1A1A1A", 600], ["#E4007C", 400]));
    expect(f.find((c) => c.hex === "#1A1A1A")?.neutral).toBe(true);
    expect(f.find((c) => c.hex === "#E4007C")?.neutral).toBe(false);
  });

  it("gir ingenting for et helt hvitt eller gjennomsiktig bilde", () => {
    expect(extractColors(piksler(["#FFFFFF", 100]))).toEqual([]);
    expect(extractColors(piksler(["#FF0000", 100, 0]))).toEqual([]);
  });

  it("gir høyst `max` farger", () => {
    const f = extractColors(
      piksler(
        ["#E4007C", 100],
        ["#00843D", 100],
        ["#F2B705", 100],
        ["#0891B2", 100],
      ),
      2,
    );
    expect(f).toHaveLength(2);
  });
});

describe("suggestLogoColors", () => {
  it("foreslår de fargerike, og svart bare når logoen ikke har annet", () => {
    const f = extractColors(piksler(["#1A1A1A", 600], ["#E4007C", 400]));
    expect(suggestLogoColors(f)).toEqual(["#E4007C"]);
    const svart = extractColors(piksler(["#1A1A1A", 600]));
    expect(suggestLogoColors(svart)).toEqual(["#1A1A1A"]);
  });
});
