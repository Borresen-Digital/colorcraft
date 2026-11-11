import { describe, expect, it } from "vitest";
import { generateFromBrand, mix, normalizeHex, ensureContrast } from "./brand";
import { contrastRatio } from "./contrast";
import { checkPalette } from "./contrastPairs";

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
              (n) => n.kind === "adjusted-dark" && n.role === "primary",
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
