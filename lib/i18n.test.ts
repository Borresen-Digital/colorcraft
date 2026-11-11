import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { CONTRAST_PAIRS } from "./contrastPairs";
import { toCss } from "./export";
import {
  isLocale,
  localePath,
  localizePalette,
  localizeRatio,
  MESSAGES,
} from "./i18n";
import { decodeShare } from "./share";

describe("ruter", () => {
  it("norsk ligger på /, engelsk på /en", () => {
    expect(localePath("nb")).toBe("/");
    expect(localePath("en")).toBe("/en");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });
});

describe("localizePalette", () => {
  it("lar norsk stå som det er", () => {
    const p = colorPalettes[0];
    expect(localizePalette(p, "nb")).toBe(p);
  });

  it("gir alle innebygde paletter engelsk beskrivelse og mørkt navn", () => {
    for (const p of colorPalettes) {
      const en = localizePalette(p, "en");
      expect(en.name).toBe(p.name);
      expect(en.description).not.toBe(p.description);
      expect(en.darkVariant?.name).toBe(`${p.name} dark`);
      expect(en.darkVariant?.description).toMatch(/\(dark mode\)$/);
      // Fargene røres ikke.
      expect(en.colors).toEqual(p.colors);
    }
  });

  it("lar egne paletter være", () => {
    const egen = { ...colorPalettes[0], id: "custom-1", description: "Min" };
    expect(localizePalette(egen, "en").description).toBe("Min");
  });
});

describe("tekster", () => {
  it("har en etikett for hvert kontrastpar på begge språk", () => {
    for (const pair of CONTRAST_PAIRS) {
      expect(MESSAGES.nb.contrast.pairs[pair.id]).toBeTruthy();
      expect(MESSAGES.en.contrast.pairs[pair.id]).toBeTruthy();
    }
  });

  it("bruker komma som desimaltegn på norsk", () => {
    expect(localizeRatio("4.54:1", "nb")).toBe("4,54:1");
    expect(localizeRatio("4.54:1", "en")).toBe("4.54:1");
  });

  it("skriver eksporten på sidens språk", () => {
    expect(toCss(colorPalettes[0], "nb")).toContain("laget med ColorCraft");
    expect(toCss(colorPalettes[0], "en")).toContain("made with ColorCraft");
  });

  it("gir delte paletter navn på sidens språk", () => {
    const hash = `#l=${"a".repeat(84)}&d=${"b".repeat(84)}`;
    const nb = decodeShare(hash, MESSAGES.nb.palette)!;
    const en = decodeShare(hash, MESSAGES.en.palette)!;
    expect(nb.kind === "custom" && nb.palette.name).toBe("Delt palett");
    expect(nb.kind === "custom" && nb.palette.darkVariant?.name).toBe(
      "Delt palett mørk",
    );
    expect(en.kind === "custom" && en.palette.name).toBe("Shared palette");
    // Samme lenke gir samme id på begge språk.
    expect(nb.kind === "custom" && en.kind === "custom" && nb.palette.id).toBe(
      en.kind === "custom" && en.palette.id,
    );
  });
});
