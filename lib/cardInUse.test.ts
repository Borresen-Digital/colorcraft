import { describe, expect, it } from "vitest";
import { colorPalettes, type ExtendedColorPalette } from "@/data/palettes";
import { generateFromBrand } from "./brand";
import { renderPdf } from "./cardRender";
import { buildInUseModel, layoutInUse } from "./cardInUse";
import { buildCardModel, layoutCard, PAGE, type Op } from "./colorCard";

const brand = {
  logo: ["#002245"],
  support: ["#C1B694", "#9099A3", "#59A8BD"],
  cmyk: { "#002245": "100 56 6 72" },
  internal: ["#E4007C", "#00843D", "#F2B705", "#0891B2"],
};
const erling: ExtendedColorPalette = {
  id: "custom-eo",
  name: "Erling Olsen",
  description: "",
  colors: generateFromBrand(brand).light,
  brand,
};

/** Ytterkantene til en operasjon, for å sjekke at den holder seg på arket. */
function kant(op: Op) {
  if (op.kind === "circle")
    return {
      x0: op.cx - op.r,
      x1: op.cx + op.r,
      y0: op.cy - op.r,
      y1: op.cy + op.r,
    };
  if (op.kind === "rect")
    return { x0: op.x, x1: op.x + op.w, y0: op.y, y1: op.y + op.h };
  return { x0: op.x, x1: op.x, y0: op.y, y1: op.y };
}

describe("side 2: I bruk", () => {
  it("holder alt innenfor A4 og margene", () => {
    for (const p of [erling, colorPalettes[0]]) {
      for (const op of layoutInUse(buildInUseModel(p, "nb"), "nb")) {
        const k = kant(op);
        expect(k.x0).toBeGreaterThanOrEqual(PAGE.margin - 0.01);
        expect(k.x1).toBeLessThanOrEqual(PAGE.width - PAGE.margin + 0.01);
        expect(k.y0).toBeGreaterThanOrEqual(0);
        expect(k.y1).toBeLessThanOrEqual(PAGE.height - PAGE.margin + 0.01);
      }
    }
  });

  it("fyller logofargen med manualens CMYK, og resten med RGB", () => {
    const ops = layoutInUse(buildInUseModel(erling, "nb"), "nb");
    const navy = ops.find(
      (o) => o.kind === "rect" && o.fill?.hex === "#002245",
    );
    expect(navy?.kind === "rect" && navy.fill?.cmyk).toEqual({
      c: 100,
      m: 56,
      y: 6,
      k: 72,
    });
    const beige = ops.find(
      (o) => o.kind === "rect" && o.fill?.hex === "#C1B694",
    );
    expect(beige?.kind === "rect" && beige.fill?.cmyk).toBeUndefined();
  });

  it("tegner den interne presentasjonen bare når det finnes interne farger", () => {
    const med = layoutInUse(buildInUseModel(erling, "nb"), "nb");
    const uten = layoutInUse(buildInUseModel(colorPalettes[0], "nb"), "nb");
    const tekster = (ops: Op[]) =>
      ops.flatMap((o) => (o.kind === "text" ? [o.text] : []));
    expect(tekster(med)).toContain("Intern presentasjon");
    expect(tekster(uten)).not.toContain("Intern presentasjon");
    for (const farge of brand.internal) {
      expect(med.some((o) => o.kind === "rect" && o.fill?.hex === farge)).toBe(
        true,
      );
    }
  });

  it("har kontrastlisten med seks sjekker, på engelsk også", () => {
    const m = buildInUseModel(erling, "en");
    expect(m.checks).toHaveLength(6);
    expect(m.checks[0].label).toBe("Text on the main surface");
    expect(m.checks.every((s) => s.ok)).toBe(true);
  });

  it("lager en PDF med to sider", async () => {
    const bytes = await renderPdf(
      [
        layoutCard(buildCardModel(erling, "nb", "", new Date()), "nb"),
        layoutInUse(buildInUseModel(erling, "nb"), "nb"),
      ],
      erling.name,
    );
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(2);
  });
});
