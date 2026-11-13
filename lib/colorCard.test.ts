import { describe, expect, it } from "vitest";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { generateFromBrand } from "./brand";
import { renderPdf } from "./cardRender";
import {
  buildCardModel,
  cardFilename,
  layoutCard,
  PAGE,
  wrap,
  type Op,
} from "./colorCard";

const brand = {
  logo: ["#F8BA01"],
  support: ["#F5EFE0", "#2B2B2B"],
  cmyk: { "#F8BA01": "0 25 100 0" },
};
const r = generateFromBrand(brand);
const merke: ExtendedColorPalette = {
  id: "custom-1",
  name: "Honeybee-test",
  description: "",
  colors: r.light,
  brand,
};
const dato = new Date("2026-11-12T12:00:00Z");

describe("buildCardModel", () => {
  it("viser logofarger og støttefarger fra profilmanualen", () => {
    const m = buildCardModel(merke, "nb", "Honeybee Design", dato);
    expect(m.title).toBe("Honeybee-test");
    expect(m.subtitle).toBe("Fargekort · 12. november 2026");
    expect(m.sections.map((s) => s.heading)).toEqual([
      "Logofarger",
      "Støttefarger",
    ]);
    expect(m.sections[1].colors.map((c) => c.hex)).toEqual([
      "#F5EFE0",
      "#2B2B2B",
    ]);
    expect(m.footer[0]).toBe("Laget av Honeybee Design");
  });

  it("bruker CMYK fra manualen der den finnes, og omtrentlig ellers", () => {
    const m = buildCardModel(merke, "nb", "", dato);
    const logo = m.sections[0].colors[0];
    expect(logo.cmyk).toBe("0 25 100 0 (fra manualen)");
    expect(logo.cmykValue).toEqual({ c: 0, m: 25, y: 100, k: 0 });
    const støtte = m.sections[1].colors[0];
    expect(støtte.cmyk.startsWith("ca. ")).toBe(true);
    expect(støtte.cmykValue).toBeUndefined();
  });

  it("regner kontrast for hvit og svart tekst på hver farge", () => {
    const [mørk] = buildCardModel(
      merke,
      "nb",
      "",
      dato,
    ).sections[1].colors.slice(1);
    expect(mørk.onWhite).toBeGreaterThan(10);
    expect(mørk.onBlack).toBeLessThan(2);
  });

  it("bruker hovedrollene for paletter uten profilmanual", () => {
    const m = buildCardModel(colorPalettes[0], "en", "", dato);
    expect(m.sections).toHaveLength(1);
    expect(m.sections[0].heading).toBe("Main colors");
    expect(m.sections[0].colors.map((c) => c.label)).toEqual([
      "Primary",
      "Accent",
      "Secondary",
      "Background",
      "Foreground",
      "Muted",
    ]);
    expect(m.contrast).toHaveLength(7);
    expect(m.footer.some((l) => l.startsWith("Made by"))).toBe(false);
  });
});

/** Firkanter og tekst (side 1 har ingen sirkler). */
const uten = (ops: Op[]) =>
  ops.filter((o): o is Exclude<Op, { kind: "circle" }> => o.kind !== "circle");

describe("layoutCard", () => {
  it("holder alt innenfor A4 og margene", () => {
    for (const p of [merke, colorPalettes[0]]) {
      for (const op of uten(
        layoutCard(buildCardModel(p, "nb", "Honeybee", dato), "nb"),
      )) {
        expect(op.x).toBeGreaterThanOrEqual(PAGE.margin - 0.01);
        expect(op.y).toBeGreaterThanOrEqual(0);
        expect(op.y).toBeLessThanOrEqual(PAGE.height - PAGE.margin + 0.01);
        if (op.kind === "rect") {
          expect(op.x + op.w).toBeLessThanOrEqual(
            PAGE.width - PAGE.margin + 0.01,
          );
        }
      }
    }
  });

  it("får plass til fullt profilkort (3 logo- og 4 støttefarger) uten å nå bunnteksten", () => {
    const stor: ExtendedColorPalette = {
      ...merke,
      brand: {
        logo: ["#F8BA01", "#C8102E", "#00843D"],
        support: ["#F5EFE0", "#2B2B2B", "#8DA9C4", "#EEF4ED"],
      },
    };
    const ops = uten(
      layoutCard(buildCardModel(stor, "nb", "Honeybee", dato), "nb"),
    );
    const strek = ops.find((o) => o.kind === "rect" && o.h < 1)!;
    const innhold = ops.filter((o) => o !== strek && o.y < strek.y);
    const nederst = Math.max(
      ...innhold.map((o) => (o.kind === "rect" ? o.y + o.h : o.y)),
    );
    expect(nederst).toBeLessThan(strek.y);
  });
});

