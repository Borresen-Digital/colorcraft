import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { applyOverrides, builtinOverrides, isModifiedBuiltin } from "./builtin";
import { localizePalette } from "./i18n";
import { encodeShare } from "./share";

const ula = colorPalettes.find((p) => p.id === "ula")!;
const endret = {
  ...ula,
  colors: { ...ula.colors, muted: "#916A37" },
};

describe("isModifiedBuiltin", () => {
  it("er false for urørte og egne paletter", () => {
    expect(colorPalettes.some(isModifiedBuiltin)).toBe(false);
    expect(isModifiedBuiltin({ ...ula, id: "custom-1" })).toBe(false);
  });

  it("ser endret farge, navn og mørk variant, men ikke store/små bokstaver", () => {
    expect(isModifiedBuiltin(endret)).toBe(true);
    expect(isModifiedBuiltin({ ...ula, name: "Ula 2" })).toBe(true);
    expect(isModifiedBuiltin({ ...ula, darkVariant: undefined })).toBe(true);
    expect(
      isModifiedBuiltin({
        ...ula,
        colors: { ...ula.colors, primary: ula.colors.primary.toLowerCase() },
      }),
    ).toBe(false);
  });
});

describe("lagring og lesing", () => {
  it("lagrer bare endrede innebygde paletter", () => {
    const liste = colorPalettes.map((p) => (p.id === "ula" ? endret : p));
    const o = builtinOverrides([...liste, { ...ula, id: "custom-9" }]);
    expect(Object.keys(o)).toEqual(["ula"]);
  });

  it("går rundt via JSON, og resten er urørt", () => {
    const lest = applyOverrides(
      JSON.parse(JSON.stringify(builtinOverrides([endret]))),
    );
    expect(lest).toHaveLength(colorPalettes.length);
    expect(lest.find((p) => p.id === "ula")!.colors.muted).toBe("#916A37");
    expect(lest.find((p) => p.id === "havet")).toBe(colorPalettes[0]);
  });

  it("hopper over ødelagt innhold fra nettleseren", () => {
    for (const søppel of [
      null,
      "tekst",
      42,
      { ula: { id: "ula" } },
      { ula: { ...ula, colors: { ...ula.colors, muted: "rød" } } },
      { ula: { ...ula, id: "havet" } },
      { finnesikke: ula },
    ]) {
      expect(applyOverrides(søppel)).toEqual(colorPalettes);
    }
  });

  it("dropper en ugyldig mørk variant, men beholder den lyse", () => {
    const lest = applyOverrides({
      ula: { ...endret, darkVariant: { id: "feil" } },
    });
    const u = lest.find((p) => p.id === "ula")!;
    expect(u.colors.muted).toBe("#916A37");
    expect(u.darkVariant).toBeUndefined();
  });
});

describe("samspill", () => {
  it("en endret innebygd palett deles med fargene, ikke id-en", () => {
    expect(encodeShare(endret, false)).toContain("l=");
    expect(encodeShare(ula, false)).toBe("p=ula");
  });

  it("oversettelsen lar egen tekst i en innebygd palett stå", () => {
    const egenTekst = { ...ula, description: "Min variant" };
    expect(localizePalette(egenTekst, "en").description).toBe("Min variant");
    expect(localizePalette(ula, "en").description).not.toBe(ula.description);
  });
});
