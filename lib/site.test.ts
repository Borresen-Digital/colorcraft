import { describe, expect, it } from "vitest";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { generateFromBrand } from "./brand";
import { editPalette, sitePath, withPalette } from "./site";

const r = generateFromBrand({ logo: ["#1F4D3A"], support: ["#F3EBDD"] });
const MERKE: ExtendedColorPalette = {
  id: "custom-1",
  name: "Fjordbakeriet",
  description: "",
  colors: r.light,
  darkVariant: {
    id: "custom-1-dark",
    name: "",
    description: "",
    colors: r.dark,
  },
  brand: {
    logo: ["#1F4D3A"],
    support: ["#F3EBDD"],
    names: { "#1F4D3A": "Fjordgrønn" },
    cmyk: { "#1F4D3A": "85 40 75 40" },
  },
};

describe("nettsidevisningen", () => {
  it("har sti på begge språk", () => {
    expect(sitePath("nb")).toBe("/nettside");
    expect(sitePath("en")).toBe("/en/nettside");
  });

  it("regner paletten på nytt når en merkefarge byttes", () => {
    const ny = editPalette(MERKE, {
      kind: "brand",
      list: "logo",
      index: 0,
      hex: "#8b1e3f",
    });
    expect(ny.brand?.logo).toEqual(["#8B1E3F"]);
    expect(ny.colors.primary).toBe("#8B1E3F");
    expect(ny.darkVariant?.colors).not.toEqual(MERKE.darkVariant?.colors);
    // Navnet følger fargen. CMYK fra manualen gjelder ikke lenger.
    expect(ny.brand?.names).toEqual({ "#8B1E3F": "Fjordgrønn" });
    expect(ny.brand?.cmyk).toEqual({});
    expect(ny.id).toBe(MERKE.id);
  });

  it("bytter bare rollen i en palett uten manual", () => {
    const havet = colorPalettes.find((p) => p.id === "havet")!;
    const ny = editPalette(havet, {
      kind: "role",
      role: "accent",
      hex: "#ff00aa",
    });
    expect(ny.colors.accent).toBe("#FF00AA");
    expect(ny.colors.primary).toBe(havet.colors.primary);
    expect(havet.colors.accent).not.toBe("#FF00AA");
  });

  it("bytter i mørk variant når den vises", () => {
    const havet = colorPalettes.find((p) => p.id === "havet")!;
    const ny = editPalette(
      havet,
      { kind: "role", role: "background", hex: "#000000" },
      true,
    );
    expect(ny.darkVariant?.colors.background).toBe("#000000");
    expect(ny.colors.background).toBe(havet.colors.background);
  });

  it("lar paletten være ved ugyldig farge eller indeks", () => {
    expect(
      editPalette(MERKE, { kind: "brand", list: "logo", index: 0, hex: "x" }),
    ).toBe(MERKE);
    expect(
      editPalette(MERKE, {
        kind: "brand",
        list: "highlight",
        index: 0,
        hex: "#000000",
      }),
    ).toBe(MERKE);
  });
});

describe("withPalette", () => {
  it("bytter paletten og beholder resten av fragmentet", () => {
    const h = withPalette(
      "p=havet&mk=Anne%20Design&ty1=x",
      "v=1&n=Ny&l=abc&bl=ff0000",
    );
    const q = new URLSearchParams(h);
    expect(q.get("p")).toBeNull();
    expect(q.get("n")).toBe("Ny");
    expect(q.get("bl")).toBe("ff0000");
    expect(q.get("mk")).toBe("Anne Design");
    expect(q.get("ty1")).toBe("x");
    expect(h).not.toContain("+");
  });
});
