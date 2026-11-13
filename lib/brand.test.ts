import { describe, expect, it } from "vitest";
import {
  DIRECTIONS,
  ensureContrast,
  generateFromBrand,
  mix,
  normalizeHex,
} from "./brand";
import { contrastRatio } from "./contrast";
import { checkPalette } from "./contrastPairs";
import { hexToOklch, hueDistance, variants } from "./tones";

const pal = (colors: ReturnType<typeof generateFromBrand>["light"]) => ({
  id: "x",
  name: "x",
  description: "",
  colors,
});

// Typiske merker: mørk logo, lys logo, mettet logo, og en med flere farger.
const MERKER = [
  {
    navn: "honeybee-aktig",
    logo: ["#F2B705"],
    support: ["#2B2B2B", "#F5EFE0"],
  },
  { navn: "mørk blå", logo: ["#0B2545"], support: ["#EEF4ED", "#8DA9C4"] },
  { navn: "lys gul", logo: ["#FFE45C"], support: [] },
  { navn: "rød og grønn", logo: ["#C8102E", "#00843D"], support: ["#F4F1EA"] },
  { navn: "grå logo", logo: ["#777777"], support: ["#DDDDDD"] },
];

describe("normalizeHex og mix", () => {
  it("normaliserer og avviser", () => {
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("123456")).toBe("#123456");
    expect(normalizeHex("blå")).toBeNull();
  });
  it("blander i sRGB", () => {
    expect(mix("#000000", "#FFFFFF", 0)).toBe("#000000");
    expect(mix("#000000", "#FFFFFF", 1)).toBe("#FFFFFF");
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe("ensureContrast", () => {
  it("når målet mot alle flatene", () => {
    const c = ensureContrast("#999999", ["#FFFFFF", "#F3F3F3"], 4.5)!;
    expect(contrastRatio(c, "#FFFFFF")!).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c, "#F3F3F3")!).toBeGreaterThanOrEqual(4.5);
  });
  it("gir null når det er umulig", () => {
    expect(ensureContrast("#777777", ["#777777"], 7)).toBeNull();
  });
});

describe("generateFromBrand", () => {
  it("krever minst én gyldig logofarge", () => {
    expect(() => generateFromBrand({ logo: [], support: [] })).toThrow();
    expect(() => generateFromBrand({ logo: ["tull"], support: [] })).toThrow();
  });

  for (const m of MERKER) {
    describe(m.navn, () => {
      const r = generateFromBrand(m);

      it("beholder logofargen og første støttefarge i lys modus", () => {
        expect(r.light.primary).toBe(normalizeHex(m.logo[0]));
        if (m.logo[1]) expect(r.light.accent).toBe(normalizeHex(m.logo[1]));
        if (m.support[0])
          expect(r.light.secondary).toBe(normalizeHex(m.support[0]));
      });

      it("har tekst og muted som består AA på begge flater, i begge moduser", () => {
        for (const c of [r.light, r.dark]) {
          for (const flate of [c.background, c.surface]) {
            expect(contrastRatio(c.foreground, flate)!).toBeGreaterThanOrEqual(
              4.5,
            );
            expect(contrastRatio(c.muted, flate)!).toBeGreaterThanOrEqual(4.5);
          }
        }
      });

      it("lar knappetekst bestå AA (hvit eller mørk, som i forhåndsvisningen)", () => {
        for (const c of [r.light, r.dark]) {
          const knapper = checkPalette(pal(c)).filter((x) =>
            x.pair.id.startsWith("button-"),
          );
          // Knappeteksten er hvit eller palettens mørke farge, den beste.
          // Med en mellomgrå merkefarge kan ingen av dem nå 4,5, og da er det
          // riktig at sjekken sier fra. Alt annet skal bestå.
          for (const k of knapper) {
            if (m.navn === "grå logo") continue;
            expect(k.ratio!).toBeGreaterThanOrEqual(4.5);
          }
        }
      });

      it("gjør merkefargene synlige i mørk modus (3:1), og forteller når den justerer", () => {
        for (const f of [r.dark.background, r.dark.surface]) {
          expect(contrastRatio(r.dark.primary, f)!).toBeGreaterThanOrEqual(3);
        }
        if (r.dark.primary !== r.light.primary) {
          expect(
            r.notes.some(
              (n) =>
                (n.kind === "adjusted-dark" || n.kind === "logo-background") &&
                n.role === "primary",
            ),
          ).toBe(true);
        }
      });

      it("gir statusfarger som synes mot bakgrunnen", () => {
        for (const c of [r.light, r.dark]) {
          for (const s of [c.success, c.warning, c.error, c.info]) {
            expect(contrastRatio(s, c.background)!).toBeGreaterThanOrEqual(3);
          }
        }
      });
    });
  }

  it("sier fra når logofargen er for lys til tekst på lys bakgrunn", () => {
    const r = generateFromBrand({ logo: ["#FFE45C"], support: [] });
    expect(r.notes.some((n) => n.kind === "low-contrast-light")).toBe(true);
  });

  it("bruker en lys støttefarge som bakgrunn", () => {
    const r = generateFromBrand({ logo: ["#0B2545"], support: ["#EEF4ED"] });
    expect(r.light.background).toBe("#EEF4ED");
  });
});

describe("støttefarger og aksent", () => {
  it("bruker en mørk støttefarge som bakgrunn i mørk modus", () => {
    const r = generateFromBrand({
      logo: ["#F2B705"],
      support: ["#F5EFE0", "#2B2B2B"],
    });
    expect(r.dark.background).toBe("#2B2B2B");
    expect(r.light.background).toBe("#F5EFE0");
  });

  it("gir en avledet aksent med mer kontrast mot lys bakgrunn, ikke mindre", () => {
    const r = generateFromBrand({ logo: ["#F2B705"], support: [] });
    expect(contrastRatio(r.light.accent, r.light.background)!).toBeGreaterThan(
      contrastRatio(r.light.primary, r.light.background)!,
    );
  });
});

describe("bredde: 7 logoer × 5 sett støttefarger", () => {
  const stotte = [
    ["#F5EFE0", "#2B2B2B"],
    ["#EEF4ED", "#8DA9C4"],
    [],
    ["#F4F1EA"],
    ["#FFF0F7", "#1A1A2E"],
  ];
  const logoer = [
    ["#F2B705"],
    ["#0B2545"],
    ["#FFE45C"],
    ["#C8102E", "#00843D"],
    ["#E4007C"],
    ["#2E7D32"],
  ];
  it("stryker bare der logofargen selv er for lys til tekst, og da med en merknad", () => {
    for (const logo of logoer) {
      for (const support of stotte) {
        const r = generateFromBrand({ logo, support });
        for (const [modus, c] of [
          ["lys", r.light],
          ["mørk", r.dark],
        ] as const) {
          const stryk = checkPalette(pal(c)).filter((x) => x.level === "fail");
          for (const s of stryk) {
            // Det eneste tillatte: logofargen som overskrift på lys bakgrunn,
            // og bare når brukeren har fått beskjed.
            expect(`${logo[0]} ${modus} ${s.pair.id}`).toBe(
              `${logo[0]} lys heading-background`,
            );
            expect(r.notes.some((n) => n.kind === "low-contrast-light")).toBe(
              true,
            );
          }
        }
      }
    }
  });
});

// Mariannes testpalett (Erling Olsen) og Honeybeedesign, 12.11.2026.
const ERLING = {
  logo: ["#002245"],
  support: ["#C1B694", "#9099A3", "#59A8BD"],
};
const HONEYBEE = {
  logo: ["#C8AD78"],
  support: ["#EFE6CA"],
  highlight: ["#7E1961"],
};

describe("ingen fremmede farger", () => {
  it("henter varm og kald fra merkefargene", () => {
    const r = generateFromBrand(ERLING);
    expect(r.light.warm).toBe("#C1B694");
    expect(r.light.cool).toBe("#59A8BD");
  });

  it("bruker logofargen som aksent når den synes", () => {
    const r = generateFromBrand(ERLING);
    expect(r.light.accent).toBe("#002245");
  });

  it("lager varm og kald av hovedfargen når ingen merkefarge passer", () => {
    const r = generateFromBrand({ logo: ["#C8AD78"], support: [] });
    const v = variants("#C8AD78")!;
    // Gull er selv varm, så den brukes. Kald finnes ikke, så den er en
    // kaldere variant av gullet, ikke en standard turkis.
    expect(r.light.warm).toBe("#C8AD78");
    expect(r.light.cool).toBe(v.cooler);
  });

  it("alle farger i varm, kald og aksent kommer fra merket (eller er avledet av det)", () => {
    const alle: { logo: string[]; support: string[]; highlight?: string[] }[] =
      [ERLING, HONEYBEE, ...MERKER];
    for (const m of alle) {
      const r = generateFromBrand(m);
      const egne = [...m.logo, ...m.support, ...(m.highlight ?? [])].map((c) =>
        normalizeHex(c)!,
      );
      const v = variants(normalizeHex(m.logo[0])!)!;
      for (const rolle of ["warm", "cool"] as const) {
        expect([...egne, v.warmer, v.cooler]).toContain(r.light[rolle]);
      }
    }
  });
});

describe("highlight", () => {
  it("blir aksenten og beholdes i lys modus", () => {
    const r = generateFromBrand(HONEYBEE);
    expect(r.light.accent).toBe("#7E1961");
    expect(r.light.primary).toBe("#C8AD78");
    expect(r.light.secondary).toBe("#EFE6CA");
  });

  it("gir ingen «for lys til tekst»-merknad for selve highlightfargen", () => {
    const r = generateFromBrand({
      logo: ["#002245"],
      support: [],
      highlight: ["#C1B694"],
    });
    expect(r.light.accent).toBe("#C1B694");
    expect(
      r.notes.some(
        (n) => n.kind === "low-contrast-light" && n.role === "accent",
      ),
    ).toBe(false);
  });

  it("knappeteksten består på highlightfargen i begge moduser", () => {
    const r = generateFromBrand(HONEYBEE);
    for (const c of [r.light, r.dark]) {
      const knapp = checkPalette(pal(c)).find(
        (x) => x.pair.id === "button-accent",
      )!;
      expect(knapp.ratio!).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("mørk logofarge blir bakgrunnen i mørk modus", () => {
  it("som på rollupen: marineblå flate, beige oppå", () => {
    const r = generateFromBrand(ERLING);
    expect(r.dark.background).toBe("#002245");
    expect(r.dark.primary).toBe("#C1B694");
    expect(r.notes).toContainEqual({
      kind: "logo-background",
      role: "primary",
      from: "#002245",
      to: "#C1B694",
    });
    const stryk = checkPalette(pal(r.dark)).filter((x) => x.level === "fail");
    expect(stryk).toEqual([]);
  });

  it("velger highlight foran støttefargene når den synes", () => {
    const r = generateFromBrand({
      logo: ["#002245"],
      support: ["#EEF4ED"],
      highlight: ["#C1B694"],
    });
    expect(r.dark.primary).toBe("#C1B694");
  });

  it("en mørk støttefarge går foran logofargen som bakgrunn", () => {
    const r = generateFromBrand({
      logo: ["#002245"],
      support: ["#F5EFE0", "#1A1A1A"],
    });
    expect(r.dark.background).toBe("#1A1A1A");
  });

  it("uten noen lys merkefarge å legge oppå beholdes den gamle løsningen", () => {
    const r = generateFromBrand({ logo: ["#002245"], support: [] });
    expect(r.dark.background).not.toBe("#002245");
  });
});

describe("retning (kundens føring)", () => {
  const logoer = [
    ["#002245"],
    ["#F2B705"],
    ["#C8102E", "#00843D"],
    ["#E4007C"],
  ];
  const stotte = [[], ["#F5EFE0", "#2B2B2B"], ["#C1B694", "#59A8BD"]];

  for (const d of DIRECTIONS) {
    it(`${d}: endrer ikke merkefargene og holder kontrastkravene`, () => {
      for (const logo of logoer) {
        for (const support of stotte) {
          const r = generateFromBrand({ logo, support, direction: d });
          expect(r.light.primary).toBe(normalizeHex(logo[0]));
          if (support[0]) expect(r.light.secondary).toBe(support[0]);
          for (const [modus, c] of [
            ["lys", r.light],
            ["mørk", r.dark],
          ] as const) {
            const stryk = checkPalette(pal(c)).filter(
              (x) =>
                x.level === "fail" &&
                // Samme unntak som i bredden over: lys logo som overskrift.
                !(modus === "lys" && x.pair.id === "heading-background"),
            );
            expect(
              stryk.map((x) => `${logo[0]} ${modus} ${x.pair.id}`),
            ).toEqual([]);
          }
        }
      }
    });
  }

  it("salgsfremmende gir hvit bakgrunn og tekst med minst 12:1", () => {
    const r = generateFromBrand({
      logo: ["#002245"],
      support: [],
      direction: "sales",
    });
    expect(r.light.background).toBe("#FFFFFF");
    expect(
      contrastRatio(r.light.foreground, r.light.background)!,
    ).toBeGreaterThanOrEqual(12);
  });

  it("eksklusiv demper dempet tekst og tilleggsfargene", () => {
    const n = generateFromBrand({ logo: ["#C8102E"], support: [] });
    const e = generateFromBrand({
      logo: ["#C8102E"],
      support: [],
      direction: "exclusive",
    });
    expect(hexToOklch(e.light.muted)!.c).toBeLessThan(
      hexToOklch(n.light.muted)!.c,
    );
    expect(hexToOklch(e.light.warm)!.c).toBeLessThan(
      hexToOklch(n.light.warm)!.c,
    );
  });

  it("ton i ton holder varm og kald nær hovedfargens tone", () => {
    const r = generateFromBrand({
      logo: ["#2E7D32"],
      support: [],
      direction: "tonal",
    });
    const h = hexToOklch("#2E7D32")!.h;
    for (const c of [r.light.warm, r.light.cool]) {
      expect(hueDistance(hexToOklch(c)!.h, h)).toBeLessThanOrEqual(25);
    }
  });

  it("en lys støttefarge fra manualen går foran retningens bakgrunn", () => {
    const r = generateFromBrand({
      logo: ["#002245"],
      support: ["#F5EFE0"],
      direction: "sales",
    });
    expect(r.light.background).toBe("#F5EFE0");
  });
});
