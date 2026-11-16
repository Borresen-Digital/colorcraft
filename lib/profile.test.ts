import { describe, expect, it } from "vitest";
import { colorPalettes } from "@/data/palettes";
import { buildCardModel } from "./colorCard";
import {
  buildProfile,
  isReadonlyLink,
  cleanRule,
  MAKER_PARAM,
  MAX_RULE,
  profilePath,
  readMaker,
  readRules,
  RULE_PARAMS,
  ruleLines,
  withMaker,
  withoutMaker,
  withoutRules,
  withRule,
  withReadonly,
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

describe("bruksregler", () => {
  it("legges i lenken uten å endre paletten", () => {
    const hash = withMaker("p=havet", "Testdesign");
    const med = withRule(
      withRule(hash, "logo", "Alltid på hvit\n- Aldri på bilder"),
      "general",
      "Minst 20 mm bred",
    );
    expect(readRules(med)).toEqual({
      logo: "Alltid på hvit\n- Aldri på bilder",
      general: "Minst 20 mm bred",
    });
    expect(decodeShare(med)).toEqual(decodeShare(hash));
    expect(readMaker(med)).toBe("Testdesign");
    expect(withoutRules(med)).toBe(hash);
    expect(withRule(med, "logo", "  ")).not.toContain(RULE_PARAMS.logo + "=");
  });

  it("ingen parameter starter med b, så palettens id står fast", () => {
    for (const p of Object.values(RULE_PARAMS)) expect(p[0]).not.toBe("b");
  });

  it("renser teksten og beholder linjeskift", () => {
    expect(cleanRule("  a\u0007b \r\n\r\n\r\n\r\n c  ")).toBe("a b\n\nc");
    expect(cleanRule("x".repeat(MAX_RULE + 50))).toHaveLength(MAX_RULE);
    expect(cleanRule(null)).toBe("");
  });

  it("deler regler i linjer uten punkttegn", () => {
    expect(ruleLines("- en\n\n• to\n* tre\nfire")).toEqual([
      "en",
      "to",
      "tre",
      "fire",
    ]);
  });
});

describe("kundens visning (ro=1)", () => {
  it("setter og fjerner merket uten å røre resten", () => {
    const h = withReadonly("p=havet&mk=Testdesign", true);
    expect(isReadonlyLink(h)).toBe(true);
    expect(readMaker(h)).toBe("Testdesign");
    const tilbake = withReadonly(h, false);
    expect(isReadonlyLink(tilbake)).toBe(false);
    expect(tilbake).toBe("p=havet&mk=Testdesign");
  });

  it("godtar bare ro=1", () => {
    expect(isReadonlyLink("p=havet")).toBe(false);
    expect(isReadonlyLink("p=havet&ro=0")).toBe(false);
    expect(isReadonlyLink("#p=havet&ro=1")).toBe(true);
  });
});
