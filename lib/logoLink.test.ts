import { describe, expect, it } from "vitest";
import {
  decodeLogo,
  encodeLogo,
  LOGO_PARAM,
  MAX_LOGO_CHARS,
  minifySvg,
  readLogoParam,
  withLogo,
} from "./logoLink";
import { decodeShare } from "./share";
import { withMaker } from "./profile";

const SVG = `<?xml version="1.0"?>
<!-- laget i et tegneprogram -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
  <metadata>noe</metadata>
  <rect width="40" height="40" fill="#002245"/>
  <text x="50" y="28">LOGO</text>
</svg>`;

const enc = (s: string) => new TextEncoder().encode(s);

describe("logoen i lenken", () => {
  it("minifiserer SVG uten å endre tegningen", () => {
    expect(minifySvg(SVG)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect width="40" height="40" fill="#002245"/><text x="50" y="28">LOGO</text></svg>',
    );
  });

  it("pakker og pakker ut en SVG", async () => {
    const verdi = await encodeLogo(enc(SVG), "image/svg+xml");
    expect(verdi).toMatch(/^s[A-Za-z0-9_-]+$/);
    const ut = await decodeLogo(verdi);
    expect(ut?.mime).toBe("image/svg+xml");
    expect(new TextDecoder().decode(ut!.bytes)).toBe(minifySvg(SVG));
  });

  it("tar bildefiler som de er", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4, 5]);
    const ut = await decodeLogo(await encodeLogo(bytes, "image/png"));
    expect(ut?.mime).toBe("image/png");
    expect([...ut!.bytes]).toEqual([...bytes]);
  });

  it("sier nei til ukjent type og for store logoer", async () => {
    expect(await encodeLogo(enc("x"), "image/gif")).toBeNull();
    // Tilfeldige bytes lar seg ikke komprimere.
    const stor = crypto.getRandomValues(new Uint8Array(MAX_LOGO_CHARS));
    expect(await encodeLogo(stor, "image/png")).toBeNull();
  });

  it("tåler ødelagte verdier", async () => {
    expect(await decodeLogo(null)).toBeNull();
    expect(await decodeLogo("")).toBeNull();
    expect(await decodeLogo("xABC")).toBeNull();
    expect(await decodeLogo("s!!!")).toBeNull();
    expect(await decodeLogo("sAAAA")).toBeNull();
  });

  it("pakker ikke ut mer enn grensen", async () => {
    // 1 MB nuller blir noen få kB komprimert, men skal ikke pakkes ut.
    const nuller = new Uint8Array(1024 * 1024);
    const s = new Blob([nuller])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const pakket = new Uint8Array(await new Response(s).arrayBuffer());
    let bin = "";
    for (const b of pakket) bin += String.fromCharCode(b);
    const verdi =
      "p" +
      btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(verdi.length).toBeLessThan(MAX_LOGO_CHARS);
    expect(await decodeLogo(verdi)).toBeNull();
  });

  it("legges i fragmentet uten å endre paletten eller «Laget av»", async () => {
    const hash = withMaker("p=havet", "Testdesign");
    const verdi = (await encodeLogo(enc(SVG), "image/svg+xml"))!;
    const med = withLogo(hash, verdi);
    expect(med).toContain(`${LOGO_PARAM}=`);
    expect(readLogoParam(med)).toBe(verdi);
    expect(decodeShare(med)).toEqual(decodeShare(hash));
    expect(withLogo(med, null)).toBe(hash);
  });
});
