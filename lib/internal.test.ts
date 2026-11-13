import { describe, expect, it } from "vitest";
import { suggestInternal } from "./internal";
import { hexToOklch, hueDistance } from "./tones";

describe("suggestInternal", () => {
  it("gir fire farger bygd på hovedfargens tone", () => {
    const f = suggestInternal("#002245");
    expect(f).toHaveLength(4);
    const h = hexToOklch("#002245")!.h;
    const toner = f.map((c) => hexToOklch(c)!.h);
    // To naboer nær hovedfargen, og komplementen motsatt.
    expect(hueDistance(toner[0], h)).toBeLessThanOrEqual(40);
    expect(hueDistance(toner[1], h)).toBeLessThanOrEqual(40);
    expect(hueDistance(toner[2], h)).toBeGreaterThanOrEqual(150);
  });

  it("er fargerike nok til et diagram, og ulike i lyshet", () => {
    const f = suggestInternal("#002245").map((c) => hexToOklch(c)!);
    expect(f.every((o) => o.c >= 0.08)).toBe(true);
    expect(new Set(f.map((o) => o.l.toFixed(2))).size).toBeGreaterThan(2);
  });

  it("gir farger også for en grå hovedfarge", () => {
    const f = suggestInternal("#777777").map((c) => hexToOklch(c)!);
    expect(f.every((o) => o.c >= 0.08)).toBe(true);
  });
});
