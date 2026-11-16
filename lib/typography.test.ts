import { describe, expect, it } from "vitest";
import {
  cleanFont,
  cleanWeight,
  decodeType,
  encodeType,
  fontStack,
  MAX_TYPES,
  readTypography,
  TYPE_PARAMS,
  withoutTypography,
  withTypography,
  type TypeSpec,
} from "./typography";
import { decodeShare } from "./share";
import { readMaker, withMaker } from "./profile";

const OVERSKRIFT: TypeSpec = {
  role: "Overskrifter",
  font: "Montserrat",
  weight: 700,
  size: "32–48 pt",
  fallback: "Arial",
  note: "Bare i titler",
};

describe("typografi i lenken", () => {
  it("går fram og tilbake uten å endre paletten", () => {
    const hash = withMaker("p=havet", "Testdesign");
    const brød = {
      ...OVERSKRIFT,
      role: "Brødtekst",
      font: "Source Sans 3",
      weight: 400,
      size: "",
      note: "",
    };
    const med = withTypography(hash, [OVERSKRIFT, brød]);
    expect(readTypography(med)).toEqual([OVERSKRIFT, brød]);
    expect(decodeShare(med)).toEqual(decodeShare(hash));
    expect(readMaker(med)).toBe("Testdesign");
    expect(withoutTypography(med)).toBe(hash);
  });

  it("hopper over fonter uten navn og lager ikke hull", () => {
    const med = withTypography("p=havet", [
      { ...OVERSKRIFT, font: "" },
      OVERSKRIFT,
    ]);
    expect(med).toContain("ty1=");
    expect(med).not.toContain("ty2=");
  });

  it("tar høyst fire fonter", () => {
    const med = withTypography("", Array(MAX_TYPES + 2).fill(OVERSKRIFT));
    expect(readTypography(med)).toHaveLength(MAX_TYPES);
  });

  it("ingen parameter starter med b", () => {
    for (const p of TYPE_PARAMS) expect(p[0]).not.toBe("b");
  });

  it("renser fontnavn så de er trygge i CSS", () => {
    expect(cleanFont('Evil"; } body { color: red')).toBe("Evil body color red");
    expect(cleanFont("Source Sans 3")).toBe("Source Sans 3");
    expect(cleanFont("Brødtekst-Grotesk_2.0")).toBe("Brødtekst-Grotesk_2.0");
    expect(fontStack({ font: "Montserrat", fallback: "Arial" })).toBe(
      '"Montserrat", "Arial", sans-serif',
    );
    expect(fontStack({ font: "Inter", fallback: "" })).toBe(
      '"Inter", sans-serif',
    );
  });

  it("velger generisk familie etter reservefonten", () => {
    expect(fontStack({ font: "Playfair Display", fallback: "Georgia" })).toBe(
      '"Playfair Display", "Georgia", serif',
    );
    expect(fontStack({ font: "Lora", fallback: "" })).toBe('"Lora", serif');
    expect(fontStack({ font: "PT Serif", fallback: "Arial" })).toBe(
      '"PT Serif", "Arial", sans-serif',
    );
    expect(fontStack({ font: "Fira Code", fallback: "" })).toBe(
      '"Fira Code", monospace',
    );
    expect(fontStack({ font: "Noto Sans", fallback: "serif" })).toBe(
      '"Noto Sans", serif',
    );
  });

  it("tar | ut av teksten og runder vekten", () => {
    const t = decodeType(encodeType({ ...OVERSKRIFT, note: "a|b" }));
    expect(t?.note).toBe("a b");
    expect(cleanWeight(650)).toBe(600);
    expect(cleanWeight("x")).toBe(400);
    expect(cleanWeight(2000)).toBe(900);
  });

  it("tåler ødelagte verdier", () => {
    expect(decodeType(null)).toBeNull();
    expect(decodeType("Bare rolle")).toBeNull();
    expect(decodeType("|Inter")?.weight).toBe(400);
  });
});
