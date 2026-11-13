import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { generateFromBrand } from "./brand";
import { inUseColors } from "./inUse";

const pal = (b: Parameters<typeof generateFromBrand>[0], mørk = false) => {
  const r = generateFromBrand(b);
  return {
    id: "x",
    name: "x",
    description: "",
    colors: mørk ? r.dark : r.light,
  };
};

// Mariannes testpalett for Erling Olsen og Honeybeedesign (12.11.2026).
const ERLING = {
  logo: ["#002245"],
  support: ["#C1B694", "#9099A3", "#59A8BD"],
};
const HONEYBEE = {
  logo: ["#C8AD78"],
  support: ["#EFE6CA"],
  highlight: ["#7E1961"],
};

describe("inUseColors", () => {
  it("gjenskaper Erling Olsen-annonsen: navy flate, beige stripe og knapp med navy tekst", () => {
    const c = inUseColors(pal(ERLING), ERLING);
    expect(c.hero).toBe("#002245");
    expect(c.heroText).toBe("#FFFFFF");
    expect(c.band).toBe("#C1B694");
    expect(c.bandText).toBe("#002245");
    expect(c.button).toBe("#C1B694");
    expect(c.buttonText).toBe("#002245");
    expect(c.checks.every((s) => s.ok)).toBe(true);
  });

  it("er lik i lys og mørk modus, siden trykk ikke har mørk modus", () => {
    const lys = inUseColors(pal(ERLING), ERLING);
    const mørk = inUseColors(pal(ERLING, true), ERLING);
    expect(mørk).toEqual(lys);
  });

  it("bruker highlight på stripe og knapp, aldri som hovedflate", () => {
    const c = inUseColors(pal(HONEYBEE), HONEYBEE);
    expect(c.hero).toBe("#C8AD78");
    expect(c.band).toBe("#7E1961");
    expect(c.button).toBe("#7E1961");
    expect(c.paper).toBe("#EFE6CA");
  });

  it("sier fra når logoen ikke synes på papiret", () => {
    const c = inUseColors(pal(HONEYBEE), HONEYBEE);
    const logo = c.checks.find((s) => s.id === "logoPaper")!;
    expect(logo.ok).toBe(false);
    expect(logo.min).toBe(3);
  });

  it("knappen skiller seg alltid fra hovedflaten", () => {
    for (const p of colorPalettes) {
      const c = inUseColors(p);
      expect(c.button.toUpperCase(), p.id).not.toBe(c.hero.toUpperCase());
      expect(c.band.toUpperCase(), p.id).not.toBe(c.hero.toUpperCase());
    }
  });

  it("vanlige paletter bruker primær som hovedflate når logoen synes på den", () => {
    const c = inUseColors(colorPalettes[0]);
    expect(c.hero).toBe(colorPalettes[0].colors.primary);
    expect(c.paper).toBe(colorPalettes[0].colors.background);
  });
});
