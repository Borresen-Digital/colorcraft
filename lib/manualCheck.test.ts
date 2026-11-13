import { describe, expect, it } from "vitest";
import { checkManual, parseRgb } from "./manualCheck";

describe("parseRgb", () => {
  it("leser vanlige skrivemåter", () => {
    expect(parseRgb("144 153 163")).toBe("#9099A3");
    expect(parseRgb("144, 153, 163")).toBe("#9099A3");
    expect(parseRgb("R: 144 G: 153 B: 163")).toBe("#9099A3");
    expect(parseRgb("rgb(144,153,163)")).toBe("#9099A3");
  });
  it("avviser feil antall og tall over 255", () => {
    expect(parseRgb("144 153")).toBeNull();
    expect(parseRgb("300 0 0")).toBeNull();
  });
});

// Verdiene fra Mariannes testpalett for Erling Olsen (12.11.2026).
describe("checkManual", () => {
  it("fanger skrivefeilen i Kald rørfarge (B 64 i stedet for 163)", () => {
    const r = checkManual({
      hex: "#9099a3",
      rgb: "144 153 64",
      cmyk: "44 30 26 12",
    });
    expect(r.rgbMatchesHex).toBe(false);
    expect(r.rgbHex).toBe("#909940");
    // CMYK-tallene stemmer med HEX, så det er RGB som er feil.
    expect(r.cmyk!.verdict).toBe("like");
  });

  it("godtar alle de andre fargene i paletten", () => {
    for (const [hex, rgb, cmyk] of [
      ["#002245", "0 34 69", "100 56 6 72"],
      ["#c1b694", "193 182 148", "22 20 42 10"],
      ["#59a8bd", "89 168 189", "63 13 20 6"],
    ]) {
      const r = checkManual({ hex, rgb, cmyk });
      expect(r.rgbMatchesHex, hex).toBe(true);
      expect(r.cmyk!.verdict, hex).toBe("like");
    }
  });

  it("sier fra når CMYK er en helt annen farge", () => {
    const r = checkManual({ hex: "#002245", cmyk: "0 25 100 0" });
    expect(r.cmyk!.verdict).toBe("avvik");
  });

  it("måler CMYK mot RGB når HEX mangler, og melder felt som ikke kan leses", () => {
    const r = checkManual({ rgb: "0 34 69", cmyk: "100 56 6 72", hex: "tull" });
    expect(r.invalid).toEqual(["hex"]);
    expect(r.cmyk!.against).toBe("#002245");
  });
});