describe("renderPdf", () => {
  it("lager en PDF, også med tegn standardfonten ikke kan skrive", async () => {
    const p = { ...merke, name: "Bøkeskogen 🐝 mørk" };
    const bytes = await renderPdf(
      [layoutCard(buildCardModel(p, "nb", "Æsj Øl Å", dato), "nb")],
      p.name,
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });
});

describe("hjelpere", () => {
  it("bryter tekst mellom ord", () => {
    expect(wrap("en to tre fire", 7)).toEqual(["en to", "tre", "fire"]);
  });
  it("lager filnavn med språk", () => {
    expect(cardFilename("Bøkeskogen mørk", "nb", "pdf")).toBe(
      "fargekort-bokeskogen-mork.pdf",
    );
    expect(cardFilename("Havet", "en", "png")).toBe("color-card-havet.png");
  });
});

describe("CMYK i PDF-en", () => {
  it("legger manualens CMYK inn som CMYK-farge (operatoren k), ikke RGB", async () => {
    const { inflateSync } = await import("node:zlib");
    const bytes = Buffer.from(
      await renderPdf(
        [layoutCard(buildCardModel(merke, "nb", "", dato), "nb")],
        "x",
      ),
    );
    // Gå gjennom hver strøm i PDF-en og pakk ut de som er komprimert.
    const innhold: string[] = [];
    let fra = 0;
    for (;;) {
      const start = bytes.indexOf("stream", fra);
      if (start < 0) break;
      const data = start + (bytes[start + 6] === 0x0d ? 8 : 7);
      const slutt = bytes.indexOf("endstream", data);
      const rå = bytes.subarray(data, slutt);
      try {
        innhold.push(inflateSync(rå).toString("latin1"));
      } catch {
        innhold.push(rå.toString("latin1"));
      }
      fra = slutt + 9;
    }
    expect(innhold.join(" ")).toMatch(/0 0\.25 1 0 k/);
  });
});

describe("highlight og egne navn", () => {
  const b = {
    logo: ["#002245"],
    support: ["#C1B694"],
    highlight: ["#59A8BD"],
    names: { "#002245": "Dark blue", "#C1B694": "Varm rørfarge" },
  };
  const p: ExtendedColorPalette = {
    id: "custom-2",
    name: "Erling Olsen",
    description: "",
    colors: generateFromBrand(b).light,
    brand: b,
  };

  it("har en egen seksjon for highlight", () => {
    const m = buildCardModel(p, "nb", "", dato);
    expect(m.sections.map((s) => s.heading)).toEqual([
      "Logofarger",
      "Støttefarger",
      "Highlight",
    ]);
    expect(m.sections[2].colors[0].hex).toBe("#59A8BD");
  });

  it("bruker egne navn, og standardnavn der det mangler", () => {
    const m = buildCardModel(p, "nb", "", dato);
    expect(m.sections[0].colors[0].label).toBe("Dark blue");
    expect(m.sections[1].colors[0].label).toBe("Varm rørfarge");
    expect(m.sections[2].colors[0].label).toBe("Highlight 1");
  });

  it("lager en PDF med highlight-seksjonen", async () => {
    const bytes = await renderPdf(
      [layoutCard(buildCardModel(p, "nb", "", dato), "nb")],
      p.name,
    );
    expect(bytes.length).toBeGreaterThan(1000);
  });
});

describe("tint på fargekortet", () => {
  const b = {
    logo: ["#002245"],
    support: ["#C1B694"],
    cmyk: { "#002245": "100 56 6 72" },
  };
  const p: ExtendedColorPalette = {
    id: "custom-3",
    name: "Tint",
    description: "",
    colors: generateFromBrand(b).light,
    brand: b,
  };

  it("har 60, 40 og 20 % for merkefargene, med CMYK når den er fra manualen", () => {
    const m = buildCardModel(p, "nb", "", dato);
    const logo = m.sections[0].colors[0];
    expect(logo.tints.map((t) => t.percent)).toEqual([60, 40, 20]);
    expect(logo.tints[0].cmyk).toEqual({ c: 60, m: 34, y: 4, k: 43 });
    expect(m.sections[1].colors[0].tints[0].cmyk).toBeUndefined();
    expect(m.footer.some((l) => l.includes("tint"))).toBe(true);
  });

  it("tegner stripene innenfor fargeblokken", () => {
    const ops = layoutCard(buildCardModel(p, "nb", "", dato), "nb");
    const fylte = ops.filter((o) => o.kind === "rect" && o.fill);
    // Logofargen og tre striper fyller til sammen 92 pt i bredden.
    const rad = fylte.filter((o) => o.kind === "rect" && o.h === 92);
    expect(rad.length).toBe(8);
  });

  it("vanlige paletter uten manual får ingen striper", () => {
    const m = buildCardModel(colorPalettes[0], "nb", "", dato);
    expect(m.sections[0].colors.every((c) => c.tints.length === 0)).toBe(true);
    expect(m.footer.some((l) => l.includes("tint"))).toBe(false);
  });
});

describe("intern profil på fargekortet", () => {
  it("får en egen seksjon merket bare internt", () => {
    const b = {
      logo: ["#002245"],
      support: ["#C1B694"],
      internal: ["#E4007C", "#00843D"],
    };
    const p: ExtendedColorPalette = {
      id: "custom-4",
      name: "Intern",
      description: "",
      colors: generateFromBrand(b).light,
      brand: b,
    };
    const m = buildCardModel(p, "nb", "", dato);
    const s = m.sections.at(-1)!;
    expect(s.heading).toBe("Intern profil (bare internt)");
    expect(s.colors.map((c) => c.label)).toEqual(["Intern 1", "Intern 2"]);
  });
});
