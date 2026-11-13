import { describe, expect, it } from "vitest";
import { cmykToHex } from "./cmyk";
import { contrastRatio } from "./contrast";
import { TINT_STEPS, tints } from "./tint";

describe("tints", () => {
  it("100 % er fargen selv, og resten blir lysere for hvert trinn", () => {
    const t = tints("#002245");
    expect(t.map((x) => x.percent)).toEqual([...TINT_STEPS]);
    expect(t[0].hex).toBe("#002245");
    for (let i = 1; i < t.length; i++) {
      expect(contrastRatio(t[i].hex, "#FFFFFF")!).toBeLessThan(
        contrastRatio(t[i - 1].hex, "#FFFFFF")!,
      );
    }
  });

  it("bruker CMYK fra manualen og skalerer alle trykkfargene", () => {
    const manual = { c: 100, m: 56, y: 6, k: 72 };
    const t = tints("#002245", manual, [100, 60]);
    expect(t[0].cmykText).toBe("100 56 6 72");
    expect(t[1].cmyk).toEqual({ c: 60, m: 34, y: 4, k: 43 });
    expect(t[1].cmykText).toBe("60 34 4 43");
    // Skjermfargen er den samme trykkmodellen regner ut for tallene.
    expect(t[1].hex).toBe(cmykToHex(t[1].cmyk));
  });

  it("gir tom liste for en ugyldig farge", () => {
    expect(tints("blå")).toEqual([]);
  });
});
