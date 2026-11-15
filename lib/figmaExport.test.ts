import { describe, expect, it } from "vitest";
import { colorToken, toFigmaTokens, tokenName } from "./figmaExport";
import { toneScale } from "./toneScale";

const NAMES = {
  colors: "Farger",
  tones: "Tonetrapp",
  typography: "Typografi",
  font: "Font",
  fallback: "Reservefont",
  weight: "Vekt",
  size: "Størrelse",
  note: "Merknad",
};

function bygg() {
  return JSON.parse(
    toFigmaTokens({
      groups: [
        {
          heading: "Logofarger",
          colors: [
            {
              label: "Dark blue",
              hex: "#002245",
              description: "CMYK 100 80 30 40",
            },
          ],
        },
        {
          heading: "Flatefarger",
          colors: [
            { label: "Rørfarge", hex: "#C1B694" },
            { label: "Rørfarge", hex: "#9099A3" },
          ],
        },
        { heading: "Tom", colors: [] },
      ],
      tones: [{ label: "Dark blue", scale: toneScale("#002245") }],
      typography: [
        {
          role: "Overskrifter",
          font: "Montserrat",
          weight: 700,
          size: "32–48 pt",
          fallback: "Arial",
          note: "",
        },
        {
          role: "Uten font",
          font: "",
          weight: 400,
          size: "",
          fallback: "",
          note: "",
        },
      ],
      names: NAMES,
    }),
  );
}

describe("Figma-eksport", () => {
  it("lager farger i formatet Figma importerer", () => {
    expect(colorToken("#e32828")).toEqual({
      $type: "color",
      $value: {
        colorSpace: "srgb",
        components: [0.8902, 0.1569, 0.1569],
        alpha: 1,
        hex: "#E32828",
      },
    });
    const j = bygg();
    expect(Object.keys(j)).toEqual(["Farger", "Tonetrapp", "Typografi"]);
    expect(j.Farger.Logofarger["Dark blue"].$value.hex).toBe("#002245");
    expect(j.Farger.Logofarger["Dark blue"].$description).toBe(
      "CMYK 100 80 30 40",
    );
  });

  it("gir like navn et tall i stedet for å miste et token", () => {
    const j = bygg();
    expect(Object.keys(j.Farger.Flatefarger)).toEqual([
      "Rørfarge",
      "Rørfarge 2",
    ]);
    expect(j.Farger.Tom).toBeUndefined();
  });

  it("tar med tonetrappen og typografien", () => {
    const j = bygg();
    expect(Object.keys(j.Tonetrapp["Dark blue"])).toHaveLength(11);
    expect(j.Tonetrapp["Dark blue"]["950"].$value.hex).toBe("#002245");
    expect(j.Typografi.Overskrifter).toEqual({
      Font: { $type: "fontFamily", $value: "Montserrat" },
      Vekt: { $type: "number", $value: 700 },
      Reservefont: { $type: "fontFamily", $value: "Arial" },
      Størrelse: { $type: "string", $value: "32–48 pt" },
    });
    expect(j.Typografi["Uten font"]).toBeUndefined();
  });

  it("renser navn så de ikke lager nye mapper eller referanser", () => {
    expect(tokenName("Blå/grønn.v2 {x}")).toBe("Blå grønn v2 x");
    expect(tokenName("$type")).toBe("type");
    expect(tokenName("  ", "#002245")).toBe("#002245");
  });
});
