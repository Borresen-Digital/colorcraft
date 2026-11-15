import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { buildCardModel } from "./colorCard";
import {
  buildProfile,
  MAKER_PARAM,
  profilePath,
  readMaker,
  withMaker,
  withoutMaker,
} from "./profile";
import { decodeShare, encodeShare } from "./share";
import { generateFromBrand } from "./brand";
import type { ExtendedColorPalette } from "@/data/palettes";

function profilPalett(): ExtendedColorPalette {
  const brand = {
    logo: ["#002245"],
    support: ["#C1B694", "#9099A3"],
    highlight: ["#59A8BD"],
    internal: [],
    direction: "neutral" as const,
    names: { "#002245": "Dark blue", "#C1B694": "Varm rørfarge" },
    cmyk: { "#002245": "100 80 30 40" },
  };
  const r = generateFromBrand(brand);
  return {
    id: "custom-1",
    name: "Erling Olsen",
    description: "",
    colors: r.light,
    darkVariant: {
      id: "custom-1-dark",
      name: "Erling Olsen mørk",
      description: "",
      colors: r.dark,
    },
    brand,
  };
}

describe("profilsiden", () => {
  it("har stier på begge språk", () => {
    expect(profilePath("nb")).toBe("/profil");
    expect(profilePath("en")).toBe("/en/profil");
  });

  it("deler fargene i logo, flater og utheving, med navn og bruk", () => {
    const p = buildProfile(profilPalett(), "nb");
    expect(p.sections.map((s) => s.kind)).toEqual([
      "logo",
      "support",
      "highlight",
    ]);
    const [logo, flater, utheving] = p.sections;
    expect(logo.colors[0].label).toBe("Dark blue");
    expect(flater.colors.map((c) => c.label)).toEqual([
      "Varm rørfarge",
      "Flatefarge 2",
    ]);
    expect(utheving.usage).toMatch(/Ikke som flate/);
    expect(p.sections.every((s) => s.usage.length > 0)).toBe(true);
  });

  it("bruker CMYK fra manualen, og tinter fra de samme tallene", () => {
    const [logo] = buildProfile(profilPalett(), "nb").sections;
    const navy = logo.colors[0];
    expect(navy.cmykFromManual).toBe(true);
    expect(navy.cmyk).toContain("100 80 30 40");
    expect(navy.profileTints.map((t) => t.percent)).toEqual([80, 60, 40, 20]);
    expect(navy.profileTints[0].cmykText).toBe("80 64 24 32");
    expect(navy.text).toBe("#FFFFFF");
  });

  it("viser hovedfargene for en palett uten profil", () => {
    const p = buildProfile(colorPalettes[0], "en");
    expect(p.sections).toHaveLength(1);
    expect(p.sections[0].kind).toBe("main");
    expect(p.sections[0].colors).toHaveLength(6);
    expect(p.sections[0].colors[0].profileTints).toEqual([]);
  });

  it("har de samme kontrastparene som fargekortet", () => {
    const pal = profilPalett();
    const kort = buildCardModel(pal, "nb", "", new Date(0));
    expect(buildProfile(pal, "nb").contrast).toEqual(kort.contrast);
  });
});

describe("«Laget av» i lenken", () => {
  it("legges til, leses og fjernes uten å endre paletten", () => {
    const pal = profilPalett();
    const hash = encodeShare(pal, false);
    const med = withMaker(hash, "Honeybee  design");
    expect(med).toContain(`${MAKER_PARAM}=Honeybee%20design`);
    expect(readMaker(med)).toBe("Honeybee design");
    expect(withoutMaker(med)).toBe(hash);

    const a = decodeShare(hash);
    const b = decodeShare(med);
    expect(a?.kind).toBe("custom");
    expect(b?.kind === "custom" && a?.kind === "custom" && b.palette.id).toBe(
      a?.kind === "custom" && a.palette.id,
    );
  });

  it("renser kontrolltegn og korter ned", () => {
    expect(readMaker(`#mk=${encodeURIComponent("a\u0007b")}`)).toBe("a b");
    expect(readMaker(`mk=${"x".repeat(100)}`)).toHaveLength(60);
    expect(readMaker("p=havet")).toBe("");
  });
});
