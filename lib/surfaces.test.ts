import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { generateFromBrand } from "./brand";
import { contrastRatio } from "./contrast";
import { LOGO_MIN, surfacesFor } from "./surfaces";

const brand = { logo: ["#F2B705"], support: ["#F5EFE0", "#2B2B2B"] };
const r = generateFromBrand(brand);
const pal = { id: "x", name: "x", description: "", colors: r.light };

describe("surfacesFor", () => {
  it("bruker støttefargene fra profilmanualen, og logofargen sist", () => {
    const f = surfacesFor(pal, brand);
    expect(f.map((s) => s.color)).toEqual(["#F5EFE0", "#2B2B2B", "#F2B705"]);
    expect(f.map((s) => s.kind)).toEqual(["support", "support", "logo"]);
    expect(f.map((s) => s.index)).toEqual([1, 2, 0]);
  });

  it("bruker secondary og surface for paletter uten profilmanual", () => {
    const havet = colorPalettes[0];
    const f = surfacesFor(havet);
    expect(f.map((s) => s.color)).toEqual([
      havet.colors.secondary,
      havet.colors.surface,
      havet.colors.primary,
    ]);
  });

  it("navngir flatene etter rollen når paletten ikke er fra en manual", () => {
    expect(
      surfacesFor(colorPalettes[0])
        .filter((s) => s.kind === "support")
        .map((s) => s.role),
    ).toEqual(["secondary", "surface"]);
    expect(surfacesFor(pal, brand).every((s) => s.role === undefined)).toBe(
      true,
    );
  });

  it("dropper like farger", () => {
    const f = surfacesFor(pal, {
      logo: ["#F2B705"],
      support: ["#ffffff", "#FFFFFF"],
    });
    expect(f.filter((s) => s.kind === "support")).toHaveLength(1);
  });

  it("velger tekstfargen med best kontrast, og regner ut forholdet", () => {
    for (const s of surfacesFor(pal, brand)) {
      expect(s.textRatio).toBeCloseTo(contrastRatio(s.text, s.color)!, 6);
      for (const alt of [
        pal.colors.foreground,
        pal.colors.background,
        "#FFFFFF",
      ]) {
        expect(s.textRatio).toBeGreaterThanOrEqual(
          contrastRatio(alt, s.color)! - 1e-9,
        );
      }
    }
  });

  it("vurderer logoen mot 3:1, og viser den i negativ på logofargen", () => {
    const [lys, mork, logo] = surfacesFor(pal, brand);
    // Gul logo på beige synes ikke, på mørk grå gjør den det.
    expect(lys.logoOk).toBe(false);
    expect(mork.logoOk).toBe(true);
    expect(mork.logoRatio).toBeGreaterThanOrEqual(LOGO_MIN);
    expect(logo.logoInverted).toBe(true);
    expect(logo.logo).not.toBe(pal.colors.primary);
    expect(logo.logoOk).toBe(true);
  });
});
