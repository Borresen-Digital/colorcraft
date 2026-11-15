import { describe, expect, it } from "vitest";
import { cssSlug, TONE_STEPS, toneCss, toneScale } from "./toneScale";
import { hexToOklch } from "./tones";

describe("tonetrapp 50–950", () => {
  it("har elleve trinn fra lys til mørk", () => {
    for (const hex of ["#002245", "#C1B694", "#59A8BD", "#DE2223", "#808080"]) {
      const s = toneScale(hex);
      expect(s.map((t) => t.step)).toEqual([...TONE_STEPS]);
      const l = s.map((t) => hexToOklch(t.hex)!.l);
      for (let i = 1; i < l.length; i++) {
        expect(l[i]).toBeLessThan(l[i - 1]);
      }
    }
  });

  it("setter fargen selv inn uendret på nærmeste trinn", () => {
    const navy = toneScale("#002245");
    expect(navy.filter((t) => t.base)).toHaveLength(1);
    expect(navy.find((t) => t.base)).toMatchObject({
      step: 950,
      hex: "#002245",
    });
    expect(toneScale("#59a8bd").find((t) => t.base)?.hex).toBe("#59A8BD");
  });

  it("velger tekstfarge etter kontrast", () => {
    const s = toneScale("#002245");
    expect(s[0].text).toBe("#000000");
    expect(s[s.length - 1].text).toBe("#FFFFFF");
  });

  it("gir tom trapp for ugyldig farge", () => {
    expect(toneScale("tull")).toEqual([]);
  });

  it("lager CSS-navn og variabler", () => {
    expect(cssSlug("Varm rørfarge")).toBe("varm-rorfarge");
    expect(cssSlug("Blåbær & Æble!")).toBe("blabaer-aeble");
    expect(cssSlug("Crème brûlée")).toBe("creme-brulee");
    expect(cssSlug("---")).toBe("farge");
    const css = toneCss("Dark blue", toneScale("#002245"));
    expect(css.split("\n")).toHaveLength(11);
    expect(css).toContain("--color-dark-blue-950: #002245;");
  });
});
