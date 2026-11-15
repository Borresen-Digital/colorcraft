import { describe, expect, it } from "vitest";
import {
  difference,
  filterMatrix,
  similarPairs,
  simulate,
  SIMILAR,
  VISIONS,
} from "./colorblind";

describe("fargeblindsimulering", () => {
  it("lar hvitt, svart og grått stå", () => {
    for (const v of VISIONS) {
      for (const hex of ["#FFFFFF", "#000000", "#808080"]) {
        expect(difference(simulate(hex, v), hex)).toBeLessThan(0.01);
      }
    }
  });

  it("gjør rødt og grønt like for rød-grønn fargeblindhet", () => {
    const rød = "#D62828";
    const grønn = "#2E9E3B";
    const normal = difference(rød, grønn);
    const med = (v: (typeof VISIONS)[number]) =>
      difference(simulate(rød, v), simulate(grønn, v));
    expect(normal).toBeGreaterThan(0.2);
    // Deuteranopi: nesten like. Protanopi: rødt blir mørkere, men nærmere.
    expect(med("deuteranopia")).toBeLessThan(SIMILAR);
    expect(med("protanopia")).toBeLessThan(normal * 0.75);
    // Tritanopi (blå-gul) skiller rødt og grønt fint.
    expect(med("tritanopia")).toBeGreaterThan(normal * 0.75);
  });

  it("akromatopsi gir grått", () => {
    const s = simulate("#1A237E", "achromatopsia");
    expect(s.slice(1, 3)).toBe(s.slice(3, 5));
    expect(s.slice(3, 5)).toBe(s.slice(5, 7));
  });

  it("finner par som blir for like, og hopper over par som alt er like", () => {
    // Samme lyshet: rød og grønn smelter sammen for deuteranopi.
    const farger = [
      { label: "Rød", hex: "#C0504D" },
      { label: "Grønn", hex: "#7A8A3A" },
      { label: "Navy", hex: "#002245" },
      { label: "Nesten navy", hex: "#022446" },
    ];
    const par = similarPairs(farger, "deuteranopia");
    expect(par.map((p) => `${p.a.label}/${p.b.label}`)).toContain("Rød/Grønn");
    expect(par.every((p) => p.distance < SIMILAR)).toBe(true);
    expect(
      par.some((p) => p.a.label === "Navy" && p.b.label === "Nesten navy"),
    ).toBe(false);
  });

  it("filteret har 20 tall", () => {
    for (const v of VISIONS) {
      const tall = filterMatrix(v).split(" ").map(Number);
      expect(tall).toHaveLength(20);
      expect(tall.every(Number.isFinite)).toBe(true);
    }
  });
});
